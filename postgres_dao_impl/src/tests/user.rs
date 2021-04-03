use crate::tests::{discord_id_provider, wait_for_test_db_ready};
use crate::users::UsersImpl;
use crate::PostgresImpl;
use poly_bot_core::dao::users::Users;
use poly_bot_core::model::color::Color;
use poly_bot_core::model::user::UserNoId;

#[tokio::test]
async fn add_user() {
    wait_for_test_db_ready().await;
    let user = UsersImpl::default()
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
    let client = UsersImpl::default();
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
    let client = UsersImpl::default();
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
    let client = UsersImpl::default();
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
    let found_user = client.get(user.id).await.unwrap().unwrap();
    assert_eq!(user.id, found_user.id);
    assert_eq!(user.name, found_user.name);
    assert_eq!(user.color, found_user.color);
    assert_eq!(user.discord_id, found_user.discord_id)
}

#[tokio::test]
async fn get_user_by_discord_id() {
    wait_for_test_db_ready().await;
    let discord_id = discord_id_provider();
    let client = UsersImpl::default();
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
    let client = UsersImpl::default();
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
        .any(|x| x.id == user.id));
}
