#[cfg(test)]
mod dao {
    use crate::dao::{ConnectionProvider, DockerConnectionProvider};

    #[tokio::test]
    async fn idk() {
        let conn = DockerConnectionProvider::open_client().await;
    }
}
