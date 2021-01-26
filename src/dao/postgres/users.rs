use crate::dao::postgres::{BoxedConnectionProvider, DbRep, PostgresImpl};
use crate::dao::users::Users;
use crate::model::user::{User, UserNoId};

use async_trait::async_trait;
use tokio_postgres::Row;

pub struct UsersDbRep {
    id: i64,
    name: String,
    gender: i16,
}

impl DbRep for UsersDbRep {
    type Output = User;

    fn new(_row: Row) -> Self {
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
    async fn get(&self, _id: i64) -> User {
        unimplemented!()
    }

    async fn add(&self, _user: UserNoId) -> User {
        unimplemented!()
    }

    async fn get_by_discord_id(&self, _id: u64) -> User {
        unimplemented!()
    }

    async fn get_by_username(&self, _username: String) -> User {
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
