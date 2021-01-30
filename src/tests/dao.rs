#[cfg(test)]
mod dao {
    use crate::dao::postgres::{apply_migrations, ConnectionProvider, DockerConnectionProvider};
    use once_cell::sync::Lazy;

    use serenity::FutureExt;
    use std::collections::HashSet;

    use std::ops::DerefMut;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;

    static ATOMIC_DISCORD_ID: AtomicU64 = AtomicU64::new(0);

    pub fn discord_id_provider() -> u64 {
        ATOMIC_DISCORD_ID.fetch_add(1, Ordering::SeqCst).clone()
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

        #[tokio::test]
        async fn add_user() {
            wait_for_test_db_ready().await;
            let user = users::default()
                .add(UserNoId::new(
                    "person",
                    Gender::Femme,
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await;
            assert_eq!("person", user.name);
            assert_eq!(Gender::Femme, user.gender);
        }

        #[tokio::test]
        async fn add_member_to_user() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let root = client.add(UserNoId::new("root", Gender::System, None, vec![], discord_id_provider())).await;
            let member = client.add(UserNoId::new("member", Gender::Femme, Some(Box::new(root.clone())), vec![], discord_id_provider())).await;
            assert_eq!(root.id, member.system.unwrap().id);
        }

        #[tokio::test]
        async fn add_user_with_members() {
            wait_for_test_db_ready().await;
            let client = users::default();
            let user = client.add(UserNoId::new("root", Gender::System, None, vec![UserNoId::new(
                "member", Gender::Femme, None, vec![], discord_id_provider(),
            )], discord_id_provider())).await;
            let found_user = client.get(user.id).await.unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.members.first().unwrap().id, found_user.members.first().unwrap().id)
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

        #[tokio::test]
        async fn get_user_by_discord_id() {
            wait_for_test_db_ready().await;
            let discord_id = discord_id_provider();
            let client = users::default();
            let user = client
                .add(UserNoId::new(
                    "person",
                    Gender::Femme,
                    None,
                    vec![],
                    discord_id,
                ))
                .await;
            let found_user = client.get_by_discord_id(discord_id).await.unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.gender, found_user.gender);
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
                    Gender::Femme,
                    None,
                    vec![],
                    discord_id_provider(),
                ))
                .await;
            assert!(client
                .get_by_username(username)
                .await
                .into_iter()
                .find(|x| x.id.clone() == user.id)
                .is_some());
        }
    }
}
