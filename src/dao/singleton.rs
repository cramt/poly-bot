use crate::dao::postgres::PostgresImpl;
use async_trait::async_trait;
use eyre::*;
use model::relationship::Relationship;
use model::user::User;

#[async_trait]
pub trait Singleton {
    async fn get_all_in(&self, discord_ids: Vec<u64>) -> Result<(Vec<Relationship>, Vec<User>)>;
}

pub fn default() -> Box<dyn Singleton + Sync + Send> {
    super::postgres::singleton::SingletonImpl::default()
}
