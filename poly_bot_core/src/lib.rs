use crate::dao::Dao;
use crate::polymap_generator::BoxPolymapGenerator;

pub mod command;
pub mod dao;
pub mod model;
pub mod polymap_generator;

pub trait RelationalId {
    fn id(&self) -> i64;
}

pub struct Using {
    pub dao: Dao,
    pub polymap_generator: BoxPolymapGenerator,
}
