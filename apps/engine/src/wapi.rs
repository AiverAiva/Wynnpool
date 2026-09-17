//! Shared Wynncraft API access.
//!
//! Every outbound Wynncraft request in the engine goes through [`get_json`] so
//! that all tasks together stay inside one rate limit. The limit is per API key
//! (120 req/min here), and the high-frequency guild membership rotation shares it
//! with the count task and with `server_status`, so the spacing is enforced
//! globally rather than per task.

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::{Duration, Instant};

use anyhow::{anyhow, Result};
use once_cell::sync::Lazy;
use reqwest::Client;
use serde_json::Value;
use tokio::sync::Mutex;

use crate::config::WYNNCRAFT_API_KEY;
use crate::logger::log_event;

const API_BASE: &str = "https://api.wynncraft.com";

/// Set once the API rejects our key with 403, so every later request skips the
/// header instead of failing.
static KEY_REJECTED: AtomicBool = AtomicBool::new(false);

/// Minimum spacing between two outbound requests, shared by every task.
/// The key allows 120 req/min; 600ms targets ~100 req/min so a burst of guild
/// membership fetches can never starve the 35s server-status poll.
const MIN_REQUEST_SPACING: Duration = Duration::from_millis(600);

/// Attempts before giving up on a single request (429 only).
const MAX_ATTEMPTS: usize = 3;

/// Extra spacing applied after a 429, in milliseconds. It grows while the API keeps
/// throttling and decays on every success, so the engine converges on whatever limit
/// it is actually being given. Measured: the unauthenticated pool rejects a sustained
/// ~100 req/min burst long before the documented ceiling, so without this a missing
/// or expired API key turns the membership rotation into a retry storm.
static PENALTY_MS: AtomicU64 = AtomicU64::new(0);
const MAX_PENALTY_MS: u64 = 10_000;
const PENALTY_GROWTH_MS: u64 = 1_000;
const PENALTY_DECAY_MS: u64 = 200;

static CLIENT: Lazy<Client> = Lazy::new(Client::new);

/// Single global gate. `None` until the first request so we never subtract from
/// an `Instant` that was just created.
static GATE: Lazy<Mutex<Option<Instant>>> = Lazy::new(|| Mutex::new(None));

async fn acquire_slot() {
    let penalty = PENALTY_MS.load(Ordering::Relaxed);
    let spacing = MIN_REQUEST_SPACING + Duration::from_millis(penalty);

    let mut last = GATE.lock().await;
    if let Some(prev) = *last {
        let earliest = prev + spacing;
        let now = Instant::now();
        if earliest > now {
            tokio::time::sleep(earliest - now).await;
        }
    }
    *last = Some(Instant::now());
}

fn note_throttled() {
    let previous = PENALTY_MS.load(Ordering::Relaxed);
    let next = previous
        .saturating_mul(2)
        .max(PENALTY_GROWTH_MS)
        .min(MAX_PENALTY_MS);
    PENALTY_MS.store(next, Ordering::Relaxed);
}

fn note_success() {
    let previous = PENALTY_MS.load(Ordering::Relaxed);
    if previous > 0 {
        PENALTY_MS.store(previous.saturating_sub(PENALTY_DECAY_MS), Ordering::Relaxed);
    }
}

/// Current effective spacing, for logging.
pub fn current_spacing_ms() -> u64 {
    (MIN_REQUEST_SPACING + Duration::from_millis(PENALTY_MS.load(Ordering::Relaxed))).as_millis()
        as u64
}

