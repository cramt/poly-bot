use crate::relationship_type::RelationshipType;
use crate::user::User;

pub fn correct_order_users(left_user: User, right_user: User) -> (User, User) {
    if left_user.id > right_user.id {
        (right_user, left_user)
    } else {
        (left_user, right_user)
    }
}

#[derive(Clone, Debug)]
pub struct Relationship {
    pub id: i64,
    pub relationship_type: RelationshipType,
    pub left_user: User,
    pub right_user: User,
}

impl Relationship {
    pub fn new(
        id: i64,
        relationship_type: RelationshipType,
        left_user: User,
        right_user: User,
    ) -> Self {
        let (left_user, right_user) = correct_order_users(left_user, right_user);
        Self {
            id,
            relationship_type,
            left_user,
            right_user,
        }
    }
}

#[derive(Clone, Debug)]
pub struct RelationshipNoId {
    pub relationship_type: RelationshipType,
    pub left_user: User,
    pub right_user: User,
}

impl RelationshipNoId {
    pub fn new(relationship_type: RelationshipType, left_user: User, right_user: User) -> Self {
        let (left_user, right_user) = correct_order_users(left_user, right_user);
        Self {
            relationship_type,
            left_user,
            right_user,
        }
    }

    pub fn add_id(self, id: i64) -> Relationship {
        Relationship::new(id, self.relationship_type, self.left_user, self.right_user)
    }
}

impl Into<RelationshipNoId> for Relationship {
    fn into(self) -> RelationshipNoId {
        RelationshipNoId::new(self.relationship_type, self.left_user, self.right_user)
    }
}
