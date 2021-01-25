mod migration_constants;
mod config;

use std::ops::Deref;
use crate::migration_constants::MIGRATION_FILES;
use crate::config::CONFIG;

#[tokio::main]
async fn main() {
    println!("{:?}", CONFIG.deref())
}
