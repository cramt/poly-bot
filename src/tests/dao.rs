#[cfg(test)]
mod dao {
    use crate::dao::postgres::{
        apply_migrations, ConnectionProvider, DockerConnectionProvider, PostgresImpl,
    };
    use crate::dao::relationships::Relationships;
    use crate::model::gender::Gender;
    use crate::model::user::UserNoId;

    #[tokio::test]
    async fn migration() {
        apply_migrations(DockerConnectionProvider.open_client().await).await
    }

    mod user {
        use crate::dao::users;
        use crate::model::gender::Gender;
        use crate::model::user::UserNoId;

        #[tokio::test]
        async fn add_user() {
            let user = users::default()
                .add(UserNoId::new("person", Gender::Femme, None, vec![], 0))
                .await;
        }

        #[tokio::test]
        async fn get_user() {
            let client = users::default();
            let user = client
                .add(UserNoId::new("person", Gender::Femme, None, vec![], 0))
                .await;
            let found_user = client.get(user.id.clone()).await.unwrap();
            assert_eq!(user.id, found_user.id);
            assert_eq!(user.gender, found_user.gender);
            assert_eq!(user.name, found_user.name);
        }
    }
}
