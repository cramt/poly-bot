mod config;
mod dao;
mod migration_constants;
mod tests;

use crate::config::CONFIG;
use crate::migration_constants::MIGRATION_FILES;
use std::ops::Deref;
use std::thread::sleep;
use tokio::time::Duration;
use tokio_postgres::{Error, NoTls};

#[tokio::main]
async fn main() -> Result<(), Error> {
    Ok(())
}
