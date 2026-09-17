use once_cell::sync::Lazy;
use std::env;

pub static REDIS_URL: Lazy<String> =
    Lazy::new(|| env::var("REDIS_URL").expect("REDIS_URL not set"));

pub static MONGODB_URI: Lazy<String> =
    Lazy::new(|| env::var("MONGODB_URI").expect("MONGODB_URI not set"));

/// Optional Wynncraft API key. When present, every request is sent with
/// `Authorization: Bearer <key>`, which raises the rate limit (120 req/min) and
/// takes us off the shared unauthenticated pool.
pub static WYNNCRAFT_API_KEY: Lazy<Option<String>> =
    Lazy::new(|| env::var("WYNNCRAFT_API_KEY").ok().filter(|k| !k.trim().is_empty()));