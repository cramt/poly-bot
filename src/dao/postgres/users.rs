use crate::dao::postgres::{BoxedConnectionProvider, ConnectionProvider, DbRep, PostgresImpl};
use crate::dao::users::Users;
use crate::model::user::{User, UserNoId};
use crate::model::RelationalId;
use async_trait::async_trait;
use tokio_postgres::Row;

pub struct UsersDbRep {
    id: i64,
    name: String,
    gender: i16,
}

impl DbRep for UsersDbRep {
    type Output = User;

    fn new(row: Row) -> Self {
        unimplemented!()
    }

    fn model(self) -> Self::Output {
        unimplemented!()
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
    async fn get(&self, id: i64) -> User {
        unimplemented!()
    }

    async fn add(&self, user: UserNoId) -> User {
        unimplemented!()
    }

    async fn get_by_discord_id(&self, id: u64) -> User {
        unimplemented!()
    }

    async fn get_by_username(&self, username: String) -> User {
        unimplemented!()
    }

    async fn get_members_multiple(&self, users: Vec<User>) -> Vec<User> {
        unimplemented!()
    }

    async fn delete(&self, user: User) -> bool {
        unimplemented!()
    }

    async fn delete_by_discord_id(&self, id: u64) -> bool {
        unimplemented!()
    }

    async fn update(&self, user: User) -> bool {
        unimplemented!()
    }
}
