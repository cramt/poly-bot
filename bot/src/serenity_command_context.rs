use crate::USING;
use async_trait::async_trait;
use poly_bot_core::command::CommandContext;
use poly_bot_core::Using;
use serenity::client::Context;
use serenity::model::channel::Message;
use std::ops::Deref;

pub struct SerenityCommandContext {
    pub ctx: Context,
    pub msg: Message,
    pub content: String,
}

impl SerenityCommandContext {
    pub fn new(ctx: Context, msg: Message, content: String) -> Self {
        Self { ctx, msg, content }
    }

    pub fn ctx_and_msg(self) -> (Context, Message) {
        (self.ctx, self.msg)
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
                .unwrap_or_default(),
        }
    }

    fn using(&self) -> &Using {
        USING.deref()
    }
}
