use crate::{ConnectionProvider, PostgresImpl};
use async_trait::async_trait;
use eyre::*;
use poly_bot_core::dao::singleton::Singleton;
use poly_bot_core::model::relationship::Relationship;
use poly_bot_core::model::user::User;

#[derive(Debug)]
pub struct SingletonImpl {
    provider: ConnectionProvider,
}

impl PostgresImpl for SingletonImpl {
    fn new(provider: ConnectionProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl Singleton for SingletonImpl {
    async fn get_all_in(&self, _discord_ids: Vec<u64>) -> Result<(Vec<Relationship>, Vec<User>)> {
        unimplemented!()
    }
}
