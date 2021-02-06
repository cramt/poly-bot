use crate::model::id_tree::IdTree;
use crate::model::RelationalId;
use std::ops::Deref;
use crate::model::color::Color;

#[derive(Debug, Clone)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub color: Color,
    pub members: Vec<User>,
    pub discord_id: Option<u64>,
}

impl User {
    pub fn new<S: AsRef<str>>(
        id: i64,
        name: S,
        color: Color,
        members: Vec<User>,
        discord_id: Option<u64>,
    ) -> Self {
        Self {
            id,
            name: name.as_ref().to_string(),
            color,
            members,
            discord_id,
        }
    }
}

impl RelationalId for User {
    fn id(&self) -> i64 {
        self.id
    }
}

#[derive(Debug, Clone)]
pub struct UserNoId {
    pub name: String,
    pub color: Color,
    pub system: Option<Box<User>>,
    pub members: Vec<UserNoId>,
    pub discord_id: Option<u64>,
}

impl UserNoId {
    pub fn new<S: AsRef<str>>(
        name: S,
        color: Color,
        system: Option<Box<User>>,
        members: Vec<UserNoId>,
        discord_id: Option<u64>,
    ) -> Self {
        Self {
            name: name.as_ref().to_string(),
            color,
            members,
            system,
            discord_id,
        }
    }

    pub fn add_id(self, id_tree: IdTree) -> User {
        let id = id_tree.deref().clone();
        let inner_members = id_tree.member_values;
        let members = self
            .members
            .into_iter()
            .zip(inner_members.into_iter())
            .map(|(member, id)| member.add_id(id))
            .collect();
        User::new(id, self.name, self.color, members, self.discord_id)
    }
}

impl Into<UserNoId> for User {
    fn into(self) -> UserNoId {
        UserNoId::new(
            self.name,
            self.color,
            None,
            self.members.into_iter().map(|x| x.into()).collect(),
            self.discord_id,
        )
    }
}
