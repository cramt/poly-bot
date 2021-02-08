use crate::dao::postgres::PostgresImpl;
use crate::model::user::{User, UserNoId};

use async_trait::async_trait;
use eyre::*;

#[async_trait]
pub trait Users {
    async fn get(&self, id: i64) -> Result<Option<User>>;
    async fn add(&self, user: UserNoId) -> Result<User>;
    async fn get_by_discord_id(&self, id: u64) -> Result<Option<User>>;
    async fn get_by_username(&self, username: String) -> Result<Vec<User>>;
    async fn get_members(&self, user: User) -> Result<Vec<User>> {
        self.get_members_multiple(vec![user]).await
    }
    async fn get_members_multiple(&self, users: Vec<User>) -> Result<Vec<User>>;
    async fn delete(&self, user: User) -> Result<()>;
    async fn delete_by_discord_id(&self, id: u64) -> Result<()>;
    async fn update(&self, user: User) -> Result<()>;
}

pub fn default() -> Box<dyn Users + Sync + Send> {
    super::postgres::users::UsersImpl::default()
}
