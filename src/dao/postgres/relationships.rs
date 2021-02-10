use crate::dao::postgres::{DbRep, PostgresImpl};
use crate::dao::relationships::Relationships;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use async_trait::async_trait;
use eyre::*;

use super::ConnectionProvider;
use crate::dao::postgres::users::UsersDbRep;
use crate::model::relationship_type::RelationshipType;
use crate::utilities::std_additions::{NumUtils, PostgresClientUtils};
use std::collections::HashMap;
use tokio_postgres::Row;

#[derive(Debug)]
pub struct RelationshipsDbRep {
    pub id: i64,
    pub relationship_type: i16,
    pub left_user: UsersDbRep,
    pub right_user: UsersDbRep,
}

impl DbRep for RelationshipsDbRep {
    type Output = Relationship;

    fn new_with_start(row: &Row, start: &mut usize) -> Self {
        Self {
            id: row.get(start.post_increment()),
            relationship_type: row.get(start.post_increment()),
            left_user: UsersDbRep::new_with_start(row, start),
            right_user: UsersDbRep::new_with_start(row, start),
        }
    }

    fn model(self) -> Self::Output {
        Self::Output::new(
            self.id,
            RelationshipType::parse(self.relationship_type as u8).unwrap(),
            self.left_user.model(),
            self.right_user.model(),
        )
    }

    fn select_order_raw() -> Vec<String> {
        let own = ["relationships.id", "relationship_type"];
        own.to_vec()
            .into_iter()
            .map(|x| x.to_string())
            .chain(
                UsersDbRep::select_order_raw()
                    .into_iter()
                    .map(|x| format!("left_user.{}", x))
                    .chain(
                        UsersDbRep::select_order_raw()
                            .into_iter()
                            .map(|x| format!("right_user.{}", x)),
                    ),
            )
            .collect()
    }

    fn model_collection<T: Iterator<Item = Self>>(selves: T) -> Vec<Self::Output>
    where
        Self: Sized,
    {
        let (users, relationships) = selves.fold(
            (HashMap::new(), vec![]),
            |(mut acc_users, mut acc_rel), x| {
                let RelationshipsDbRep {
                    id,
                    relationship_type,
                    left_user,
                    right_user,
                } = x;
                let left_user_id = left_user.id;
                let right_user_id = right_user.id;
                acc_users.insert(left_user_id, left_user);
                acc_users.insert(right_user_id, right_user);
                acc_rel.push((
                    id,
                    RelationshipType::parse(relationship_type as u8).unwrap(),
                    left_user_id,
                    right_user_id,
                ));
                (acc_users, acc_rel)
            },
        );
        let users = UsersDbRep::model_collection(users.into_iter().map(|(_, x)| x))
            .into_iter()
            .map(|x| (x.id, x))
            .collect::<HashMap<i64, User>>();
        relationships
            .into_iter()
            .map(|(id, tt, left_user, right_user)| {
                Relationship::new(
                    id,
                    tt,
                    users.get(&left_user).unwrap().clone(),
                    users.get(&right_user).unwrap().clone(),
                )
            })
            .collect()
    }
}

#[derive(Debug)]
pub struct RelationshipsImpl {
    provider: ConnectionProvider,
}

impl PostgresImpl for RelationshipsImpl {
    fn new(provider: ConnectionProvider) -> Self {
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

    async fn delete(&self, relationship: Relationship) -> Result<(), Report> {
        let client = self.provider.open_client().await;
        let r = client
            .execute(
                r"
        DELETE FROM relationships
        WHERE
        relationship_type = $1
        AND
        left_user_id = $2
        AND
        right_user_id = $3
        ",
                &[
                    &relationship.relationship_type.to_number(),
                    &relationship.left_user.id,
                    &relationship.right_user.id,
                ],
            )
            .await;
        client.close();
        r?;
        Ok(())
    }

    async fn get_by_users(&self, users: Vec<User>) -> Result<Vec<Relationship>> {
        let client = self.provider.open_client().await;
        let r = client
            .query(
                format!(
                    r"
                    SELECT
                    {}
                    FROM
                    relationships
                    INNER JOIN
                    users left_user
                    ON
                    left_user.id = left_user_id
                    INNER JOIN
                    users right_user
                    ON
                    right_user.id = right_user_id
                    WHERE
                    right_user.id = ANY($1)
                    AND
                    left_user.id = ANY($1)
                    ",
                    RelationshipsDbRep::select_order()
                )
                .as_str(),
                &[&users.into_iter().map(|x| x.id).collect::<Vec<i64>>()],
            )
            .await;
        r?;
        Ok(vec![])
    }
}
