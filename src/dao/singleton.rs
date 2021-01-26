use crate::model::relationship::Relationship;
use crate::model::user::User;
use async_trait::async_trait;

#[async_trait]
pub trait Singleton {
    async fn get_all_in(discord_ids: Vec<u64>) -> (Vec<Relationship>, Vec<User>);
}
