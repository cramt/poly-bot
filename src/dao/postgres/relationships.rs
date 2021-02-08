use crate::dao::postgres::{BoxedConnectionProvider, PostgresImpl};
use crate::dao::relationships::Relationships;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use async_trait::async_trait;
use eyre::*;

#[derive(Debug)]
pub struct RelationshipsImpl {
    provider: BoxedConnectionProvider,
}

impl PostgresImpl for RelationshipsImpl {
    fn new(provider: BoxedConnectionProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl Relationships for RelationshipsImpl {
    async fn add(&self, relationship: RelationshipNoId) -> Result<Relationship> {
        let client = self.provider.open_client().await;
        let id: i64 = client
            .query(
                r"
        INSERT INTO
        relationships
        (relationship_type, left_user_id, right_user_id)
        VALUES
        ($1, $2, $3)
        RETURNING id
        ",
                &[
                    &relationship.relationship_type.to_number(),
                    &relationship.left_user.id,
                    &relationship.right_user.id,
                ],
            )
            .await
            .unwrap()
            .first()
            .unwrap()
            .get(0);
        Ok(relationship.add_id(id))
    }

    async fn delete(&self, _relationship: Relationship) -> Result<(), Report> {
        unimplemented!()
    }

    async fn get_by_users(&self, _users: Vec<User>) -> Result<Vec<Relationship>, Report> {
        unimplemented!()
    }
}
