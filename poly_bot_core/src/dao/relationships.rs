use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use async_trait::async_trait;
use eyre::*;

#[async_trait]
pub trait Relationships {
    async fn add(&self, relationship: RelationshipNoId) -> Result<Relationship>;
    async fn delete(&self, relationship: Relationship) -> Result<()>;
    async fn get_by_users(&self, users: Vec<User>) -> Result<Vec<Relationship>>;
}
