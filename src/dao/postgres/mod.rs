pub mod relationships;
pub mod singleton;
pub mod users;

use crate::config::CONFIG;
use crate::migration_constants::MIGRATION_FILES;

use async_trait::async_trait;

use serenity::static_assertions::_core::ops::DerefMut;

use std::error::Error;
use std::fmt::Debug;
use std::ops::Deref;

use tokio_postgres::tls::NoTlsStream;
use tokio_postgres::types::private::BytesMut;
use tokio_postgres::types::{IsNull, ToSql, Type};
use tokio_postgres::{Client, Connection, NoTls, Row, Socket};

pub async fn apply_migrations(client: &Client) {
    let (schema_version, _info_exists) = client
        .query("SELECT schema_version FROM info", &[])
        .await
        .ok()
        .map(|x| (x.first().map(|y| y.get::<_, i32>(0)).unwrap_or(-1), true))
        .unwrap_or((-1, false));
    client
        .execute("CREATE TABLE info(schema_version INTEGER NOT NULL)", &[])
        .await;

    let mut new_schema_version = -1;
    for (version, sql) in MIGRATION_FILES
        .iter()
        .filter(|(i, _)| schema_version.clone() < (i.clone() as i32))
    {
        client
            .execute(sql.as_str(), &[])
            .await
            .expect(format!("failed to execute migration {}", version).as_str());
        new_schema_version = version.clone() as i32
    }
    if new_schema_version.is_positive() {
        client.execute("DELETE FROM info", &[]).await.unwrap();
        client
            .execute(
                "INSERT INTO info (schema_version) VALUES ($1)",
                &[&new_schema_version],
            )
            .await
            .unwrap();
    }
}

#[async_trait]
pub trait ConnectionProvider: std::fmt::Debug {
    async fn create_connection(&self) -> (Client, Connection<Socket, NoTlsStream>);
    async fn open_client(&self) -> Client {
        let (client, connection) = self.create_connection().await;
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });
        client
    }
}

#[derive(Debug)]
pub struct ConfigConnectionProvider;

#[async_trait]
impl ConnectionProvider for ConfigConnectionProvider {
    async fn create_connection(&self) -> (Client, Connection<Socket, NoTlsStream>) {
        tokio_postgres::connect(CONFIG.deref().db.to_string().as_str(), NoTls)
            .await
            .unwrap()
    }
}

#[derive(Debug)]
pub struct DockerConnectionProvider;

#[async_trait]
impl ConnectionProvider for DockerConnectionProvider {
    async fn create_connection(&self) -> (Client, Connection<Socket, NoTlsStream>) {
        tokio_postgres::connect(
            "user=postgres password=postgres dbname=postgres host=localhost",
            NoTls,
        )
        .await
        .unwrap()
    }
}

pub trait PostgresImpl {
    fn new(provider: BoxedConnectionProvider) -> Self;
    fn default() -> Box<Self>
    where
        Self: Sized,
    {
        if cfg!(test) {
            Box::new(Self::new(Box::new(DockerConnectionProvider)))
        } else {
            Box::new(Self::new(Box::new(ConfigConnectionProvider)))
        }
    }
}

pub trait DbRep {
    type Output;
    fn new(row: Row) -> Self;
    fn model(self) -> Self::Output;
    fn select_order_raw() -> &'static [&'static str];
    fn select_order() -> String {
        Self::select_order_raw().join(", ")
    }
}

pub type BoxedConnectionProvider = Box<dyn ConnectionProvider + Sync + std::marker::Send>;

#[derive(Debug)]
pub struct Sqlu64(u64);

impl ToSql for Sqlu64 {
    fn to_sql(&self, ty: &Type, out: &mut BytesMut) -> Result<IsNull, Box<dyn Error + Sync + Send>>
    where
        Self: Sized,
    {
        let signed: i64 = unsafe { std::mem::transmute(self.0) };
        signed.to_sql(ty, out)
    }

    fn accepts(ty: &Type) -> bool
    where
        Self: Sized,
    {
        i64::accepts(ty)
    }

    fn to_sql_checked(
        &self,
        ty: &Type,
        out: &mut BytesMut,
    ) -> Result<IsNull, Box<dyn Error + Sync + Send>> {
        let signed: i64 = unsafe { std::mem::transmute(self.0) };
        signed.to_sql_checked(ty, out)
    }
}

impl Deref for Sqlu64 {
    type Target = u64;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Sqlu64 {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl From<u64> for Sqlu64 {
    fn from(u: u64) -> Self {
        Self(u)
    }
}
