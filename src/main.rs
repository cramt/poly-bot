pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod tests;
pub mod utilities;
pub mod command;

use tokio_postgres::Error;

#[tokio::main]
async fn main() -> Result<(), Error> {
    Ok(())
}
