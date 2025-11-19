use chrono::Local;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use std::time::Duration;

/// Simple structured log entry (optional)
#[derive(Debug)]
pub struct LogEntry {
    pub timestamp: String,
    pub event: String,
    pub message: String,
    pub elapsed_ms: Option<u128>,
}

/// Optional in-memory log store (you can delete this if you don't need it)
static LOGS: Lazy<Mutex<Vec<LogEntry>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// Log an event like:
/// 2025/11/18 16:51:12  LAUNCH  Wynnpool engine started      0ms
/// 2025/11/18 16:51:13  TASK    fetching server list       240ms
pub fn log_event(event: &str, message: &str, elapsed: Option<Duration>) {
    let now = Local::now();
    let timestamp = now.format("%Y/%m/%d %H:%M:%S").to_string();

    let elapsed_ms = elapsed.map(|d| d.as_millis());
    let elapsed_str = elapsed_ms
        .map(|ms| format!("{ms}ms"))
        .unwrap_or_else(|| "-".to_string());

    // store in memory (optional)
    {
        let mut guard = LOGS.lock().unwrap();
        guard.push(LogEntry {
            timestamp: timestamp.clone(),
            event: event.to_string(),
            message: message.to_string(),
            elapsed_ms,
        });
    }

    // print to stdout
    println!(
        "{}  {:<8} {:<40} {}",
        timestamp, event, message, elapsed_str
    );
}
