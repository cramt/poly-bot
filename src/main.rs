pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod tests;

use crate::config::CONFIG;
use crate::migration_constants::MIGRATION_FILES;
use serenity::model::channel::Message;
use std::ops::Deref;
use std::thread::sleep;
use tokio::time::Duration;
use tokio_postgres::{Error, NoTls};

#[tokio::main]
async fn main() -> Result<(), Error> {
    Ok(())
}
