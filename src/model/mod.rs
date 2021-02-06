pub mod id_tree;
pub mod relationship;
pub mod relationship_type;
pub mod user;
pub mod color;

pub trait RelationalId {
    fn id(&self) -> i64;
}
