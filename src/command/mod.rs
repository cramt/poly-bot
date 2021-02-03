use crate::command::argument_parser::ArgumentParser;
use crate::command::help::Help;
use eyre::Result;
use eyre::*;
use once_cell::sync::Lazy;
use std::collections::hash_map::RandomState;
use std::collections::HashMap;
use std::ops::Deref;

pub mod argument_parser;
pub mod help;

pub trait Command: Send + Sync {
    fn name(&self) -> &'static str;
    fn help(&self) -> &'static str;
    fn argument_help(&self) -> &'static str;
    fn run(&self) -> Result<String>;
}

pub fn all_commands() -> &'static HashMap<&'static str, Box<dyn Command>> {
    ALL_COMMANDS.deref()
}

static ALL_COMMANDS: Lazy<HashMap<&'static str, Box<dyn Command>>> = Lazy::new(|| {
    let v: Vec<Box<dyn Command>> = vec![Box::new(Help::new())];
    v.into_iter().map(|x| (x.name(), x)).collect()
});
