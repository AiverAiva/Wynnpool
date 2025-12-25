use std::collections::{HashMap, HashSet};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use once_cell::sync::Lazy;
use reqwest::Client;
use serde_json::Value;

use mongodb::{bson::{doc, Bson, DateTime as BsonDateTime, Document}, options::FindOptions, options::ClientOptions, Client as MongoClient, IndexModel};
use mongodb::options::IndexOptions;
use futures_util::stream::TryStreamExt;
use std::time::Duration;

use crate::logger::log_event;
use crate::config::MONGODB_URI;
use wynnpool_engine_macros::fetch;

static CLIENT: Lazy<Client> = Lazy::new(Client::new);

// 12 hours TTL for server data
const SERVER_DATA_TTL_SECS: i64 = 60 * 60 * 12;
// Delete a server only if it's been offline for more than 1 minutes
const OFFLINE_DELETE_SECS: i64 = 60 * 1;

#[fetch(interval = 35)]
fn update_server_status_new() {
    tokio::spawn(async {
        if let Err(e) = run_update_server_status_new().await {
            log_event("ERROR", &format!("update_server_status_new failed: {e}"), None);
        }
    });
}

async fn run_update_server_status_new() -> Result<()> {
    let whole_start = Instant::now();
    log_event("TASK", "fetching server list", None);

    // --- 1. HTTP FETCH ---
    let http_start = Instant::now();
    let resp: Value = CLIENT
        .get("https://api.wynncraft.com/v3/player")
        .send()
        .await?
        .json()
        .await?;
    let http_elapsed = http_start.elapsed();

    let players = resp["players"]
        .as_object()
        .ok_or_else(|| anyhow::anyhow!("Invalid players format"))?;

    // Build server → player list map
    let mut servers: HashMap<String, Vec<String>> = HashMap::new();
    for (player_name, server_name_value) in players {
        let server = server_name_value
            .as_str()
            .unwrap_or("UNKNOWN")
            .to_string();

        servers.entry(server).or_default().push(player_name.clone());
    }

    let current_servers: HashSet<String> = servers.keys().cloned().collect();

    // --- 2. MONGODB PART ---
    let mongo_start = Instant::now();

    let mut client_options = ClientOptions::parse(MONGODB_URI.as_str()).await?;
    client_options.app_name = Some("wynnpool-engine".to_string());
    let client = MongoClient::with_options(client_options)?;
    let db = client.database("wynnpool");
    let coll = db.collection::<Document>("wynncraft_servers");

    // Ensure TTL index on `expireAt` so documents are removed by MongoDB after expiry
    let idx = IndexModel::builder()
        .keys(doc! { "expireAt": 1 })
        .options(IndexOptions::builder().expire_after(Some(Duration::from_secs(0))).build())
        .build();
    let _ = coll.create_index(idx, None).await?;

    // Fetch existing server docs
    let mut existing_servers: Vec<String> = Vec::new();
    let mut existing_info: HashMap<String, Document> = HashMap::new();

    let find_opts = FindOptions::builder().build();
    let mut cursor = coll.find(None, find_opts).await?;
    while let Some(doc) = cursor.try_next().await? {
        if let Some(Bson::String(name)) = doc.get("server") {
            existing_servers.push(name.clone());
            existing_info.insert(name.clone(), doc);
        }
    }

    let existing_set: HashSet<String> = existing_servers.iter().cloned().collect();

    // Counters + lists for summary
    let mut removed_count = 0usize;
    let mut added_count = 0usize;
    let mut unchanged_count = 0usize;
    let mut removed_servers_list: Vec<String> = Vec::new();
    let mut added_servers_list: Vec<String> = Vec::new();

    let now_ts: i64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    // 2a. Existing servers that are *missing* from current API → offline or delete
    for existing in &existing_servers {
        if !current_servers.contains(existing) {
            let prev = existing_info.get(existing);
            let first_seen = prev
                .and_then(|v| v.get_i64("firstSeen").ok())
                .unwrap_or(now_ts);

            let offline_since = prev
                .and_then(|v| v.get_i64("offlineSince").ok())
                .unwrap_or(now_ts);

            let offline_duration = now_ts - offline_since;

            if offline_duration > OFFLINE_DELETE_SECS {
                // Hard delete after being offline for > 1 minutes
                coll.delete_one(doc! { "server": existing.clone() }, None).await?;

                removed_count += 1;
                removed_servers_list.push(existing.clone());
            } else {
                // Keep it in DB but mark as offline
                let expire_at = BsonDateTime::from_millis((now_ts + SERVER_DATA_TTL_SECS) * 1000);

                let update = doc! {
                    "$set": {
                        "server": existing.clone(),
                        "online": false,
                        "playerCount": 0i64,
                        "players": Bson::Array(vec![]),
                        "firstSeen": first_seen,
                        "offlineSince": offline_since,
                        "expireAt": expire_at,
                    }
                };

                coll.update_one(doc! { "server": existing.clone() }, update, mongodb::options::UpdateOptions::builder().upsert(true).build()).await?;

                unchanged_count += 1;
            }
        }
    }

    // 2b. Servers that are present in current API → online
    let server_names: Vec<String> = servers.keys().cloned().collect();

    for server_name in &server_names {
        let player_names = servers
            .get(server_name)
            .cloned()
            .unwrap_or_else(|| Vec::new());

        let is_new = !existing_set.contains(server_name);

        let prev = existing_info.get(server_name);
        let first_seen = prev
            .and_then(|v| v.get_i64("firstSeen").ok())
            .unwrap_or(now_ts);

        let online = !player_names.is_empty();
        let player_count = player_names.len() as i64;

        let expire_at = BsonDateTime::from_millis((now_ts + SERVER_DATA_TTL_SECS) * 1000);

        let mut players_bson = Vec::with_capacity(player_names.len());
        for p in &player_names {
            players_bson.push(Bson::String(p.clone()));
        }

        let mut update_doc = doc! {
            "$set": {
                "server": server_name.clone(),
                "online": online,
                "playerCount": player_count,
                "players": Bson::Array(players_bson),
                "firstSeen": first_seen,
                "expireAt": expire_at,
            }
        };

        // If online, remove offlineSince field
        if online {
            update_doc.get_document_mut("$set").ok();
        } else {
            // if offline but present in API with zero players? treat as offline with offlineSince = now
            update_doc = doc! {
                "$set": {
                    "server": server_name.clone(),
                    "online": false,
                    "playerCount": player_count,
                    "players": Bson::Array(vec![]),
                    "firstSeen": first_seen,
                    "offlineSince": now_ts,
                    "expireAt": expire_at,
                }
            };
        }

        coll.update_one(doc! { "server": server_name.clone() }, update_doc, mongodb::options::UpdateOptions::builder().upsert(true).build()).await?;

        if is_new {
            added_count += 1;
            added_servers_list.push(server_name.clone());
        } else {
            unchanged_count += 1;
        }
    }

    let mongo_elapsed = mongo_start.elapsed();
    let whole_elapsed = whole_start.elapsed();

    // Build debug lists for summary
    let added_str = if added_servers_list.is_empty() {
        "-".to_string()
    } else {
        added_servers_list.join(",")
    };

    let removed_str = if removed_servers_list.is_empty() {
        "-".to_string()
    } else {
        removed_servers_list.join(",")
    };

    // Servers that should exist in DB now = (existing ∪ current) − removed
    let mut servers_now_set: HashSet<String> =
        existing_set.union(&current_servers).cloned().collect();
    for r in &removed_servers_list {
        servers_now_set.remove(r);
    }

    let mut online_now: Vec<String> = current_servers
        .iter()
        .filter(|s| servers_now_set.contains(*s))
        .cloned()
        .collect();
    online_now.sort();

    let mut offline_now: Vec<String> = servers_now_set
        .difference(&current_servers)
        .cloned()
        .collect();
    offline_now.sort();

    let online_now_str = if online_now.is_empty() {
        "-".to_string()
    } else {
        online_now.join(",")
    };

    let offline_now_str = if offline_now.is_empty() {
        "-".to_string()
    } else {
        offline_now.join(",")
    };

    log_event(
        "SUMMARY",
        &format!(
            "servers: added={} [{}], removed={} [{}], unchanged={} | online=[{}] offline=[{}] (http={}ms, mongo={}ms)",
            added_count,
            added_str,
            removed_count,
            removed_str,
            unchanged_count,
            online_now_str,
            offline_now_str,
            http_elapsed.as_millis(),
            mongo_elapsed.as_millis()
        ),
        Some(whole_elapsed),
    );

    Ok(())
}
