use std::collections::{HashMap, HashSet};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use once_cell::sync::Lazy;
use redis::AsyncCommands;
use reqwest::Client;
use serde_json::{json, Value};

use crate::logger::log_event;
use crate::redis_client::redis_conn;
use wynnpool_engine_macros::fetch;

static CLIENT: Lazy<Client> = Lazy::new(Client::new);

// 12 hours TTL for server data
const SERVER_DATA_TTL_SECS: i64 = 60 * 60 * 12;
// Delete a server only if it's been offline for more than 1 minutes
const OFFLINE_DELETE_SECS: i64 = 60 * 1;

#[fetch(interval = 35)]
fn update_server_status() {
    tokio::spawn(async {
        if let Err(e) = run_update_server_status().await {
            log_event("ERROR", &format!("update_server_status failed: {e}"), None);
        }
    });
}

async fn run_update_server_status() -> Result<()> {
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

    // --- 2. REDIS PART ---
    let redis_start = Instant::now();
    let mut conn = redis_conn().await?;

    // Existing server names from Redis
    let existing_servers: Vec<String> =
        conn.smembers("wynnpool:servers").await.unwrap_or_default();
    let existing_set: HashSet<String> = existing_servers.iter().cloned().collect();

    // Fetch existing JSONs in one MGET for all existing servers
    let existing_data_keys: Vec<String> = existing_servers
        .iter()
        .map(|name| format!("wynnpool:server:{}:data", name))
        .collect();

    let existing_raw_values: Vec<Option<String>> = if !existing_data_keys.is_empty() {
        redis::cmd("MGET")
            .arg(&existing_data_keys)
            .query_async(&mut conn)
            .await?
    } else {
        Vec::new()
    };

    // Map: server_name -> existing JSON (if any)
    let mut existing_info: HashMap<String, Value> = HashMap::new();
    for (idx, name) in existing_servers.iter().enumerate() {
        if let Some(Some(raw)) = existing_raw_values.get(idx) {
            if let Ok(val) = serde_json::from_str::<Value>(raw) {
                existing_info.insert(name.clone(), val);
            }
        }
    }

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

    let mut cleanup_pipe = redis::pipe();
    let mut has_cleanup = false;

    let mut write_pipe = redis::pipe();
    let mut has_writes = false;

    // 2a. Existing servers that are *missing* from current API → offline or delete
    for existing in &existing_servers {
        if !current_servers.contains(existing) {
            let data_key = format!("wynnpool:server:{}:data", existing);

            let prev = existing_info.get(existing);
            let first_seen = prev
                .and_then(|v| v.get("firstSeen"))
                .and_then(|v| v.as_i64())
                .unwrap_or(now_ts);

            let offline_since = prev
                .and_then(|v| v.get("offlineSince"))
                .and_then(|v| v.as_i64())
                .unwrap_or(now_ts);

            let offline_duration = now_ts - offline_since;

            if offline_duration > OFFLINE_DELETE_SECS {
                // Hard delete after being offline for > 1 minutes
                cleanup_pipe
                    .del(&data_key)
                    .srem("wynnpool:servers", existing);
                has_cleanup = true;

                removed_count += 1;
                removed_servers_list.push(existing.clone());
            } else {
                // Keep it in DB but mark as offline
                let server_data = json!({
                    "server": existing,
                    "online": false,
                    "playerCount": 0,
                    "players": [],
                    "firstSeen": first_seen,
                    "offlineSince": offline_since
                })
                .to_string();

                write_pipe
                    .set(&data_key, server_data)
                    .expire(&data_key, SERVER_DATA_TTL_SECS)
                    .sadd("wynnpool:servers", existing);

                has_writes = true;
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

        let data_key = format!("wynnpool:server:{}:data", server_name);
        let is_new = !existing_set.contains(server_name);

        let prev = existing_info.get(server_name);
        let first_seen = prev
            .and_then(|v| v.get("firstSeen"))
            .and_then(|v| v.as_i64())
            .unwrap_or(now_ts);

        let online = !player_names.is_empty();
        let player_count = player_names.len();

        let server_data = json!({
            "server": server_name,
            "online": online,
            "playerCount": player_count,
            "players": player_names,
            "firstSeen": first_seen
            // NOTE: no offlineSince when online; we implicitly clear it
        })
        .to_string();

        write_pipe
            .set(&data_key, server_data)
            .expire(&data_key, SERVER_DATA_TTL_SECS)
            .sadd("wynnpool:servers", server_name);

        has_writes = true;

        if is_new {
            added_count += 1;
            added_servers_list.push(server_name.clone());
        } else {
            unchanged_count += 1;
        }
    }

    // Execute cleanup + writes in as few round-trips as possible
    if has_cleanup {
        cleanup_pipe.query_async::<_, ()>(&mut conn).await?;
    }
    if has_writes {
        write_pipe.query_async::<_, ()>(&mut conn).await?;
    }

    let redis_elapsed = redis_start.elapsed();
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
            "servers: added={} [{}], removed={} [{}], unchanged={} | online=[{}] offline=[{}] (http={}ms, redis={}ms)",
            added_count,
            added_str,
            removed_count,
            removed_str,
            unchanged_count,
            online_now_str,
            offline_now_str,
            http_elapsed.as_millis(),
            redis_elapsed.as_millis()
        ),
        Some(whole_elapsed),
    );

    Ok(())
}
