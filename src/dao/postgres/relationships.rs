use crate::dao::postgres::{
    BoxedConnectionProvider, ConfigConnectionProvider, ConnectionProvider,
    DockerConnectionProvider, PostgresImpl,
};
use crate::dao::relationships::Relationships;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use crate::model::RelationalId;
use async_trait::async_trait;

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
    async fn add(&self, relationship: RelationshipNoId) -> Relationship {
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
        relationship.add_id(id)
    }

    async fn delete(&self, relationship: Relationship) -> bool {
        unimplemented!()
    }

    async fn get_by_users(&self, users: Vec<User>) -> Vec<Relationship> {
        unimplemented!()
    }
}
