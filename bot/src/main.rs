mod handler;
mod serenity_command_context;
mod discord_response;

use once_cell::sync::Lazy;
use poly_bot_core::dao::Dao;
use postgres_dao_impl::users::UsersImpl;
use postgres_dao_impl::{PostgresImpl, ConnectionProvider, apply_migrations};
use postgres_dao_impl::relationships::RelationshipsImpl;
use postgres_dao_impl::singleton::SingletonImpl;
use eyre::*;
use serenity::Client;
use config::CONFIG;
use crate::handler::Handler;

pub static DAO: Lazy<Dao> = Lazy::new(|| Dao {
    users: UsersImpl::default(),
    relationships: RelationshipsImpl::default(),
    singleton: SingletonImpl::default(),
});

async fn ensure_database() -> Result<()> {
    let client = ConnectionProvider::default().open_client().await;
    apply_migrations(&client).await
}

async fn ensure_discord_client() -> Result<()> {
    Client::builder(&CONFIG.discord_token)
        .event_handler(Handler::default())
        .await
        .expect("failed to spawn client")
        .start()
        .await
        .map_err(Report::new)
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    let (db, discord) = futures::future::join(ensure_database(), ensure_discord_client()).await;
    vec![db, discord]
        .into_iter()
        .find(|x| x.is_err())
        .unwrap_or(Ok(()))
}
