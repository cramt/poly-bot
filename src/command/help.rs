use crate::command::{all_commands, Command, CommandOutput};
use eyre::*;

#[derive(Debug)]
pub struct Help;

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

    fn run(&self) -> Result<CommandOutput> {
        Ok(CommandOutput::TextBlock(
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
