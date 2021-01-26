#[cfg(test)]
mod dao {
    use crate::dao::postgres::{apply_migrations, ConnectionProvider, DockerConnectionProvider};

    #[tokio::test]
    async fn migration() {
        apply_migrations(DockerConnectionProvider::open_client().await).await
    }
}
