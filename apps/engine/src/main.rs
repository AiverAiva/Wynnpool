mod config;
mod redis_client;
mod scheduler;
mod tasks;
mod logger;

use std::future;

use dotenvy::dotenv;
use tokio::time::{sleep, Duration};
use scheduler::node::FetchNode;
use crate::logger::log_event;

#[tokio::main]
async fn main() {
    dotenv().ok();

    log_event("LAUNCH", "Wynnpool engine started", Some(Duration::from_millis(0)));

    for node in inventory::iter::<FetchNode> {
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
