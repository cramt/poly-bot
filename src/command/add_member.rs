use crate::command::add_user::AddUserArgumentParser;
use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::CommandResponse;
use crate::command::error::no_user_by_discord_id;
use crate::command::{Command, CommandContext};
use crate::model::color::Color;
use crate::model::user::UserNoId;
use async_trait::async_trait;
use eyre::*;

#[derive(Debug)]
pub struct AddMember;

impl AddMember {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl<Ctx> Command<Ctx> for AddMember
where
    Ctx: CommandContext + 'static,
{
    fn name(&self) -> &'static str {
        "add-member"
    }

    fn help(&self) -> &'static str {
        unimplemented!()
    }

    fn argument_help(&self) -> &'static str {
        unimplemented!()
    }

    async fn run(&self, ctx: &Ctx) -> Result<CommandResponse> {
        let users = crate::dao::users::default();
        let discord_user_id = ctx.discord_id();
        let mut text = ctx.text().to_string();
        let str_parser = StringArgumentParser::new();
        let possible_member_name = str_parser.parse(&mut text)?;

        let top_user = users
            .get_by_discord_id(discord_user_id)
            .await?
            .ok_or(no_user_by_discord_id())?;

        let top_user = match users
            .get_member_by_name(top_user.id, possible_member_name.clone())
            .await?
        {
            None => {
                str_parser.undo(&mut text, possible_member_name);
                top_user
            }
            Some(x) => x,
        };

        let (color, name) = AddUserArgumentParser::new().parse(&mut text)?;
        let color = color.unwrap_or(Color::default());
        let _ = users
            .add(UserNoId::new(
                name,
                color,
                Some(Box::new(top_user)),
                vec![],
                None,
            ))
            .await?;
        Ok(CommandResponse::thumbs_up())
    }
}
