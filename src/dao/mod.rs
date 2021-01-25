use crate::config::CONFIG;
use async_trait::async_trait;
use std::fmt::Debug;
use std::ops::Deref;
use tokio_postgres::tls::NoTlsStream;
use tokio_postgres::{Client, Connection, NoTls, Socket};

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
