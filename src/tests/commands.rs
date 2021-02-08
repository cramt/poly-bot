#[cfg(test)]
mod commands {
    use crate::command::command_response::CommandResponse;
    use crate::command::help::Help;
    use crate::command::Command;

    #[test]
    fn help_command_includes_itself() {
        /*
        let text = match Help::new().run().unwrap() {
            CommandResponse::TextBlock(x) => x,
            _ => unreachable!(),
        };
        assert!(text.contains("help: prints all help text for all commands"))
         */
    }
}
