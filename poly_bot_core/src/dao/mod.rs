use crate::dao::relationships::Relationships;
use crate::dao::singleton::Singleton;
use crate::dao::users::Users;

pub mod relationships;
pub mod singleton;
pub mod users;

pub struct Dao {
    pub users: Box<dyn Users + Sync + Send>,
    pub singleton: Box<dyn Singleton + Sync + Send>,
    pub relationships: Box<dyn Relationships + Sync + Send>,
}
