use async_trait::async_trait;
use poly_bot_core::command::command_response::CommandResponse;
use serenity::client::Context;
use serenity::model::channel::{Message, ReactionType};

#[async_trait]
pub trait DiscordResponse {
    type Context;

    async fn respond(self, ctx: Self::Context);
}

#[async_trait]
impl DiscordResponse for CommandResponse {
    type Context = (Context, Message);

    async fn respond(self, ctx: Self::Context) {
        let (ctx, msg) = ctx;
        match self {
            CommandResponse::Text(str) => {
                for msg_str in discord_size_safety(2000, str) {
                    msg.channel_id
                        .say(&ctx, msg_str)
                        .await
                        .expect("message send failed");
                }
            }
            CommandResponse::TextBlock(str) => {
                for msg_str in discord_size_safety(2000 - 6, str)
                    .into_iter()
                    .map(|x| format!("```{}```", x))
                {
                    msg.channel_id
                        .say(&ctx, msg_str)
                        .await
                        .expect("message send failed");
                }
            }
            CommandResponse::Reaction(reaction) => {
                msg.react(&ctx.http, ReactionType::Unicode(reaction))
                    .await
                    .expect("failed to react");
            }
        }
    }
}

fn discord_size_safety(size: usize, str: String) -> Vec<String> {
    str.chars()
        .into_iter()
        .fold(vec![String::with_capacity(size)], |mut acc, x| {
            let mut str = acc.pop().unwrap();
            if str.len() == size {
                acc.push(str);
                let mut str = String::with_capacity(size);
                str.push(x);
                acc.push(str);
            } else {
                str.push(x);
                acc.push(str);
            }
            acc
        })
}
