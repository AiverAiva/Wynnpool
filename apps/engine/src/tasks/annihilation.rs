use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use chrono::{DateTime, Utc};
use futures_util::stream::TryStreamExt;
use mongodb::{
    bson::{doc, Bson, Document},
    options::{ClientOptions, FindOneOptions, FindOptions, IndexOptions, UpdateOptions},
    Client as MongoClient, IndexModel,
};

use crate::config::MONGODB_URI;
use crate::logger::log_event;
use wynnpool_engine_macros::fetch;

const ANNIHILATION_INTERNAL_NAME: &str = "Prelude to Annihilation";
const FORECAST_HORIZON: usize = 10;

/// Annihilation predictor.
///
/// The inter-event intervals are statistically indistinguishable from white
/// noise (cleaned data: std ~0.13d on a ~3.19d mean, lag-1 autocorr ~0,
/// Ljung-Box p > 0.3 at all lags). With no exploitable autocorrelation the
/// historical mean is the optimal point forecast under squared-error loss, so
/// this task is a pure mean-reversion projector — no statistical crate needed.
///
/// Each run: (1) append any newly-observed Annihilation event times from the
/// schedule snapshots, (2) recompute the mean-reversion forecast from
/// `world_event_history`, (3) upsert a single prediction doc.
#[fetch(interval = 300)]
fn update_annihilation() {
    tokio::spawn(async {
        if let Err(e) = run_update_annihilation().await {
            log_event(
                "ERROR",
                &format!("update_annihilation failed: {e}"),
                None,
            );
        }
    });
}

