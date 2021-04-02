pub mod command;
pub mod dao;
pub mod model;

pub trait RelationalId {
    fn id(&self) -> i64;
}

#[test]
fn a() {}
