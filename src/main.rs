pub mod command;
pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod polymap_generator;
pub mod tests;
pub mod utilities;

use std::fs::File;
use std::io::Write;

use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::{CommandResponse, DiscordResponse};
use crate::command::{all_commands, Command};
use crate::config::CONFIG;
use async_trait::async_trait;
use eyre::*;
use serenity::client::Context;
use serenity::client::EventHandler;
use serenity::model::channel::Message;
use serenity::model::prelude::Ready;
use serenity::Client;
use std::collections::hash_map::RandomState;
use std::collections::HashMap;
use std::ops::Deref;

struct Handler {
    commands: &'static HashMap<&'static str, Box<dyn Command>>,
    prefix: String,
}

impl Handler {
    pub fn new(commands: &'static HashMap<&'static str, Box<dyn Command>>, prefix: String) -> Self {
        Self { commands, prefix }
    }
}

impl Default for Handler {
    fn default() -> Self {
        Self::new(all_commands(), CONFIG.prefix.clone())
    }
}

#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.author.bot || !msg.content.starts_with(&self.prefix) {
            return;
        }
        let mut content = msg.content[self.prefix.len()..].to_string();
        let name = StringArgumentParser::new().parse(&mut content).unwrap();
        if let Some(command) = self.commands.get(name.as_str()) {
            match command.run(msg.clone()) {
                Ok(val) => {
                    val.respond((ctx, msg));
                }
                Err(err) => {
                    msg.channel_id.say(&ctx.http, err);
                }
            }
        } else {
            msg.channel_id
                .say(&ctx.http, format!("command {} doesnt exist", name));
        }
    }

    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected", ready.user.name)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    let mut client = Client::builder(&CONFIG.discord_token)
        .event_handler(Handler::default())
        .await
        .expect("failed to spawn client");
    client.start().await.map_err(|x| Report::new(x))
}