/// Percent-encode a single URL path segment. Guild names contain spaces and
/// punctuation (e.g. "TAX EVADERS"), and a raw `#` would truncate the path.
fn encode_path_segment(segment: &str) -> String {
    let mut out = String::with_capacity(segment.len());
    for byte in segment.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

/// GET a Wynncraft API path and decode it as JSON, respecting the global rate limit.
pub async fn get_json(path: &str) -> Result<Value> {
    let mut attempt = 0usize;
    loop {
        attempt += 1;
        acquire_slot().await;

        let mut request = CLIENT.get(format!("{API_BASE}{path}"));
        let mut used_key = false;
        if let Some(key) = WYNNCRAFT_API_KEY.as_ref() {
            if !KEY_REJECTED.load(Ordering::Relaxed) {
                request = request.header("Authorization", format!("Bearer {key}"));
                used_key = true;
            }
        }

        let response = request.send().await?;
        let status = response.status();

        // A stale or revoked key makes every endpoint that works anonymously start
        // returning 403 instead, which would stop all data collection at once. Drop
        // the header and carry on, but say so loudly -- a revoked key costs us the
        // higher rate limit, so it must not pass silently.
        if status.as_u16() == 403 && used_key {
            if !KEY_REJECTED.swap(true, Ordering::Relaxed) {
                log_event(
                    "ERROR",
                    &format!(
                        "wynncraft rejected WYNNCRAFT_API_KEY with 403 on {path}; \
                         continuing unauthenticated, which lowers the rate limit"
                    ),
                    None,
                );
            }
            continue;
        }

        if status.as_u16() == 429 {
            // Slow every task down, not just this one request.
            note_throttled();
            if attempt < MAX_ATTEMPTS {
                let backoff = Duration::from_secs(10 * attempt as u64);
                log_event(
                    "WARN",
                    &format!(
                        "wynncraft 429 for {path}; backing off {backoff:?}, global spacing now {}ms",
                        current_spacing_ms()
                    ),
                    None,
                );
                tokio::time::sleep(backoff).await;
                continue;
            }
            return Err(anyhow!("GET {path} throttled with HTTP 429 after {attempt} attempts"));
        }
        if !status.is_success() {
            return Err(anyhow!("GET {path} failed with HTTP {status}"));
        }

        note_success();
        return Ok(response.json::<Value>().await?);
    }
}

/// The set of player UUIDs currently online.
///
/// `identifier=uuid` makes the response keyed by UUID, which is what guild
/// membership is keyed by too.
pub async fn fetch_online_uuids() -> Result<Vec<String>> {
    let payload = get_json("/v3/player?identifier=uuid").await?;
    let players = payload
        .get("players")
        .and_then(|p| p.as_object())
        .ok_or_else(|| anyhow!("unexpected /v3/player payload: no players object"))?;
    Ok(players.keys().cloned().collect())
}

/// Every guild that currently exists, as (name, uuid).
pub async fn fetch_guild_list() -> Result<Vec<(String, String)>> {
    let payload = get_json("/v3/guild/list/guild").await?;
    let guilds = payload
        .as_object()
        .ok_or_else(|| anyhow!("unexpected /v3/guild/list/guild payload: not an object"))?;

    let mut out = Vec::with_capacity(guilds.len());
    for (name, info) in guilds {
        if let Some(uuid) = info.get("uuid").and_then(|u| u.as_str()) {
            out.push((name.clone(), uuid.to_string()));
        }
    }
    Ok(out)
}

pub struct GuildMembers {
    pub name: String,
    /// UUIDs of every current member, flattened across ranks.
    pub member_uuids: Vec<String>,
}

/// Fetch one guild and flatten its member list.
pub async fn fetch_guild_members(guild_name: &str) -> Result<GuildMembers> {
    let path = format!("/v3/guild/{}?identifier=uuid", encode_path_segment(guild_name));
    let payload = get_json(&path).await?;

    let name = payload
        .get("name")
        .and_then(|n| n.as_str())
        .unwrap_or(guild_name)
        .to_string();

    let members = payload
        .get("members")
        .and_then(|m| m.as_object())
        .ok_or_else(|| anyhow!("guild '{guild_name}': response has no members object"))?;

    let mut member_uuids = Vec::new();
    for (rank, rank_members) in members {
        if rank == "total" {
            continue;
        }
        if let Some(map) = rank_members.as_object() {
            member_uuids.extend(map.keys().cloned());
        }
    }

    Ok(GuildMembers { name, member_uuids })
}
