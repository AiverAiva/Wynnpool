use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use once_cell::sync::Lazy;
use reqwest::Client;
use serde_json::Value;

use mongodb::{
    bson::{doc, Bson, DateTime as BsonDateTime, Document},
    options::{ClientOptions, IndexOptions, UpdateOptions},
    Client as MongoClient, IndexModel,
};

use crate::config::MONGODB_URI;
use crate::logger::log_event;
use wynnpool_engine_macros::fetch;

static CLIENT: Lazy<Client> = Lazy::new(Client::new);

// 24 hours TTL for schedule snapshots
const SCHEDULE_TTL_SECS: i64 = 60 * 60 * 24;

#[fetch(interval = 120)]
fn update_world_events() {
    tokio::spawn(async {
        if let Err(e) = run_update_world_events().await {
            log_event(
                "ERROR",
                &format!("update_world_events failed: {e}"),
                None,
            );
        }
    });
}

async fn run_update_world_events() -> Result<()> {
    let whole_start = Instant::now();
    log_event("TASK", "fetching world events", None);

    // --- 1. HTTP FETCH ---
    let http_start = Instant::now();
    let resp: Value = CLIENT
        .get("https://api.wynncraft.com/v3/map/world-events")
        .send()
        .await?
        .json()
        .await?;
    let http_elapsed = http_start.elapsed();

    let events = resp
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("Expected JSON array from world events API"))?;

    // --- 2. MONGODB ---
    let mongo_start = Instant::now();

    let mut client_options = ClientOptions::parse(MONGODB_URI.as_str()).await?;
    client_options.app_name = Some("wynnpool-engine".to_string());
    let client = MongoClient::with_options(client_options)?;
    let db = client.database("wynnpool");

    let events_coll = db.collection::<Document>("world_events");
    let schedules_coll = db.collection::<Document>("world_event_schedules");
    let changelog_coll = db.collection::<Document>("world_event_changelog");

    // Ensure TTL index on schedules collection
    let idx = IndexModel::builder()
        .keys(doc! { "polledAt": 1 })
        .options(
            IndexOptions::builder()
                .expire_after(Some(std::time::Duration::from_secs(0)))
                .build(),
        )
        .build();
    let _ = schedules_coll.create_index(idx, None).await?;

    let now_ts: i64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let now_iso = chrono::Utc::now().to_rfc3339();

    // --- 3. Build static event docs + schedule entries ---
    let mut schedule_docs: Vec<Document> = Vec::with_capacity(events.len());
    let mut static_changes_count = 0usize;
    let mut static_added_count = 0usize;
    let mut static_unchanged_count = 0usize;

    for event in events {
        let internal_name = event["internalName"]
            .as_str()
            .unwrap_or("")
            .to_string();

        if internal_name.is_empty() {
            continue;
        }

        let schedule_value = event["schedule"].as_str().map(|s| s.to_string());

        // --- 3a. Schedule snapshot ---
        let expire_at = BsonDateTime::from_millis((now_ts + SCHEDULE_TTL_SECS) * 1000);
        schedule_docs.push(doc! {
            "internalName": internal_name.clone(),
            "schedule": schedule_value.clone().map(Bson::String).unwrap_or(Bson::Null),
            "polledAt": now_iso.clone(),
            "expireAt": expire_at,
        });

        // --- 3b. Static event data (upsert + diff) ---
        let new_doc = build_static_event_doc(event);

        let existing = events_coll
            .find_one(doc! { "internalName": &internal_name }, None)
            .await?;

        match existing {
            Some(old_doc) => {
                let changes = diff_event_docs(&old_doc, &new_doc);
                if !changes.is_empty() {
                    // Update static doc
                    events_coll
                        .update_one(
                            doc! { "internalName": &internal_name },
                            doc! { "$set": &new_doc },
                            UpdateOptions::builder().upsert(true).build(),
                        )
                        .await?;

                    // Write changelog
                    let event_name = event["name"].as_str().unwrap_or("Unknown");
                    changelog_coll
                        .insert_one(
                            doc! {
                                "internalName": &internal_name,
                                "eventName": event_name,
                                "changes": changes,
                                "changedAt": now_iso.clone(),
                            },
                            None,
                        )
                        .await?;

                    static_changes_count += 1;
                } else {
                    static_unchanged_count += 1;
                }
            }
            None => {
                // New event — insert static doc
                events_coll
                    .insert_one(&new_doc, None)
                    .await?;

                static_added_count += 1;
            }
        }
    }

    // --- 4. Batch insert schedule snapshots ---
    if !schedule_docs.is_empty() {
        schedules_coll.insert_many(schedule_docs, None).await?;
    }

    let mongo_elapsed = mongo_start.elapsed();
    let whole_elapsed = whole_start.elapsed();

    log_event(
        "SUMMARY",
        &format!(
            "world events: total={}, static: added={} changed={} unchanged={} | schedule snapshots={} (http={}ms, mongo={}ms)",
            events.len(),
            static_added_count,
            static_changes_count,
            static_unchanged_count,
            events.len(),
            http_elapsed.as_millis(),
            mongo_elapsed.as_millis(),
        ),
        Some(whole_elapsed),
    );

    Ok(())
}

