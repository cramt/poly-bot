use crate::dao::postgres::PostgresImpl;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;

use async_trait::async_trait;

#[async_trait]
pub trait Relationships {
    async fn add(&self, relationship: RelationshipNoId) -> Relationship;
    async fn delete(&self, relationship: Relationship) -> bool;
    async fn get_by_users(&self, users: Vec<User>) -> Vec<Relationship>;
}

pub fn default() -> Box<dyn Relationships> {
    super::postgres::relationships::RelationshipsImpl::default()
}
