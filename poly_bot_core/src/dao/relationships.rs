use eyre::*;
use async_trait::async_trait;
use crate::model::relationship::{RelationshipNoId, Relationship};
use crate::model::user::User;

#[async_trait]
pub trait Relationships {
    async fn add(&self, relationship: RelationshipNoId) -> Result<Relationship>;
    async fn delete(&self, relationship: Relationship) -> Result<()>;
    async fn get_by_users(&self, users: Vec<User>) -> Result<Vec<Relationship>>;
}
