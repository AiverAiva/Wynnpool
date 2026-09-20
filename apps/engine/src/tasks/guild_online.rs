//! Guild online-member counts and the guild membership table they are computed from.
//!
//! This replaces the Python `update_last_seen.py` / `player.py` / `guild.py` chain,
//! which ran on GitHub Actions crons that GitHub was delivering a handful of times
//! per day instead of every five minutes.
//!
//! Two independent failures had to be fixed, which is why there are two tasks:
//!
//! 1. **Sampling.** `update_last_seen.py` took ~8 samples/day. Here the count task
//!    runs every 60s.
//! 2. **Membership freshness.** Counts are an intersection of the online player set
//!    with guild membership, and that membership came from `guild_data`, which the
//!    crawl workflow refreshed for ~205 of 18,105 guilds per day (median age of the
//!    membership table for an *active* guild: 6.6 days). Moving only the count task
//!    would have produced denser data computed against the same stale table, which is
//!    harder to notice than an obviously broken graph. The membership task fixes that.
//!
//! Counts are stored as fixed-size buckets rather than raw samples. That costs some
//! resolution -- the working pre-regression pipeline plotted one point per 5-minute
//! poll -- but it bounds storage, and a bucket is still fully self-describing: a
//! bucket with `samples > 0` and `countMax == 0` is a genuine "nobody online", while
//! a missing bucket means "not sampled". The previous model could not express that
//! distinction, which is why the chart ended up filling gaps with fabricated zeroes.
//!
//! `BUCKET_SECS` holds the bucket size and the storage arithmetic behind it.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use futures_util::future::join_all;
use futures_util::stream::TryStreamExt;
use mongodb::bson::{doc, DateTime as BsonDateTime, Document};
use mongodb::options::{ClientOptions, FindOptions, IndexOptions, UpdateOptions};
use mongodb::{Client as MongoClient, IndexModel};
use once_cell::sync::Lazy;
use tokio::sync::{Mutex, RwLock};

use crate::config::MONGODB_URI;
use crate::logger::log_event;
use crate::wapi;
use wynnpool_engine_macros::fetch;

const DB_NAME: &str = "wynnpool";

/// Bucketed online counts. Distinct from the legacy `guild_online_count`
/// collection, which holds raw per-tick samples and is left untouched so the old
/// path can be compared against the new one before anything is retired.
const COLL_BUCKET: &str = "guild_online_bucket";

/// Single document recording the last successful tick, so a stalled collector is
/// visible instead of silently looking like "nobody is online".
const COLL_HEARTBEAT: &str = "guild_online_heartbeat";

/// Existing collection, read once to seed membership so we do not cold-start with
/// an empty map.
const COLL_GUILD_DATA: &str = "guild_data";

/// Bucket size for the online-count series.
///
/// The count task samples every 60s, so one bucket holds up to 15 samples. At this
/// size the 14-day retention the web UI offers works out at roughly 320k documents
/// (~40MB); at 5 minutes it would be ~960k documents (~120MB), which is close to
/// doubling the whole database. The API and the chart both treat `bucket` as an
/// opaque timestamp, so changing this affects only storage and resolution.
const BUCKET_SECS: i64 = 15 * 60;

/// Buckets are kept as long as the widest window the web UI offers.
const BUCKET_TTL_SECS: i64 = 14 * 24 * 60 * 60;

/// A guild stays "hot" for this long after it was last seen with at least one
/// member online. Hot guilds keep getting a bucket row every tick even when the
/// count is zero, so `samples` is a real sample count and a zero is a real
/// observation rather than an absence.
const HOT_WINDOW_SECS: i64 = 24 * 60 * 60;

/// Do not re-fetch a hot guild more often than this. This is the knob that trades
/// membership freshness against API budget.
const HOT_MIN_REFRESH_SECS: i64 = 20 * 60;

/// Guild fetches allowed per membership run. At the 300s interval this is ~40 req/min,
/// which sits comfortably inside the 120 req/min the API key allows while leaving the
/// count task and `server_status` their share.
const MEMBERSHIP_BUDGET: usize = 200;

/// Concurrent Mongo writes. The driver has no `bulk_write` in this version, so
/// upserts are issued concurrently in bounded batches.
const WRITE_CHUNK: usize = 50;

/// Below this many guilds, treat a guild-list response as suspect and skip the
/// prune step rather than wiping state on a bad response.
const MIN_PLAUSIBLE_GUILD_LIST: usize = 1000;

struct GuildEntry {
    name: String,
    member_uuids: HashSet<String>,
    /// Unix seconds of our last successful fetch. 0 means "never fetched by us".
    refreshed_at: i64,
}

