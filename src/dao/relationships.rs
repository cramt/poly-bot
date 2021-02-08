use crate::dao::postgres::PostgresImpl;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use eyre::*;

use async_trait::async_trait;

#[async_trait]
pub trait Relationships {
    async fn add(&self, relationship: RelationshipNoId) -> Result<Relationship>;
    async fn delete(&self, relationship: Relationship) -> Result<()>;
    async fn get_by_users(&self, users: Vec<User>) -> Result<Vec<Relationship>>;
}

pub fn default() -> Box<dyn Relationships + Sync + Send> {
    super::postgres::relationships::RelationshipsImpl::default()
}
