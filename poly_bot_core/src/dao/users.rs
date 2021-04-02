use crate::model::user::{User, UserNoId};
use async_trait::async_trait;
use eyre::*;

#[async_trait]
pub trait Users {
    async fn get(&self, id: i64) -> Result<Option<User>>;
    async fn add(&self, user: UserNoId) -> Result<User>;
    async fn get_by_discord_id(&self, id: u64) -> Result<Option<User>>;
    async fn get_by_username(&self, username: String) -> Result<Vec<User>>;
    async fn get_members(&self, user: User) -> Result<Vec<User>>
    where
        Self: Sized,
    {
        self.get_members_multiple(vec![user]).await
    }
    async fn get_members_multiple(&self, users: Vec<User>) -> Result<Vec<User>>;
    async fn delete(&self, user: User) -> Result<()>;
    async fn delete_by_discord_id(&self, id: u64) -> Result<()>;
    async fn update(&self, user: User) -> Result<()>;
    async fn get_member_by_name(&self, parent_id: i64, member_name: String)
        -> Result<Option<User>>;
    async fn get_by_username_and_discord_ids(
        &self,
        username: String,
        discord_ids: Vec<u64>,
    ) -> Result<Vec<User>>;
}
