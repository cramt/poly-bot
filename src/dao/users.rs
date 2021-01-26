use crate::model::user::{User, UserNoId};
use crate::model::RelationalId;
use async_trait::async_trait;

#[async_trait]
pub trait Users {
    async fn get(id: u64) -> User;
    async fn add(user: UserNoId) -> User;
    async fn get_by_discord_id(id: u64) -> User;
    async fn get_by_username<S: AsRef<str>>(username: S) -> User;
    async fn get_members(user: User) -> Vec<User> {
        Self::get_members_multiple(vec![user]).await
    }
    async fn get_members_multiple(users: Vec<User>) -> Vec<User>;
    async fn delete<I: RelationalId>(i: I) -> bool;
    async fn delete_by_discord_id(id: u64) -> bool;
    async fn update(user: User) -> bool;
}
