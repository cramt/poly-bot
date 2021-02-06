use crate::dao::postgres::{BoxedConnectionProvider, DbRep, PostgresImpl, Sqlu64};
use crate::dao::users::Users;
use crate::model::user::{User, UserNoId};

use crate::model::id_tree::IdTree;
use crate::utilities::{NumUtils, PostgresClientUtils};
use async_trait::async_trait;
use std::collections::{HashMap, VecDeque};

use crate::model::color::Color;
use std::ops::Deref;
use tokio_postgres::types::ToSql;
use tokio_postgres::Row;

#[derive(Debug)]
pub struct UsersDbRep {
    id: i64,
    name: String,
    color: Box<[u8]>,
    parent_system_id: Option<i64>,
    discord_id: Option<i64>,
}

impl UsersDbRep {
    pub fn create_tree_structure(v: Vec<Self>) -> Vec<User> {
        let (main, mut v): (Vec<Self>, Vec<Self>) =
            v.into_iter().partition(|x| x.parent_system_id.is_none());
        let mut main = main.into_iter().map(|x| x.model()).collect::<Vec<User>>();
        let mut map = main
            .iter_mut()
            .map(|x| (x.id.clone(), x))
            .collect::<HashMap<i64, &mut User>>();
        loop {
            let (now, later): (Vec<Self>, Vec<Self>) = v
                .into_iter()
                .partition(|x| map.contains_key(&x.parent_system_id.unwrap()));

            let now_empty = now.is_empty();

            for entry in now {
                let parent = map.get_mut(&entry.parent_system_id.unwrap()).unwrap();
                let model = entry.model();
                parent.members.push(model);
            }

            v = later;
            if v.is_empty() {
                break;
            }

            if now_empty {
                panic!("wow, this shouldnt ever happen")
            }
        }
        main
    }

    fn transformed_discord_id(&self) -> Option<u64> {
        self.discord_id
            .as_ref()
            .map(|x| unsafe { std::mem::transmute(x.clone()) })
    }

    fn transformed_color(&self) -> Color {
        self.color.clone().into()
    }
}

impl DbRep for UsersDbRep {
    type Output = User;

    fn new(row: Row) -> Self {
        Self {
            id: row.get(0),
            name: row.get(1),
            color: row.get::<_, &[u8]>(2).to_vec().into_boxed_slice(),
            parent_system_id: row.get(3),
            discord_id: row.get(4),
        }
    }

    fn model(self) -> Self::Output {
        let color = self.transformed_color();
        let discord_id = self.transformed_discord_id();
        Self::Output::new(self.id, self.name, color, vec![], discord_id)
    }

    fn select_order_raw() -> &'static [&'static str] {
        &["id", "name", "color", "parent_system", "discord_id"]
    }
}

#[derive(Debug)]
pub struct UsersImpl {
    provider: BoxedConnectionProvider,
}

impl PostgresImpl for UsersImpl {
    fn new(provider: BoxedConnectionProvider) -> Self {
        Self { provider }
    }
}

#[async_trait]
impl Users for UsersImpl {
    async fn get(&self, id: i64) -> Option<User> {
        let client = self.provider.open_client().await;
        let dbreps = client
            .query(
                format!(
                    r"
                    WITH top_id as (SELECT get_topmost_system($1))
                    SELECT * FROM
                    (
                        WITH RECURSIVE members AS (
                            SELECT
                            {x}
                            FROM
                            users
                            WHERE parent_system = (select * from top_id)
                            UNION
                            SELECT
                            {ux}
                            FROM
                            users u
                            INNER JOIN
                            members m
                            ON
                            m.id = u.parent_system
                        )
                        SELECT
                        {x}
                        FROM
                        members

                        UNION

                        SELECT
                        {x}
                        FROM
                        users
                        WHERE
                        id = (select * from top_id)
                    ) _
                    ",
                    x = UsersDbRep::select_order(),
                    ux = UsersDbRep::select_order_raw()
                        .into_iter()
                        .map(|x| format!("u.{}", x))
                        .collect::<Vec<String>>()
                        .join(", ")
                )
                .as_str(),
                &[&id],
            )
            .await
            .unwrap()
            .into_iter()
            .map(UsersDbRep::new)
            .collect::<Vec<UsersDbRep>>();
        client.close();
        UsersDbRep::create_tree_structure(dbreps).into_iter().nth(0)
    }

