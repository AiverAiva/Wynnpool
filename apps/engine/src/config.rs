use once_cell::sync::Lazy;
use std::env;

pub static REDIS_URL: Lazy<String> =
    Lazy::new(|| env::var("REDIS_URL").expect("REDIS_URL not set"));
