use crate::command::{all_commands, Command, CommandContext, CommandResponse};
use async_trait::async_trait;
use eyre::*;

#[derive(Debug)]
pub struct Help;

#[async_trait]
impl Command for Help {
    fn name(&self) -> &'static str {
        "help"
    }

    fn help(&self) -> &'static str {
        "prints all help text for all commands"
    }

    fn argument_help(&self) -> &'static str {
        "\"help\" takes no arguments"
    }

    async fn run(&self, _: CommandContext) -> Result<CommandResponse> {
        Ok(CommandResponse::TextBlock(
            all_commands()
                .into_iter()
                .map(|(name, value)| (name, value.help()))
                .map(|(name, help)| format!("{}: {}", name, help))
                .collect::<Vec<String>>()
                .join("\r\n"),
        ))
    }
}

impl Help {
    pub fn new() -> Self {
        Self
    }
}
