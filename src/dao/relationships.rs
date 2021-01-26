use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use crate::model::RelationalId;
use async_trait::async_trait;

#[async_trait]
pub trait Relationships {
    async fn add(relationship: RelationshipNoId) -> Relationship;
    async fn delete<I: RelationalId>(i: I) -> bool;
    async fn get_by_users(users: Vec<User>) -> Vec<Relationship>;
}
