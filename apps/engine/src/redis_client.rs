use redis::AsyncCommands;
use anyhow::Result;

pub async fn redis_conn() -> Result<redis::aio::Connection> {
    let client = redis::Client::open(crate::config::REDIS_URL.as_str())?;
    Ok(client.get_tokio_connection().await?)
}

pub async fn set_json(key: &str, value: serde_json::Value) -> Result<()> {
    let mut conn = redis_conn().await?;
    conn.set::<_, _, ()>(key, value.to_string()).await?;
    Ok(())
}

pub async fn get_json(key: &str) -> Result<Option<serde_json::Value>> {
    let mut conn = redis_conn().await?;
    let raw: Option<String> = conn.get(key).await?;
    Ok(raw.map(|s| serde_json::from_str(&s).unwrap()))
}