#[derive(Default)]
struct State {
    /// guild_uuid -> membership
    guilds: HashMap<String, GuildEntry>,
    /// member_uuid -> guild_uuid. Driving the count off this instead of scanning
    /// every guild's member set makes a tick O(online players) (~1000 lookups)
    /// rather than O(all members) (~500k), and it self-corrects: when a member
    /// turns up in a different guild, the index points at the guild that was
    /// refreshed most recently.
    member_index: HashMap<String, String>,
    /// guild_uuid -> guild name, authoritative from /v3/guild/list/guild.
    live: HashMap<String, String>,
    /// guild_uuid -> last tick where it had at least one member online.
    hot_until: HashMap<String, i64>,
    seeded: bool,
    indexed: bool,
    last_membership_run: i64,
}

static STATE: Lazy<RwLock<State>> = Lazy::new(|| RwLock::new(State::default()));

static COUNT_RUNNING: AtomicBool = AtomicBool::new(false);
static MEMBERSHIP_RUNNING: AtomicBool = AtomicBool::new(false);
static LIST_RUNNING: AtomicBool = AtomicBool::new(false);
static SEED_LOCK: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn bucket_start(ts: i64) -> i64 {
    ts - ts.rem_euclid(BUCKET_SECS)
}

async fn mongo_client() -> Result<MongoClient> {
    let mut options = ClientOptions::parse(MONGODB_URI.as_str()).await?;
    options.app_name = Some("wynnpool-engine".to_string());
    Ok(MongoClient::with_options(options)?)
}

// ---------------------------------------------------------------------------
// count task
// ---------------------------------------------------------------------------

#[fetch(interval = 60)]
fn update_guild_online_count() {
    tokio::spawn(async {
        if let Err(e) = run_update_guild_online_count().await {
            log_event("ERROR", &format!("update_guild_online_count failed: {e}"), None);
        }
    });
}

async fn run_update_guild_online_count() -> Result<()> {
    // The callback returns immediately and the real work is detached, so a slow
    // run would otherwise overlap the next one.
    if COUNT_RUNNING.swap(true, Ordering::SeqCst) {
        log_event("WARN", "guild online count: previous tick still running, skipping", None);
        return Ok(());
    }
    let result = update_guild_online_count_inner().await;
    COUNT_RUNNING.store(false, Ordering::SeqCst);
    result
}

async fn update_guild_online_count_inner() -> Result<()> {
    let started = Instant::now();
    ensure_seeded().await?;

    let online = wapi::fetch_online_uuids().await?;
    let online_set: HashSet<&str> = online.iter().map(String::as_str).collect();

    let now = now_secs();
    let bucket = bucket_start(now);

    // Tally per guild via the reverse index, under a read lock only.
    let mut counts: HashMap<String, i64> = HashMap::new();
    {
        let state = STATE.read().await;
        for uuid in &online {
            if let Some(guild_uuid) = state.member_index.get(uuid) {
                *counts.entry(guild_uuid.clone()).or_insert(0) += 1;
            }
        }
    }

    let (rows, tracked, hot) = {
        let mut state = STATE.write().await;
        for guild_uuid in counts.keys() {
            state.hot_until.insert(guild_uuid.clone(), now);
        }

        let mut rows: Vec<(String, String, i64)> = Vec::with_capacity(counts.len());
        for (guild_uuid, count) in &counts {
            let name = state
                .guilds
                .get(guild_uuid)
                .map(|entry| entry.name.clone())
                .or_else(|| state.live.get(guild_uuid).cloned())
                .unwrap_or_default();
            rows.push((guild_uuid.clone(), name, *count));
        }

        // Explicit zeroes for the rest of the hot set, so "0 online" is recorded
        // instead of being inferred from a missing row.
        let mut hot = 0usize;
        for (guild_uuid, last_online) in state.hot_until.iter() {
            if *last_online + HOT_WINDOW_SECS <= now {
                continue;
            }
            hot += 1;
            if counts.contains_key(guild_uuid) {
                continue;
            }
            let name = state
                .guilds
                .get(guild_uuid)
                .map(|entry| entry.name.clone())
                .or_else(|| state.live.get(guild_uuid).cloned())
                .unwrap_or_default();
            rows.push((guild_uuid.clone(), name, 0));
        }

        (rows, state.guilds.len(), hot)
    };

    ensure_indexes().await?;

    let expire_at = BsonDateTime::from_millis((bucket + BUCKET_TTL_SECS) * 1000);
    let collection = mongo_client()
        .await?
        .database(DB_NAME)
        .collection::<Document>(COLL_BUCKET);

    let mut write_errors = 0usize;
    for chunk in rows.chunks(WRITE_CHUNK) {
        let futures = chunk.iter().map(|(guild_uuid, guild_name, count)| {
            let collection = collection.clone();
            let guild_uuid = guild_uuid.clone();
            let guild_name = guild_name.clone();
            let count = *count;
            async move {
                let filter = doc! { "guild_uuid": &guild_uuid, "bucket": bucket };
                // `samples` counts every tick for this guild, including explicit
                // zeroes; `activeSamples` counts only the ticks where someone was
                // online. Because zero counts add nothing to `countSum`, both the
                // true time-average (countSum/samples) and the "average while
                // someone was online" (countSum/activeSamples) stay computable
                // without re-collecting anything. A bucket spans BUCKET_SECS, so
                // samples is capped at BUCKET_SECS / 60.
                let active = if count > 0 { 1i64 } else { 0i64 };
                let update = doc! {
                    "$inc": { "samples": 1i64, "activeSamples": active, "countSum": count },
                    "$max": { "countMax": count },
                    "$setOnInsert": { "guild_name": guild_name, "expireAt": expire_at },
                };
                collection
                    .update_one(filter, update, UpdateOptions::builder().upsert(true).build())
                    .await
            }
        });

        for result in join_all(futures).await {
            if let Err(e) = result {
                write_errors += 1;
                if write_errors <= 3 {
                    log_event("ERROR", &format!("guild online bucket write failed: {e}"), None);
                }
            }
        }
    }

    let elapsed = started.elapsed();
    let matched = online_set.len();

    write_heartbeat(&collection.client(), now, matched, tracked, counts.len(), hot, rows.len(), write_errors, elapsed.as_millis() as i64).await;

    log_event(
        "SUMMARY",
        &format!(
            "guild online: players={matched} tracked_guilds={tracked} with_online={} hot={hot} rows={} errors={write_errors}",
            counts.len(),
            rows.len()
        ),
        Some(elapsed),
    );

    Ok(())
}

