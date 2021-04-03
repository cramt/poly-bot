mod user;

use crate::{apply_migrations, ConnectionProvider};
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::ops::DerefMut;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

static ATOMIC_DISCORD_ID: AtomicU64 = AtomicU64::new(0);

pub fn discord_id_provider() -> Option<u64> {
    Some(ATOMIC_DISCORD_ID.fetch_add(1, Ordering::SeqCst))
}

static READY_FIRST: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(true));

pub async fn wait_for_test_db_ready() {
    let mut guard = READY_FIRST.lock().unwrap();
    let val = guard.deref_mut();
    if *val {
        let client = ConnectionProvider::default().open_client().await;
        let mut tables = client
            .query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
                &[],
            )
            .await
            .unwrap()
            .into_iter()
            .map(|x| x.get(0))
            .collect::<HashSet<String>>();
        while !tables.is_empty() {
            let mut v = vec![];
            for table in &tables {
                if client
                    .query(format!("DROP TABLE {}", table).as_str(), &[])
                    .await
                    .is_ok()
                {
                    v.push(table.clone())
                }
            }
            for x in v {
                tables.remove(&x);
            }
        }
        apply_migrations(&client).await.expect("migration failed")
    }
    *val = false;
    std::mem::drop(guard)
}
