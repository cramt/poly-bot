use crate::command::help::Help;
use eyre::Result;

use crate::command::add_user::AddUser;
use crate::command::color::Color;
use crate::command::command_response::CommandResponse;
use async_trait::async_trait;

use crate::command::add_member::AddMember;
use crate::command::add_relationship::AddRelationship;
use std::collections::HashMap;

pub mod add_member;
pub mod add_relationship;
pub mod add_user;
pub mod argument_parser;
pub mod color;
pub mod command_response;
pub mod error;
pub mod help;

#[async_trait]
pub trait CommandContext: Send + Sync {
    fn text(&self) -> &str;
    fn discord_id(&self) -> u64;
    async fn guild_member_ids(&self) -> Vec<u64>;
}

#[async_trait]
pub trait Command<Ctx: CommandContext>: Send + Sync {
    fn name(&self) -> &'static str;
    fn help(&self) -> &'static str;
    fn argument_help(&self) -> &'static str;
    async fn run(&self, ctx: Ctx) -> Result<CommandResponse>;
}

pub fn all_commands<Ctx: CommandContext + 'static>() -> HashMap<&'static str, Box<dyn Command<Ctx>>>
{
    let v: Vec<Box<dyn Command<Ctx>>> = vec![
        Box::new(Help::new()),
        Box::new(AddUser::new()),
        Box::new(Color::new()),
        Box::new(AddMember::new()),
        Box::new(AddRelationship::new()),
    ];
    v.into_iter()
        .map(|x| (x.name(), x))
        .collect::<HashMap<&str, Box<dyn Command<Ctx>>>>()
}
