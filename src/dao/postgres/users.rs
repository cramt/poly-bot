use crate::dao::postgres::{BoxedConnectionProvider, DbRep, PostgresImpl, Sqlu64};
use crate::dao::users::Users;
use crate::model::user::{User, UserNoId};

use crate::model::gender::Gender;
use async_trait::async_trait;
use tokio_postgres::Row;

pub struct UsersDbRep {
    id: i64,
    name: String,
    gender: i16,
    parent_system_id: Option<i64>,
    discord_id: i64,
}

impl DbRep for UsersDbRep {
    type Output = User;

    fn new(row: Row) -> Self {
        Self {
            id: row.get(0),
            name: row.get(1),
            gender: row.get(2),
            parent_system_id: row.get(3),
            discord_id: row.get(4),
        }
    }

    fn model(self) -> Self::Output {
        Self::Output::new(
            self.id,
            self.name,
            Gender::parse(self.gender as u8).unwrap(),
            None,
            vec![],
            unsafe { std::mem::transmute(self.discord_id) },
        )
    }

    fn select_order() -> &'static str {
        "id, name, gender, parent_system, discord_id"
    }
}

#[derive(Debug)]
pub struct UsersImpl {
    provider: BoxedConnectionProvider,
}

impl PostgresImpl for UsersImpl {
    fn new(provider: BoxedConnectionProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl Users for UsersImpl {
    async fn get(&self, id: i64) -> Option<User> {
        let client = self.provider.open_client().await;
        let mut dbrep_iter = client
            .query(
                format!(
                    r"
                    SELECT
                    {}
                    FROM
                    users
                    WHERE
                    id = $1
                    ",
                    UsersDbRep::select_order()
                )
                .as_str(),
                &[&id],
            )
            .await
            .unwrap()
            .into_iter()
            .map(UsersDbRep::new);
        drop(client);
        dbrep_iter.nth(0).map(|x| x.model())
    }

    async fn add(&self, user: UserNoId) -> User {
        let id: i64 = self
            .provider
            .open_client()
            .await
            .query(
                r"
                INSERT INTO
                users
                (name, gender, parent_system, discord_id)
                VALUES
                ($1, $2, $3, $4)
                RETURNING id
                ",
                &[
                    &user.name,
                    &user.gender.to_number(),
                    &user.system.as_ref().map(|x| x.id),
                    &Sqlu64(user.discord_id),
                ],
            )
            .await
            .unwrap()
            .first()
            .unwrap()
            .get(0);
        user.add_id(id)
    }

    async fn get_by_discord_id(&self, _id: u64) -> Option<User> {
        unimplemented!()
    }

    async fn get_by_username(&self, _username: String) -> Option<User> {
        unimplemented!()
    }

    async fn get_members_multiple(&self, _users: Vec<User>) -> Vec<User> {
        unimplemented!()
    }

    async fn delete(&self, _user: User) -> bool {
        unimplemented!()
    }

    async fn delete_by_discord_id(&self, _id: u64) -> bool {
        unimplemented!()
    }

    async fn update(&self, _user: User) -> bool {
        unimplemented!()
    }
}
