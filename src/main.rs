pub mod command;
pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod polymap_generator;
pub mod tests;
pub mod utilities;

use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::DiscordResponse;
use crate::command::{all_commands, Command, CommandContext};
use crate::config::CONFIG;
use async_trait::async_trait;
use eyre::*;
use serenity::client::Context;
use serenity::client::EventHandler;
use serenity::model::channel::Message;
use serenity::model::prelude::Ready;
use serenity::Client;

use crate::dao::postgres::{apply_migrations, ConnectionProvider};

use once_cell::sync::Lazy;

use std::collections::HashMap;
use std::ops::Deref;

struct SerenityCommandContext {
    ctx: Context,
    msg: Message,
    content: String,
}

impl SerenityCommandContext {
    pub fn new(ctx: Context, msg: Message, content: String) -> Self {
        Self { ctx, msg, content }
    }
}

#[async_trait]
impl CommandContext for SerenityCommandContext {
    fn text(&self) -> &str {
        &self.content
    }

    fn discord_id(&self) -> u64 {
        self.msg.author.id.0
    }

    async fn guild_member_ids(&self) -> Vec<u64> {
        match self.msg.guild_id {
            None => Vec::new(),
            Some(x) => x
                .members(&self.ctx.http, None, None)
                .await
                .map(|x| x.into_iter().map(|y| y.user.id.0).collect())
                .unwrap_or(Vec::new()),
        }
    }
}

static ALL_COMMANDS: Lazy<HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>> =
    Lazy::new(|| all_commands());

struct Handler {
    commands: &'static HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>,
    prefix: String,
}

impl Handler {
    pub fn new(
        commands: &'static HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>,
        prefix: String,
    ) -> Self {
        Self { commands, prefix }
    }
}

impl Default for Handler {
    fn default() -> Self {
        Self::new(ALL_COMMANDS.deref(), CONFIG.prefix.clone())
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
            match command
                .run(SerenityCommandContext::new(
                    ctx.clone(),
                    msg.clone(),
                    content,
                ))
                .await
            {
                Ok(val) => {
                    val.respond((ctx.clone(), msg.clone())).await;
                }
                Err(err) => {
                    msg.channel_id
                        .say(&ctx.http, err)
                        .await
                        .expect("couldnt send message");
                }
            }
        } else {
            msg.channel_id
                .say(&ctx.http, format!("command {} doesnt exist", name))
                .await
                .expect("couldnt send message");
        }
    }

    async fn ready(&self, _: Context, ready: Ready) {
        println!("{} is connected", ready.user.name)
    }
}

async fn ensure_database() -> Result<()> {
    let client = ConnectionProvider::default().open_client().await;
    apply_migrations(&client).await
}

async fn ensure_discord_client() -> Result<()> {
    Client::builder(&CONFIG.discord_token)
        .event_handler(Handler::default())
        .await
        .expect("failed to spawn client")
        .start()
        .await
        .map_err(|x| Report::new(x))
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    let (db, discord) = futures::future::join(ensure_database(), ensure_discord_client()).await;
    vec![db, discord]
        .into_iter()
        .find(|x| x.is_err())
        .unwrap_or(Ok(()))
}
