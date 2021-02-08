#[cfg(test)]
mod dao {
    use crate::dao::postgres::{apply_migrations, ConnectionProvider, DockerConnectionProvider};
    use once_cell::sync::Lazy;

    use std::collections::HashSet;

    use std::ops::DerefMut;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;

    static ATOMIC_DISCORD_ID: AtomicU64 = AtomicU64::new(0);

    pub fn discord_id_provider() -> Option<u64> {
        Some(ATOMIC_DISCORD_ID.fetch_add(1, Ordering::SeqCst).clone())
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
            apply_migrations(&client).await.expect("migration failed")
        }
        *val = false;
        std::mem::drop(guard)
    }

    mod user {
        use crate::dao::users;
        use crate::model::color::Color;
        use crate::model::user::UserNoId;
        use crate::tests::dao::dao::{discord_id_provider, wait_for_test_db_ready};

        #[tokio::test]
        async fn add_user() {
            wait_for_test_db_ready().await;
            let user = users::default()
                .add(UserNoId::new(
                    "person",
                    Color::default(),
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            assert_eq!("person", user.name);
        }

        #[tokio::test]
        async fn add_member_to_user() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let root = client
                .add(UserNoId::new(
                    "root",
                    Color::default(),
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            let member = client
                .add(UserNoId::new(
                    "member",
                    Color::default(),
                    Some(Box::new(root.clone())),
                    vec![],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            let root = client.get(root.id).await.unwrap().unwrap();
            assert_eq!(root.members.first().unwrap().id, member.id);
        }

        #[tokio::test]
        async fn add_user_with_members() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    "root",
                    Color::default(),
                    None,
                    vec![UserNoId::new(
                        "member",
                        Color::default(),
                        None,
                        vec![],
                        discord_id_provider(),
                    )],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            let found_user = client.get(user.id).await.unwrap().unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(
                user.members.first().unwrap().id,
                found_user.members.first().unwrap().id
            )
        }

        #[tokio::test]
        async fn get_user() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    "person",
                    Color::default(),
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            let found_user = client.get(user.id.clone()).await.unwrap().unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.name, found_user.name);
            assert_eq!(user.color, found_user.color);
            assert_eq!(user.discord_id, found_user.discord_id)
        }

        #[tokio::test]
        async fn get_user_by_discord_id() {
            wait_for_test_db_ready().await;
            let discord_id = discord_id_provider();
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    "person",
                    Color::default(),
                    None,
                    vec![],
                    discord_id,
                ))
                .await
                .unwrap();
            let found_user = client
                .get_by_discord_id(discord_id.unwrap())
                .await
                .unwrap()
                .unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.name, found_user.name);
            assert_eq!(user.discord_id, found_user.discord_id)
        }

        #[tokio::test]
        async fn get_user_by_username() {
            wait_for_test_db_ready().await;
            let username = "dude_mcperson".to_string();
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    username.clone(),
                    Color::default(),
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await
                .unwrap();
            assert!(client
                .get_by_username(username)
                .await
                .unwrap()
                .into_iter()
                .find(|x| x.id.clone() == user.id)
                .is_some());
        }
    }
}
