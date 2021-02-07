use crate::command::help::Help;
use eyre::Result;

use once_cell::sync::Lazy;

use crate::command::command_response::CommandResponse;
use serenity::model::channel::Message;
use std::collections::HashMap;
use std::ops::Deref;

pub mod argument_parser;
pub mod command_response;
pub mod help;

pub trait Command: Send + Sync {
    fn name(&self) -> &'static str;
    fn help(&self) -> &'static str;
    fn argument_help(&self) -> &'static str;
    fn run(&self, msg: Message) -> Result<CommandResponse>;
}

pub fn all_commands() -> &'static HashMap<&'static str, Box<dyn Command>> {
    ALL_COMMANDS.deref()
}

static ALL_COMMANDS: Lazy<HashMap<&'static str, Box<dyn Command>>> = Lazy::new(|| {
    let v: Vec<Box<dyn Command>> = vec![Box::new(Help::new())];
    v.into_iter().map(|x| (x.name(), x)).collect()
});
