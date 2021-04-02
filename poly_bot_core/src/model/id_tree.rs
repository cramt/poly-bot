use std::ops::Deref;

#[derive(Debug, Clone, PartialEq)]
pub struct IdTree {
    pub value: i64,
    pub member_values: Vec<IdTree>,
}

impl IdTree {
    pub fn new(value: i64, member_values: Vec<IdTree>) -> Self {
        Self {
            value,
            member_values,
        }
    }

    pub fn new_single(value: i64) -> Self {
        Self::new(value, vec![])
    }
}

impl Into<i64> for IdTree {
    fn into(self) -> i64 {
        self.value
    }
}

impl Deref for IdTree {
    type Target = i64;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}
