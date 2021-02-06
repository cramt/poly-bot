pub mod color;
pub mod id_tree;
pub mod relationship;
pub mod relationship_type;
pub mod user;

pub trait RelationalId {
    fn id(&self) -> i64;
}
