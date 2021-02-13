use crate::command::argument_parser::from_string_argument_parser::ColorArgumentParser;
use crate::command::argument_parser::rest_argument_parser::RestArgumentParser;

use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::CommandResponse;
use crate::command::{Command, CommandContext};
use async_trait::async_trait;
use eyre::*;
use model::color::Color;
use model::user::UserNoId;

#[derive(Debug)]
pub struct AddUser;

#[async_trait]
impl<Ctx> Command<Ctx> for AddUser
where
    Ctx: CommandContext + 'static,
{
    fn name(&self) -> &'static str {
        "add-user"
    }

    fn help(&self) -> &'static str {
        "//TODO"
    }

    fn argument_help(&self) -> &'static str {
        "//TODO"
    }

    async fn run(&self, ctx: &Ctx) -> Result<CommandResponse> {
        let mut text = ctx.text().to_string();
        let (color, name) = AddUserArgumentParser::new().parse(&mut text)?;
        let color = color.unwrap_or_default();
        let discord_id = ctx.discord_id();
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

impl Default for AddUser {
    fn default() -> Self {
        Self::new()
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
