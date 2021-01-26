pub mod relationships;

use crate::config::CONFIG;
use crate::migration_constants::MIGRATION_FILES;
use async_trait::async_trait;
use std::fmt::Debug;
use std::ops::Deref;
use tokio_postgres::tls::NoTlsStream;
use tokio_postgres::{Client, Connection, NoTls, Socket};

pub async fn apply_migrations(client: Client) {
    let (schema_version, info_exists) = client
        .query("SELECT schema_version FROM info", &[])
        .await
        .ok()
        .map(|x| (x.first().map(|y| y.get::<_, i32>(0)).unwrap_or(-1), true))
        .unwrap_or((-1, false));
    if !info_exists {
        client
            .execute("CREATE TABLE info(schema_version INTEGER NOT NULL)", &[])
            .await
            .unwrap();
    }
    let mut new_schema_version = -1;
    for (version, sql) in MIGRATION_FILES
        .iter()
        .filter(|(i, _)| schema_version.clone() < (i.clone() as i32))
    {
        client.execute(sql.as_str(), &[]).await.unwrap();
        new_schema_version = version.clone() as i32
    }
    client.execute("DELETE FROM info", &[]).await.unwrap();
    client
        .execute(
            "INSERT INTO info (schema_version) VALUES ($1)",
            &[&new_schema_version],
        )
        .await
        .unwrap();
}

#[async_trait]
pub trait ConnectionProvider {
    async fn create_connection() -> (Client, Connection<Socket, NoTlsStream>);
    async fn open_client() -> Client {
        let (client, connection) = Self::create_connection().await;
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });
        client
    }
}

pub struct ConfigConnectionProvider;

#[async_trait]
impl ConnectionProvider for ConfigConnectionProvider {
    async fn create_connection() -> (Client, Connection<Socket, NoTlsStream>) {
        tokio_postgres::connect(CONFIG.deref().db.to_string().as_str(), NoTls)
            .await
            .unwrap()
    }
}

pub struct DockerConnectionProvider;

#[async_trait]
impl ConnectionProvider for DockerConnectionProvider {
    async fn create_connection() -> (Client, Connection<Socket, NoTlsStream>) {
        tokio_postgres::connect(
            "user=postgres password=postgres dbname=postgres host=localhost",
            NoTls,
        )
        .await
        .unwrap()
    }
}