async fn run_update_annihilation() -> Result<()> {
    let whole_start = Instant::now();
    log_event("TASK", "updating annihilation prediction", None);

    // --- 1. MONGODB ---
    let mut client_options = ClientOptions::parse(MONGODB_URI.as_str()).await?;
    client_options.app_name = Some("wynnpool-engine".to_string());
    let client = MongoClient::with_options(client_options)?;
    let db = client.database("wynnpool");

    let schedules_coll = db.collection::<Document>("world_event_schedules");
    let history_coll = db.collection::<Document>("world_event_history");
    let predictions_coll = db.collection::<Document>("world_event_predictions");

    // Unique index on history.datetime_utc so duplicate appends are impossible.
    let hist_idx = IndexModel::builder()
        .keys(doc! { "datetime_utc": 1 })
        .options(IndexOptions::builder().unique(true).build())
        .build();
    let _ = history_coll.create_index(hist_idx, None).await;

    let now_ms: i64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    // --- 2. Detect + append newly-observed event times ---
    // `world_event_schedules` holds 24h-TTL snapshots of the `schedule` field
    // written by the world_events task. A `schedule` value that now lies in
    // the past represents a completed event — record it.
    let sched_filter = doc! {
        "internalName": ANNIHILATION_INTERNAL_NAME,
        "schedule": { "$ne": Bson::Null },
    };
    let sched_opts = FindOptions::builder()
        .sort(Some(doc! { "polledAt": 1 }))
        .build();
    let mut sched_cursor = schedules_coll.find(sched_filter, sched_opts).await?;

    let mut appended_count = 0usize;
    while let Some(sdoc) = sched_cursor.try_next().await? {
        if let Some(Bson::String(s)) = sdoc.get("schedule") {
            if let Some(ts_ms) = parse_schedule_to_ms(s) {
                if ts_ms < now_ms {
                    // Insert; ignore duplicate-key errors (unique index).
                    let res = history_coll
                        .insert_one(
                            doc! { "datetime_utc": ts_ms, "source": "observed" },
                            None,
                        )
                        .await;
                    if res.is_ok() {
                        appended_count += 1;
                    }
                }
            }
        }
    }

    // --- 3. Mean-reversion forecast from history ---
    let hist_opts = FindOptions::builder()
        .sort(Some(doc! { "datetime_utc": 1 }))
        .build();
    let mut hist_cursor = history_coll.find(None, hist_opts).await?;
    let mut timestamps: Vec<i64> = Vec::new();
    while let Some(hdoc) = hist_cursor.try_next().await? {
        if let Some(ts) = extract_i64(&hdoc, "datetime_utc") {
            timestamps.push(ts);
        }
    }

    if timestamps.len() < 2 {
        log_event(
            "SUMMARY",
            &format!(
                "annihilation: history too small ({} entries); appended={}, forecast skipped",
                timestamps.len(),
                appended_count,
            ),
            Some(whole_start.elapsed()),
        );
        return Ok(());
    }

    let intervals: Vec<i64> = timestamps.windows(2).map(|w| w[1] - w[0]).collect();
    let mean_interval_ms = intervals.iter().sum::<i64>() / intervals.len() as i64;
    let last_ts = *timestamps.last().unwrap();

    let predicted_ts: Vec<i64> = (1..=FORECAST_HORIZON as i64)
        .map(|i| last_ts + mean_interval_ms * i)
        .collect();

    // --- 4. Determine `current` (next upcoming event) ---
    // Prefer a live future schedule (observed → Accurate); else use the first
    // projected timestamp (Predicted).
    let mut current_ts = predicted_ts[0];
    let mut current_predicted = true;
    let live_filter = doc! {
        "internalName": ANNIHILATION_INTERNAL_NAME,
        "schedule": { "$ne": Bson::Null },
    };
    let live_opts = FindOneOptions::builder()
        .sort(Some(doc! { "polledAt": -1 }))
        .build();
    if let Some(latest) = schedules_coll
        .find_one(live_filter, Some(live_opts))
        .await?
    {
        if let Some(Bson::String(s)) = latest.get("schedule") {
            if let Some(ts) = parse_schedule_to_ms(s) {
                if ts > now_ms {
                    current_ts = ts;
                    current_predicted = false;
                }
            }
        }
    }

    // --- 5. Upsert single prediction doc ---
    let predicted_arr: Vec<Bson> = predicted_ts
        .iter()
        .map(|ts| {
            Bson::Document(doc! {
                "datetime_utc": ts,
                "predicted": true,
            })
        })
        .collect();

    let now_iso = Utc::now().to_rfc3339();

    let set_doc = doc! {
        "current": doc! {
            "datetime_utc": current_ts,
            "predicted": current_predicted,
        },
        "predicted": predicted_arr,
        "meanIntervalMs": mean_interval_ms,
        "historyCount": timestamps.len() as i64,
        "updatedAt": now_iso,
    };

    predictions_coll
        .update_one(
            doc! { "_id": "annihilation" },
            doc! { "$set": set_doc },
            UpdateOptions::builder().upsert(true).build(),
        )
        .await?;

    let whole_elapsed = whole_start.elapsed();
    log_event(
        "SUMMARY",
        &format!(
            "annihilation: history={}, appended={}, meanIntervalMs={}ms, currentPredicted={}, forecast={}",
            timestamps.len(),
            appended_count,
            mean_interval_ms,
            current_predicted,
            FORECAST_HORIZON,
        ),
        Some(whole_elapsed),
    );

    Ok(())
}

/// Tolerantly extract an i64 from any numeric-ish BSON field.
fn extract_i64(doc: &Document, field: &str) -> Option<i64> {
    match doc.get(field)? {
        Bson::Int64(n) => Some(*n),
        Bson::Int32(n) => Some(*n as i64),
        Bson::Double(n) => Some(*n as i64),
        Bson::DateTime(dt) => Some(dt.timestamp_millis()),
        _ => None,
    }
}

/// Parse a Wynncraft schedule string to epoch milliseconds.
/// Tries RFC3339 first, then a bare unix-seconds/millis number.
/// Returns None for unrecognised formats — callers treat that as "skip".
fn parse_schedule_to_ms(s: &str) -> Option<i64> {
    let trimmed = s.trim();
    if let Ok(dt) = DateTime::parse_from_rfc3339(trimmed) {
        return Some(dt.timestamp_millis());
    }
    if let Ok(n) = trimmed.parse::<i64>() {
        // Heuristic: values < 1e11 are seconds, else milliseconds.
        return Some(if n < 100_000_000_000 { n * 1000 } else { n });
    }
    None
}
