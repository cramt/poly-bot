use crate::command::argument_parser::ArgumentParser;
use eyre::*;

pub struct EmptyArgumentParser;

impl ArgumentParser for EmptyArgumentParser {
    type Output = ();

    fn parse(&self, _input: &mut String) -> Result<Self::Output, Report> {
        Ok(())
    }

    fn new() -> Self {
        Self
    }
}
