use poly_bot_core::command::{all_commands, Command};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use crate::serenity_command_context::SerenityCommandContext;
use std::ops::Deref;
use config::CONFIG;
use serenity::client::{Context, EventHandler};
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use async_trait::async_trait;
use crate::discord_response::DiscordResponse;
use poly_bot_core::command::argument_parser::string_argument_parser::StringArgumentParser;
use poly_bot_core::command::argument_parser::ArgumentParser;

pub static ALL_COMMANDS: Lazy<HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>> =
    Lazy::new(all_commands);

pub struct Handler<'a> {
    commands: &'a HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>,
    prefix: String,
}

impl<'a> Handler<'a> {
    pub fn new(
        commands: &'a HashMap<&'static str, Box<dyn Command<SerenityCommandContext>>>,
        prefix: String,
    ) -> Self {
        Self { commands, prefix }
    }
}

impl<'a> Default for Handler<'a>
    where
        'a: 'static,
{
    fn default() -> Self {
        Self::new(ALL_COMMANDS.deref(), CONFIG.prefix.clone())
    }
}

async fn run(
    command: &dyn Command<SerenityCommandContext>,
    ctx: Context,
    msg: Message,
    content: String,
) {
    let command_context = SerenityCommandContext::new(ctx, msg, content);
    match command.run(&command_context).await {
        Ok(val) => {
            val.respond(command_context.ctx_and_msg()).await;
        }
        Err(err) => {
            command_context
                .msg
                .channel_id
                .clone()
                .say(&command_context.ctx.http, err)
                .await
                .expect("couldnt send message");
        }
    }
}

#[async_trait]
impl EventHandler for Handler<'_> {
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.author.bot || !msg.content.starts_with(&self.prefix) {
            return;
        }
        let mut content = msg.content[self.prefix.len()..].to_string();
        let name = StringArgumentParser::new().parse(&mut content).unwrap();
        if let Some(command) = self.commands.get(name.as_str()) {
            run(command.deref(), ctx, msg, content).await;
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
