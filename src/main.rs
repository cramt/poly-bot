mod migration_constants;

use std::ops::Deref;
use crate::migration_constants::MIGRATION_FILES;

#[tokio::main]
async fn main() {
    println!("{:?}", MIGRATION_FILES.deref())
}
