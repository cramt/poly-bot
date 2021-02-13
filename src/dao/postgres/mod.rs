pub mod relationships;
pub mod singleton;
pub mod users;

use crate::migration_constants::MIGRATION_FILES;
use config::CONFIG;
use utilities::shell::shell;

use eyre::*;
use std::fmt::Debug;
use std::ops::{Deref, DerefMut};
use std::{error::Error, thread::sleep, time::Duration};

use tokio_postgres::tls::NoTlsStream;
use tokio_postgres::types::private::BytesMut;
use tokio_postgres::types::{IsNull, ToSql, Type};
use tokio_postgres::{Client, Connection, NoTls, Row, Socket};

pub async fn apply_migrations(client: &Client) -> Result<()> {
    let (schema_version, _info_exists) = client
        .query("SELECT schema_version FROM info", &[])
        .await
        .ok()
        .map(|x| (x.first().map(|y| y.get::<_, i32>(0)).unwrap_or(-1), true))
        .unwrap_or((-1, false));
    let _ = client
        .execute("CREATE TABLE info(schema_version INTEGER NOT NULL)", &[])
        .await;

    let mut new_schema_version = -1;
    for (version, sql) in MIGRATION_FILES
        .iter()
        .filter(|(i, _)| schema_version < (*i as i32))
    {
        client
            .execute(sql.as_str(), &[])
            .await
            .map_err(Report::new)?;
        new_schema_version = *version as i32
    }
    if new_schema_version.is_positive() {
        client.execute("DELETE FROM info", &[]).await.unwrap();
        client
            .execute(
                "INSERT INTO info (schema_version) VALUES ($1)",
                &[&new_schema_version],
            )
            .await
            .map_err(Report::new)?;
    };
    Ok(())
}

#[derive(Debug)]
pub struct ConnectionProvider {
    pub connnection_string: String,
}

impl ConnectionProvider {
    pub async fn create_connection(&self) -> (Client, Connection<Socket, NoTlsStream>) {
        tokio_postgres::connect(self.connnection_string.as_str(), NoTls)
            .await
            .unwrap()
    }
    pub async fn open_client(&self) -> Client {
        let (client, connection) = self.create_connection().await;
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("connection error: {}", e);
            }
        });
        client
    }

    pub fn new<S: ToString>(s: S) -> Self {
        Self {
            connnection_string: s.to_string(),
        }
    }
}

fn docker_config_string() -> &'static str {
    let container_name = "poly-bot-postgres-test-container";
    if shell(format!(r#"docker ps -aqf "name={}""#, container_name), true)
        .unwrap_or_else(|| "".to_string())
        .is_empty()
    {
        println!("postgres docker container isnt running, starting it");
        shell(format!(r#"docker run -d --rm --name {} -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres postgres:11.3-alpine -c shared_buffers=500MB -c fsync=off"#, container_name), true).unwrap();
        println!("initializing, waiting 2 seconds to make sure its finished");
        sleep(Duration::from_millis(2000));
    }

    "user=postgres password=postgres dbname=postgres host=localhost"
}

impl Default for ConnectionProvider {
    fn default() -> Self {
        if cfg!(test) {
            Self::new(docker_config_string())
        } else {
            Self::new(CONFIG.deref().db.to_string().as_str())
        }
    }
}

pub trait PostgresImpl {
    fn new(provider: ConnectionProvider) -> Self;
    fn default() -> Box<Self>
    where
        Self: Sized,
    {
        Box::new(Self::new(ConnectionProvider::default()))
    }
}

pub trait DbRep {
    type Output;
    fn new(row: &Row) -> Self
    where
        Self: Sized,
    {
        Self::new_with_start(row, &mut 0)
    }
    fn new_with_start(row: &Row, start: &mut usize) -> Self;
    fn model(self) -> Self::Output;
    fn select_order_raw() -> Vec<String>;
    fn select_order() -> String {
        Self::select_order_raw().join(", ")
    }
    fn model_collection<T: Iterator<Item = Self>>(selves: T) -> Vec<Self::Output>
    where
        Self: Sized;
}

pub trait DbRepCollectionUtils<T: DbRep>: IntoIterator<Item = T> {
    fn model(self) -> Vec<T::Output>
    where
        Self: Sized,
    {
        T::model_collection(self.into_iter())
    }
}

impl<T> DbRepCollectionUtils<T> for Vec<T> where T: DbRep {}

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
