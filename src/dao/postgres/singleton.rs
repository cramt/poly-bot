use crate::dao::postgres::{BoxedConnectionProvider, PostgresImpl};
use crate::dao::singleton::Singleton;
use crate::model::relationship::Relationship;
use crate::model::user::User;
use async_trait::async_trait;

#[derive(Debug)]
pub struct SingletonImpl {
    provider: BoxedConnectionProvider,
}

impl PostgresImpl for SingletonImpl {
    fn new(provider: BoxedConnectionProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl Singleton for SingletonImpl {
    async fn get_all_in(discord_ids: Vec<u64>) -> (Vec<Relationship>, Vec<User>) {
        unimplemented!()
    }
}
