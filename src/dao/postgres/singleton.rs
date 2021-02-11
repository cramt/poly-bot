use crate::dao::postgres::PostgresImpl;
use crate::dao::singleton::Singleton;
use async_trait::async_trait;
use eyre::*;
use model::relationship::Relationship;
use model::user::User;

use super::ConnectionProvider;

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
