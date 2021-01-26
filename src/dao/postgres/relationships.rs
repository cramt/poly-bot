use crate::dao::relationships::Relationships;
use crate::model::relationship::{Relationship, RelationshipNoId};
use crate::model::user::User;
use crate::model::RelationalId;
use async_trait::async_trait;
use serenity::static_assertions::_core::future::Future;

pub struct RelationshipsImpl;
