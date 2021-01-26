#[cfg(test)]
mod dao {
    use crate::dao::postgres::relationships::RelationshipsImpl;
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

    #[tokio::test]
    async fn add_user() {
        let user = crate::dao::users::default()
            .add(UserNoId::new("me", Gender::Femme, None, vec![], 0))
            .await;
    }
}
