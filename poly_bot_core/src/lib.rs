pub mod model;
pub mod command;
pub mod dao;

pub trait RelationalId {
    fn id(&self) -> i64;
}


#[test]
fn a(){

}
