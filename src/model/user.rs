use crate::model::gender::Gender;
use crate::model::RelationalId;
use std::ops::Deref;

#[derive(Debug, Clone)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub gender: Gender,
    pub system: Option<Box<User>>,
    pub members: Vec<User>,
}

impl User {
    pub fn new<S: AsRef<str>>(
        id: u64,
        name: S,
        gender: Gender,
        system: Option<Box<User>>,
        members: Vec<User>,
    ) -> Self {
        Self {
            id,
            name: name.as_ref().to_string(),
            gender,
            system,
            members,
        }
    }
}

impl RelationalId for User {
    fn id(&self) -> u64 {
        self.id
    }
}

#[derive(Debug, Clone)]
pub struct UserNoId {
    pub name: String,
    pub gender: Gender,
    pub system: Option<Box<User>>,
    pub members: Vec<User>,
}

impl UserNoId {
    pub fn new<S: AsRef<str>>(
        name: S,
        gender: Gender,
        system: Option<Box<User>>,
        members: Vec<User>,
    ) -> Self {
        Self {
            name: name.as_ref().to_string(),
            gender,
            system,
            members,
        }
    }

    pub fn add_id(self, id: u64) -> User {
        User::new(id, self.name, self.gender, self.system, self.members)
    }
}

impl Into<UserNoId> for User {
    fn into(self) -> UserNoId {
        UserNoId::new(self.name, self.gender, self.system, self.members)
    }
}
