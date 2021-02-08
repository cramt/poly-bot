use crate::command::argument_parser::from_string_argument_parser::ColorArgumentParser;
use crate::command::argument_parser::rest_argument_parser::RestArgumentParser;
use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::CommandResponse;
use crate::command::{Command, CommandContext};
use crate::model::color::Color;
use crate::model::user::UserNoId;
use async_trait::async_trait;
use eyre::*;
use serenity::model::channel::{Message, ReactionType};

#[derive(Debug)]
pub struct AddUser;

#[async_trait]
impl Command for AddUser {
    fn name(&self) -> &'static str {
        "add-user"
    }

    fn help(&self) -> &'static str {
        "//TODO"
    }

    fn argument_help(&self) -> &'static str {
        "//TODO"
    }

    async fn run(&self, mut ctx: CommandContext) -> Result<CommandResponse> {
        let (color, name) = AddUserArgumentParser::new().parse(&mut ctx.text)?;
        let color = color.unwrap_or(Color::default());
        let discord_id = ctx.discord_user_id;
        let _ = crate::dao::users::default()
            .add(UserNoId::new(name, color, None, vec![], Some(discord_id)))
            .await?;
        Ok(CommandResponse::thumbs_up())
    }
}

impl AddUser {
    pub fn new() -> Self {
        Self
    }
}

#[derive(Debug)]
pub struct AddUserArgumentParser;

impl ArgumentParser for AddUserArgumentParser {
    type Output = (Option<Color>, String);

    fn parse(&self, input: &mut String) -> Result<Self::Output, Report> {
        let color = ColorArgumentParser::new().parse(input).ok();
        let name = RestArgumentParser::new().parse(input)?;
        Ok((color, name))
    }

    fn new() -> Self {
        Self
    }
}