    async fn add(&self, user: UserNoId) -> User {
        fn generate_query(user: &UserNoId, n: &mut u64, id_ref: String) -> (String, Vec<String>) {
            let my_id_ref = format!("u{}", n);
            let my_query = format!(
                r"
                {}
                AS (
                    INSERT INTO
                    users
                    (parent_system, name, color, discord_id)
                    VALUES
                    ({}, ${}, ${}, ${})
                    RETURNING id
                )
                ",
                my_id_ref,
                id_ref,
                n.increment(),
                n.increment(),
                n.increment()
            );
            let (mut post_queries, mut id_refs) = user
                .members
                .iter()
                .map(|x| generate_query(x, n, format!("(SELECT id FROM {})", my_id_ref)))
                .fold((VecDeque::new(), vec![]), |(mut a, b), x| {
                    a.push_back(x.0);
                    (a, b.into_iter().chain(x.1.into_iter()).collect())
                });
            post_queries.push_front(my_query);
            id_refs.push(my_id_ref);
            (
                post_queries.into_iter().collect::<Vec<String>>().join(","),
                id_refs,
            )
        }
        fn generate_content(
            user: &UserNoId,
            mut v: Vec<Box<(dyn ToSql + Sync + Send)>>,
            first: bool,
        ) -> Vec<Box<(dyn ToSql + Sync + Send)>> {
            let system = user.system.as_ref().map(|x| x.id);
            if first {
                v.push(Box::new(system));
            }
            let name = user.name.clone();
            v.push(Box::new(name));
            let color: Box<[u8]> = user.color.clone().into();
            let color = color.to_vec();
            v.push(Box::new(color));
            let discord_id = user.discord_id.as_ref().map(|x| Sqlu64(x.clone()));
            v.push(Box::new(discord_id));

            for m in user.members.iter() {
                v = generate_content(m, v, false)
            }

            v
        }
        fn generate_post_query(mut v: Vec<String>) -> String {
            v.reverse();
            v.into_iter()
                .map(|x| format!("SELECT id FROM {}", x))
                .collect::<Vec<String>>()
                .join(" UNION ")
        }
        let (query, id_refs) = generate_query(&user, &mut 1, "$1".to_string());
        let query = format!("WITH {} {}", query, generate_post_query(id_refs));
        let content = generate_content(&user, vec![], true);
        let client = self.provider.open_client().await;
        let mut id = client
            .query(
                query.as_str(),
                content
                    .iter()
                    .map(|x| x.deref())
                    .map(|x| x as &(dyn ToSql + Sync))
                    .collect::<Vec<&(dyn ToSql + Sync)>>()
                    .as_slice(),
            )
            .await
            .unwrap()
            .into_iter()
            .map(|x| {
                let i: i64 = x.get(0);
                i
            })
            .collect::<VecDeque<i64>>();
        client.close();

        fn make_id_tree(v: &mut VecDeque<i64>, user: &UserNoId) -> IdTree {
            IdTree::new(
                v.pop_front().unwrap(),
                user.members.iter().map(|x| make_id_tree(v, x)).collect(),
            )
        }

        let id_tree = make_id_tree(&mut id, &user);

        user.add_id(id_tree)
    }

    async fn get_by_discord_id(&self, id: u64) -> Option<User> {
        let client = self.provider.open_client().await;
        let dbreps = client
            .query(
                format!(
                    r"
                    SELECT
                    {}
                    FROM
                    users
                    WHERE
                    discord_id = $1
                    ",
                    UsersDbRep::select_order()
                )
                .as_str(),
                &[&Sqlu64(id)],
            )
            .await
            .unwrap()
            .into_iter()
            .map(UsersDbRep::new)
            .collect::<Vec<UsersDbRep>>();
        client.close();
        dbreps.into_iter().nth(0).map(|x| x.model())
    }

    async fn get_by_username(&self, username: String) -> Vec<User> {
        let client = self.provider.open_client().await;
        let dbrep_iter = client
            .query(
                format!(
                    r"
                    SELECT
                    {}
                    FROM
                    users
                    WHERE
                    name = $1
                    ",
                    UsersDbRep::select_order()
                )
                .as_str(),
                &[&username],
            )
            .await
            .unwrap()
            .into_iter()
            .map(UsersDbRep::new);
        client.close();
        dbrep_iter.map(|x| x.model()).collect()
    }

    async fn get_members_multiple(&self, _users: Vec<User>) -> Vec<User> {
        unimplemented!()
    }

    async fn delete(&self, _user: User) -> bool {
        unimplemented!()
    }

    async fn delete_by_discord_id(&self, _id: u64) -> bool {
        unimplemented!()
    }

    async fn update(&self, _user: User) -> bool {
        unimplemented!()
    }
}
