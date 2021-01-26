use crate::model::gender::Gender;
use crate::model::RelationalId;
use std::ops::Deref;

#[derive(Debug, Clone)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub gender: Gender,
    pub system: Option<Box<User>>,
    pub members: Vec<User>,
    pub discord_id: u64,
}

impl User {
    pub fn new<S: AsRef<str>>(
        id: i64,
        name: S,
        gender: Gender,
        system: Option<Box<User>>,
        members: Vec<User>,
        discord_id: u64,
    ) -> Self {
        Self {
            id,
            name: name.as_ref().to_string(),
            gender,
            system,
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
    pub gender: Gender,
    pub system: Option<Box<User>>,
    pub members: Vec<User>,
    pub discord_id: u64,
}

impl UserNoId {
    pub fn new<S: AsRef<str>>(
        name: S,
        gender: Gender,
        system: Option<Box<User>>,
        members: Vec<User>,
        discord_id: u64,
    ) -> Self {
        Self {
            name: name.as_ref().to_string(),
            gender,
            system,
            members,
            discord_id,
        }
    }

    pub fn add_id(self, id: i64) -> User {
        User::new(
            id,
            self.name,
            self.gender,
            self.system,
            self.members,
            self.discord_id,
        )
    }
}

impl Into<UserNoId> for User {
    fn into(self) -> UserNoId {
        UserNoId::new(
            self.name,
            self.gender,
            self.system,
            self.members,
            self.discord_id,
        )
    }
}
