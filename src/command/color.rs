use crate::command::argument_parser::from_string_argument_parser::ColorArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::CommandResponse;
use crate::command::{Command, CommandContext};
use async_trait::async_trait;
use eyre::*;

#[derive(Debug)]
pub struct Color;

impl Color {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl Command for Color {
    fn name(&self) -> &'static str {
        "color"
    }

    fn help(&self) -> &'static str {
        "//TODO"
    }

    fn argument_help(&self) -> &'static str {
        "//TODO"
    }

    async fn run(&self, mut ctx: CommandContext) -> Result<CommandResponse> {
        let users = crate::dao::users::default();
        let mut user = users
            .get_by_discord_id(ctx.discord_user_id.clone())
            .await?
            .ok_or(super::error::no_user_by_discord_id())?;
        Ok(match ColorArgumentParser::new().parse(&mut ctx.text).ok() {
            None => CommandResponse::Text(user.color.to_string()),
            Some(color) => {
                user.color = color;
                users.update(user).await?;
                CommandResponse::thumbs_up()
            }
        })
    }
}
