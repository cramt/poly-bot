use crate::dao::postgres::PostgresImpl;
use crate::model::user::{User, UserNoId};

use async_trait::async_trait;

#[async_trait]
pub trait Users {
    async fn get(&self, id: i64) -> User;
    async fn add(&self, user: UserNoId) -> User;
    async fn get_by_discord_id(&self, id: u64) -> User;
    async fn get_by_username(&self, username: String) -> User;
    async fn get_members(&self, user: User) -> Vec<User> {
        self.get_members_multiple(vec![user]).await
    }
    async fn get_members_multiple(&self, users: Vec<User>) -> Vec<User>;
    async fn delete(&self, user: User) -> bool;
    async fn delete_by_discord_id(&self, id: u64) -> bool;
    async fn update(&self, user: User) -> bool;
}

pub fn default() -> Box<dyn Users> {
    super::postgres::users::UsersImpl::default()
}
