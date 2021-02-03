#[cfg(test)]
mod commands {
    use crate::command::help::Help;
    use crate::command::{Command, CommandOutput};

    #[test]
    fn help_command_includes_itself() {
        let text = match Help::new().run().unwrap() {
            CommandOutput::TextBlock(x) => x,
            _ => unreachable!()
        };
        assert!(text.contains("help: prints all help text for all commands"))
    }
}
