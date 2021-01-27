#[cfg(test)]
mod dao {
    use crate::dao::postgres::{apply_migrations, ConnectionProvider, DockerConnectionProvider};
    use once_cell::sync::Lazy;
    use serenity::futures::future::BoxFuture;
    use serenity::FutureExt;
    use std::collections::HashSet;
    use std::future::Future;
    use std::ops::{Deref, DerefMut};
    use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
    use std::sync::Mutex;

    static ATOMIC_DISCORD_ID: AtomicU64 = AtomicU64::new(0);

    pub fn discord_id_provider() -> u64 {
        ATOMIC_DISCORD_ID.fetch_add(1, Ordering::SeqCst)
    }

    static READY_FIRST: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(true));

    pub async fn wait_for_test_db_ready() {
        let mut guard = READY_FIRST.lock().unwrap();
        let val = guard.deref_mut();
        if val.clone() {
            let client = DockerConnectionProvider.open_client().await;
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
            apply_migrations(&client).await;
        }
        *val = false;
        std::mem::drop(guard)
    }

    mod user {
        use crate::dao::users;
        use crate::model::gender::Gender;
        use crate::model::user::UserNoId;
        use crate::tests::dao::dao::{discord_id_provider, wait_for_test_db_ready};
        use serenity::static_assertions::_core::sync::atomic::AtomicU64;
        use serenity::static_assertions::_core::time::Duration;
        use std::ops::Deref;
        use std::sync::atomic::Ordering;
        use std::thread::sleep;

        #[tokio::test]
        async fn add_user() {
            wait_for_test_db_ready().await;
            let _user = users::default()
                .add(UserNoId::new(
                    "person",
                    Gender::Femme,
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await;
        }

        #[tokio::test]
        async fn get_user() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    "person",
                    Gender::Femme,
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await;
            let found_user = client.get(user.id.clone()).await.unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.gender, found_user.gender);
            assert_eq!(user.name, found_user.name);
            assert_eq!(user.discord_id, found_user.discord_id)
        }
    }
}
