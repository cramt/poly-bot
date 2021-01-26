#[cfg(test)]
mod dao {
    use crate::dao::postgres::{ConnectionProvider, DockerConnectionProvider, apply_migrations};

    #[tokio::test]
    async fn migration() {
        apply_migrations(DockerConnectionProvider::open_client().await).await
    }
}