async fn ensure_indexes() -> Result<()> {
    {
        if STATE.read().await.indexed {
            return Ok(());
        }
    }

    let collection = mongo_client()
        .await?
        .database(DB_NAME)
        .collection::<Document>(COLL_BUCKET);

    let ttl = IndexModel::builder()
        .keys(doc! { "expireAt": 1 })
        .options(IndexOptions::builder().expire_after(Some(std::time::Duration::from_secs(0))).build())
        .build();

    // Makes the per-tick upsert idempotent: without it, two racing upserts for the
    // same (guild, bucket) could both insert.
    let unique = IndexModel::builder()
        .keys(doc! { "guild_uuid": 1, "bucket": 1 })
        .options(IndexOptions::builder().unique(Some(true)).build())
        .build();

    collection.create_indexes(vec![ttl, unique], None).await?;

    STATE.write().await.indexed = true;
    log_event("TASK", "guild online: bucket indexes ensured", None);
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn write_heartbeat(
    client: &MongoClient,
    now: i64,
    online_players: usize,
    tracked_guilds: usize,
    guilds_with_online: usize,
    hot_guilds: usize,
    rows_written: usize,
    write_errors: usize,
    took_ms: i64,
) {
    let collection = client
        .database(DB_NAME)
        .collection::<Document>(COLL_HEARTBEAT);

    let (last_membership_run, live_guilds) = {
        let state = STATE.read().await;
        (state.last_membership_run, state.live.len())
    };

    let update = doc! {
        "$set": {
            "_id": "guild_online_count",
            "lastSuccess": now,
            "onlinePlayers": online_players as i64,
            "trackedGuilds": tracked_guilds as i64,
            "liveGuilds": live_guilds as i64,
            "guildsWithOnline": guilds_with_online as i64,
            "hotGuilds": hot_guilds as i64,
            "rowsWritten": rows_written as i64,
            "writeErrors": write_errors as i64,
            "lastMembershipRun": last_membership_run,
            "tookMs": took_ms,
            "engine": "wynnpool-engine",
        }
    };

    if let Err(e) = collection
        .update_one(doc! { "_id": "guild_online_count" }, update, UpdateOptions::builder().upsert(true).build())
        .await
    {
        log_event("ERROR", &format!("guild online heartbeat write failed: {e}"), None);
    }
}

// ---------------------------------------------------------------------------
// membership tasks
// ---------------------------------------------------------------------------

#[fetch(interval = 300)]
fn refresh_guild_membership() {
    tokio::spawn(async {
        if let Err(e) = run_refresh_guild_membership().await {
            log_event("ERROR", &format!("refresh_guild_membership failed: {e}"), None);
        }
    });
}

async fn run_refresh_guild_membership() -> Result<()> {
    if MEMBERSHIP_RUNNING.swap(true, Ordering::SeqCst) {
        log_event("WARN", "guild membership: previous run still going, skipping", None);
        return Ok(());
    }
    let result = refresh_guild_membership_inner().await;
    MEMBERSHIP_RUNNING.store(false, Ordering::SeqCst);
    result
}

async fn refresh_guild_membership_inner() -> Result<()> {
    let started = Instant::now();
    ensure_seeded().await?;

    let now = now_secs();

    // On a cold start, and whenever the guild-list task has not succeeded yet, the
    // live set is empty and there is nothing to rotate over. Both tasks start at the
    // same time, so without this the first membership run would no-op and wait a full
    // interval. Fetch the list inline instead.
    if STATE.read().await.live.is_empty() {
        if let Err(e) = refresh_guild_list_inner().await {
            log_event("WARN", &format!("guild membership: guild list unavailable: {e}"), None);
        }
    }

    // Hot guilds first (those with recent online activity), then everything else
    // oldest-refresh-first. Sorting by refreshed_at makes the rotation converge on
    // the stalest guilds, which under the old pipeline were the ones that sat
    // untouched for months.
    let candidates: Vec<(String, String)> = {
        let state = STATE.read().await;
        let mut hot: Vec<(i64, String, String)> = Vec::new();
        let mut cold: Vec<(i64, String, String)> = Vec::new();

        for (guild_uuid, name) in state.live.iter() {
            let refreshed_at = state
                .guilds
                .get(guild_uuid)
                .map(|entry| entry.refreshed_at)
                .unwrap_or(0);
            let is_hot = state
                .hot_until
                .get(guild_uuid)
                .map(|at| *at + HOT_WINDOW_SECS > now)
                .unwrap_or(false);

            if is_hot && now - refreshed_at >= HOT_MIN_REFRESH_SECS {
                hot.push((refreshed_at, guild_uuid.clone(), name.clone()));
            } else {
                cold.push((refreshed_at, guild_uuid.clone(), name.clone()));
            }
        }

        hot.sort();
        cold.sort();
        let mut ordered: Vec<(String, String)> = hot
            .into_iter()
            .chain(cold)
            .map(|(_, uuid, name)| (uuid, name))
            .collect();
        ordered.truncate(MEMBERSHIP_BUDGET);
        ordered
    };

    if candidates.is_empty() {
        log_event("WARN", "guild membership: no candidates (guild list empty?)", None);
        return Ok(());
    }

    let mut refreshed = 0usize;
    let mut failed = 0usize;

    for (guild_uuid, guild_name) in candidates {
        match wapi::fetch_guild_members(&guild_name).await {
            Ok(guild) => {
                let mut state = STATE.write().await;
                // Drop the old reverse-index entries before inserting the new ones,
                // otherwise members who left would keep pointing at this guild.
                let previous: Vec<String> = state
                    .guilds
                    .get(&guild_uuid)
                    .map(|entry| entry.member_uuids.iter().cloned().collect())
                    .unwrap_or_default();
                for member in previous {
                    if state.member_index.get(&member).map(|g| g == &guild_uuid).unwrap_or(false) {
                        state.member_index.remove(&member);
                    }
                }

                let member_uuids: HashSet<String> = guild.member_uuids.into_iter().collect();
                for member in member_uuids.iter() {
                    state.member_index.insert(member.clone(), guild_uuid.clone());
                }
                state.guilds.insert(
                    guild_uuid.clone(),
                    GuildEntry { name: guild.name, member_uuids, refreshed_at: now_secs() },
                );
                refreshed += 1;
            }
            Err(e) => {
                failed += 1;
                if failed <= 3 {
                    log_event(
                        "ERROR",
                        &format!("guild membership fetch failed for '{guild_name}': {e}"),
                        None,
                    );
                }
                // Record the attempt so a persistently broken name cannot monopolise
                // the budget by sorting to the front every run.
                let mut state = STATE.write().await;
                state
                    .guilds
                    .entry(guild_uuid)
                    .or_insert_with(|| GuildEntry {
                        name: guild_name.clone(),
                        member_uuids: HashSet::new(),
                        refreshed_at: 0,
                    })
                    .refreshed_at = now_secs();
            }
        }
    }

    let guild_count = {
        let mut state = STATE.write().await;
        state.last_membership_run = now_secs();
        state.guilds.len()
    };

    let elapsed = started.elapsed();
    log_event(
        "SUMMARY",
        &format!("guild membership: refreshed={refreshed} failed={failed} total_tracked={guild_count}"),
        Some(elapsed),
    );

    Ok(())
}

#[fetch(interval = 3600)]
fn refresh_guild_list() {
    tokio::spawn(async {
        if let Err(e) = run_refresh_guild_list().await {
            log_event("ERROR", &format!("refresh_guild_list failed: {e}"), None);
        }
    });
}

async fn run_refresh_guild_list() -> Result<()> {
    if LIST_RUNNING.swap(true, Ordering::SeqCst) {
        return Ok(());
    }
    let result = refresh_guild_list_inner().await;
    LIST_RUNNING.store(false, Ordering::SeqCst);
    result
}

async fn refresh_guild_list_inner() -> Result<()> {
    let started = Instant::now();
    let guilds = wapi::fetch_guild_list().await?;
    let live: HashMap<String, String> = guilds.into_iter().map(|(name, uuid)| (uuid, name)).collect();

    let mut pruned = 0usize;
    {
        let mut state = STATE.write().await;
        let should_prune = live.len() >= MIN_PLAUSIBLE_GUILD_LIST;
        state.live = live.clone();

        if should_prune {
            // Guilds that no longer exist: drop them and their reverse-index entries,
            // otherwise a defunct guild keeps claiming members who have moved on.
            let stale: Vec<String> = state
                .guilds
                .keys()
                .filter(|uuid| !live.contains_key(*uuid))
                .cloned()
                .collect();
            for uuid in stale {
                if let Some(entry) = state.guilds.remove(&uuid) {
                    for member in entry.member_uuids {
                        if state.member_index.get(&member).map(|g| g == &uuid).unwrap_or(false) {
                            state.member_index.remove(&member);
                        }
                    }
                    pruned += 1;
                }
            }
        }
    }

    log_event(
        "SUMMARY",
        &format!("guild list: live={} pruned_defunct={pruned}", live.len()),
        Some(started.elapsed()),
    );

    Ok(())
}

// ---------------------------------------------------------------------------
// seed
// ---------------------------------------------------------------------------

/// Populate membership from the existing `guild_data` collection so the first
/// count tick has something to work with before the rotation has covered the
/// guild list. `guild_data.timestamp` is carried over as `refreshed_at`, which
/// makes the rotation prioritise the guilds the old crawl workflow had abandoned
/// longest.
async fn ensure_seeded() -> Result<()> {
    if STATE.read().await.seeded {
        return Ok(());
    }

    let _guard = SEED_LOCK.lock().await;
    if STATE.read().await.seeded {
        return Ok(());
    }

    let started = Instant::now();
    let collection = mongo_client()
        .await?
        .database(DB_NAME)
        .collection::<Document>(COLL_GUILD_DATA);

    let options = FindOptions::builder()
        .projection(doc! { "uuid": 1, "name": 1, "members": 1, "timestamp": 1 })
        .build();
    let mut cursor = collection.find(None, options).await?;

    let mut guilds: HashMap<String, GuildEntry> = HashMap::new();
    let mut member_index: HashMap<String, String> = HashMap::new();
    let mut members_total = 0usize;

    while let Some(guild_doc) = cursor.try_next().await? {
        let Ok(uuid) = guild_doc.get_str("uuid") else {
            continue;
        };
        let uuid = uuid.to_string();
        let name = guild_doc.get_str("name").unwrap_or_default().to_string();
        let refreshed_at = guild_doc.get_i64("timestamp").unwrap_or(0);

        let mut member_uuids = HashSet::new();
        if let Ok(members) = guild_doc.get_document("members") {
            for (rank, value) in members.iter() {
                if rank == "total" {
                    continue;
                }
                if let Some(map) = value.as_document() {
                    member_uuids.extend(map.keys().cloned());
                }
            }
        }

        members_total += member_uuids.len();
        for member in member_uuids.iter() {
            member_index.insert(member.clone(), uuid.clone());
        }
        guilds.insert(uuid, GuildEntry { name, member_uuids, refreshed_at });
    }

    let guild_count = guilds.len();
    {
        let mut state = STATE.write().await;
        state.guilds = guilds;
        state.member_index = member_index;
        state.seeded = true;
    }

    log_event(
        "TASK",
        &format!("guild online: seeded {guild_count} guilds / {members_total} member uuids from guild_data"),
        Some(started.elapsed()),
    );

    Ok(())
}
