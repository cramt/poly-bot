use crate::command::help::Help;
use eyre::Result;

use once_cell::sync::Lazy;

use crate::command::add_user::AddUser;
use crate::command::color::Color;
use crate::command::command_response::CommandResponse;
use async_trait::async_trait;

use crate::command::add_member::AddMember;
use std::collections::HashMap;
use std::ops::Deref;

pub mod add_member;
pub mod add_user;
pub mod argument_parser;
pub mod color;
pub mod command_response;
pub mod error;
pub mod help;

#[derive(Debug, Clone)]
pub struct CommandContext {
    pub text: String,
    pub discord_user_id: u64,
}

impl CommandContext {
    pub fn new(text: String, discord_user_id: u64) -> Self {
        Self {
            text,
            discord_user_id,
        }
    }
}

#[async_trait]
pub trait Command: Send + Sync {
    fn name(&self) -> &'static str;
    fn help(&self) -> &'static str;
    fn argument_help(&self) -> &'static str;
    async fn run(&self, ctx: CommandContext) -> Result<CommandResponse>;
}

pub fn all_commands() -> &'static HashMap<&'static str, Box<dyn Command>> {
    ALL_COMMANDS.deref()
}

static ALL_COMMANDS: Lazy<HashMap<&'static str, Box<dyn Command>>> = Lazy::new(|| {
    let v: Vec<Box<dyn Command>> = vec![
        Box::new(Help::new()),
        Box::new(AddUser::new()),
        Box::new(Color::new()),
        Box::new(AddMember::new()),
    ];
    v.into_iter().map(|x| (x.name(), x)).collect()
});