/// Build a MongoDB document for static event data (everything except schedule).
fn build_static_event_doc(event: &Value) -> Document {
    let name = event["name"].as_str().unwrap_or("");
    let internal_name = event["internalName"].as_str().unwrap_or("");
    let lore = event["lore"].as_str().unwrap_or("");
    let difficulty = event["difficulty"].as_str().map(|s| Bson::String(s.to_string())).unwrap_or(Bson::Null);
    let level = event["level"].as_i64().map(Bson::Int64).unwrap_or(Bson::Null);
    let length = event["length"].as_str().map(|s| Bson::String(s.to_string())).unwrap_or(Bson::Null);

    let reward_per_level = if event["rewardPerLevel"].is_object() {
        let mut rpl = Document::new();
        if let Some(obj) = event["rewardPerLevel"].as_object() {
            for (k, v) in obj {
                if let Some(arr) = v.as_array() {
                    let bson_arr: Vec<Bson> = arr
                        .iter()
                        .filter_map(|item| item.as_str().map(|s| Bson::String(s.to_string())))
                        .collect();
                    rpl.insert(k.clone(), Bson::Array(bson_arr));
                }
            }
        }
        Bson::Document(rpl)
    } else {
        Bson::Null
    };

    let requirements = if let Some(arr) = event["requirements"].as_array() {
        let reqs: Vec<Bson> = arr
            .iter()
            .map(|req| {
                let mut d = Document::new();
                if let Some(t) = req["type"].as_str() {
                    d.insert("type", t);
                }
                match &req["value"] {
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            d.insert("value", Bson::Int64(i));
                        }
                    }
                    Value::String(s) => {
                        d.insert("value", s.as_str());
                    }
                    _ => {}
                }
                Bson::Document(d)
            })
            .collect();
        Bson::Array(reqs)
    } else {
        Bson::Null
    };

    let location = if let Some(arr) = event["location"].as_array() {
        let locs: Vec<Bson> = arr
            .iter()
            .map(|loc| {
                let mut d = Document::new();
                for field in &["event", "spawn", "reward"] {
                    if let Some(coord) = loc[*field].as_object() {
                        let mut cd = Document::new();
                        if let Some(x) = coord["x"].as_i64() {
                            cd.insert("x", Bson::Int64(x));
                        }
                        if let Some(y) = coord["y"].as_i64() {
                            cd.insert("y", Bson::Int64(y));
                        }
                        if let Some(z) = coord["z"].as_i64() {
                            cd.insert("z", Bson::Int64(z));
                        }
                        d.insert(*field, Bson::Document(cd));
                    } else {
                        d.insert(*field, Bson::Null);
                    }
                }
                if let Some(r) = loc["radius"].as_i64() {
                    d.insert("radius", Bson::Int64(r));
                }
                if let Some(sr) = loc["spawnRadius"].as_i64() {
                    d.insert("spawnRadius", Bson::Int64(sr));
                }
                Bson::Document(d)
            })
            .collect();
        Bson::Array(locs)
    } else {
        Bson::Array(vec![])
    };

    doc! {
        "name": name,
        "internalName": internal_name,
        "lore": lore,
        "difficulty": difficulty,
        "level": level,
        "length": length,
        "rewardPerLevel": reward_per_level,
        "requirements": requirements,
        "location": location,
    }
}

/// Compare old and new static event documents, return changelog entries as Bson array.
fn diff_event_docs(old: &Document, new: &Document) -> Vec<Bson> {
    let fields = [
        "name", "lore", "difficulty", "level", "length",
        "rewardPerLevel", "requirements", "location",
    ];

    let mut changes: Vec<Bson> = Vec::new();

    for field in &fields {
        let old_val = old.get(*field);
        let new_val = new.get(*field);

        let is_different = match (old_val, new_val) {
            (Some(a), Some(b)) => !bson_values_equal(a, b),
            (None, None) => false,
            _ => true,
        };

        if is_different {
            let mut change_doc = doc! {
                "field": *field,
            };
            match old_val {
                Some(v) => { change_doc.insert("before", v.clone()); }
                None => { change_doc.insert("before", Bson::Null); }
            }
            match new_val {
                Some(v) => { change_doc.insert("after", v.clone()); }
                None => { change_doc.insert("after", Bson::Null); }
            }
            changes.push(Bson::Document(change_doc));
        }
    }

    changes
}

/// Shallow equality check for Bson values (handles nested documents/arrays).
fn bson_values_equal(a: &Bson, b: &Bson) -> bool {
    match (a, b) {
        (Bson::Document(da), Bson::Document(db)) => {
            if da.len() != db.len() {
                return false;
            }
            for (key, val_a) in da {
                match db.get(key) {
                    Some(val_b) if bson_values_equal(val_a, val_b) => {}
                    _ => return false,
                }
            }
            true
        }
        (Bson::Array(aa), Bson::Array(ab)) => {
            if aa.len() != ab.len() {
                return false;
            }
            aa.iter().zip(ab.iter()).all(|(va, vb)| bson_values_equal(va, vb))
        }
        _ => a == b,
    }
}
