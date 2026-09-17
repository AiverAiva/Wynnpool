mod config;
mod redis_client;
mod scheduler;
mod tasks;
mod logger;
mod wapi;

use std::env;
use std::future;

use dotenvy::dotenv;
use tokio::time::{sleep, Duration};
use scheduler::node::FetchNode;
use crate::logger::log_event;

/// Optional comma-separated allowlist of task names, e.g.
/// `ENGINE_TASKS=update_guild_online_count,refresh_guild_list`.
///
/// Unset (the normal case) runs every registered task. This exists so a single task
/// can be run against production data without a second engine instance also writing
/// the world-event collections.
fn task_filter() -> Option<Vec<String>> {
    env::var("ENGINE_TASKS").ok().map(|raw| {
        raw.split(',')
            .map(|name| name.trim().to_string())
            .filter(|name| !name.is_empty())
            .collect()
    })
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    log_event("LAUNCH", "Wynnpool engine started", Some(Duration::from_millis(0)));

    let filter = task_filter();
    if let Some(names) = &filter {
        log_event("LAUNCH", &format!("ENGINE_TASKS filter active: {}", names.join(",")), None);
    }

    for node in inventory::iter::<FetchNode> {
        if let Some(names) = &filter {
            if !names.iter().any(|name| name.as_str() == node.name) {
                continue;
            }
        }

        let interval = node.interval;
        let callback = node.callback;
        let name = node.name;

        tokio::spawn(async move {
            loop {
                log_event("TASK", &format!("running {}", name), None);
                (callback)();
                sleep(Duration::from_secs(interval)).await;
            }
        });
    }

    // Keep main alive forever
    future::pending::<()>().await;
}
