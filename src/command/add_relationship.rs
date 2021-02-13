use crate::command::argument_parser::from_string_argument_parser::RelationshipTypeArgumentParser;
use crate::command::argument_parser::rest_argument_parser::RestArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::command::command_response::CommandResponse;
use crate::command::error::no_user_by_discord_id;
use crate::command::{Command, CommandContext};
use crate::dao::users::Users;
use async_trait::async_trait;
use eyre::*;
use model::relationship::RelationshipNoId;
use model::user::User;
use std::ops::Deref;

#[derive(Debug)]
pub struct AddRelationship;

impl AddRelationship {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AddRelationship {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl<Ctx> Command<Ctx> for AddRelationship
where
    Ctx: CommandContext + 'static,
{
    fn name(&self) -> &'static str {
        "add-relationship"
    }

    fn help(&self) -> &'static str {
        unimplemented!()
    }

    fn argument_help(&self) -> &'static str {
        unimplemented!()
    }

    async fn run(&self, ctx: &Ctx) -> Result<CommandResponse> {
        let users = crate::dao::users::default();
        let relationships = crate::dao::relationships::default();
        let discord_user_id = ctx.discord_id();
        let mut text = ctx.text().to_string();
        let relationship_type = RelationshipTypeArgumentParser::new()
            .parse(&mut text)
            .map_err(|_| eyre!("couldnt understand the first word as a relationship type"))?;

        let rest = RestArgumentParser::new().parse(&mut text)?;

        async fn find_target_user<Ctx2: CommandContext>(
            ctx: &Ctx2,
            users: &(dyn Users + Sync + Send),
            rest: String,
        ) -> Result<Vec<User>> {
            let other_users = ctx.guild_member_ids().await;
            users
                .get_by_username_and_discord_ids(rest, other_users)
                .await
        }

        async fn find_own_user(
            discord_user_id: u64,
            users: &(dyn Users + Sync + Send),
        ) -> Result<Result<User>> {
            users
                .get_by_discord_id(discord_user_id)
                .await
                .map(|x| x.ok_or_else(no_user_by_discord_id))
        }

        let (target_user, own_user) = futures::future::join(
            find_target_user(ctx, users.deref(), rest),
            find_own_user(discord_user_id, users.deref()),
        )
        .await;
        let mut target_user = target_user?;
        let own_user = own_user??;

        match target_user.len() {
            0 => Err(eyre!("couldnt find the user you were refering to")),
            1 => {
                let _ = relationships
                    .add(RelationshipNoId::new(
                        relationship_type,
                        target_user.pop().unwrap(),
                        own_user,
                    ))
                    .await?;
                Ok(CommandResponse::thumbs_up())
            }
            _ => {
                unimplemented!()
            }
        }
    }
}
