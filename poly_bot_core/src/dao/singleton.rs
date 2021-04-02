use async_trait::async_trait;
use eyre::*;
use crate::model::relationship::Relationship;
use crate::model::user::User;

#[async_trait]
pub trait Singleton {
    async fn get_all_in(&self, discord_ids: Vec<u64>) -> Result<(Vec<Relationship>, Vec<User>)>;
}
