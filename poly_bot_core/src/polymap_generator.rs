use crate::model::relationship::Relationship;
use crate::model::user::User;
use async_trait::async_trait;

pub type BoxPolymapGenerator = Box<dyn PolymapGenerator + Sync + Send>;

#[async_trait]
pub trait PolymapGenerator {
    async fn generate(&self, relationships: &[&Relationship], users: &[&User]) -> Option<Vec<u8>>;
}
