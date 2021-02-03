use crate::command::ArgumentParser;
use eyre::*;

pub struct EmptyArgumentParser;

impl ArgumentParser for EmptyArgumentParser {
    type Output = ();

    fn parse(&self, input: &mut String) -> Result<Self::Output, Report> {
        Ok(())
    }

    fn new() -> Self {
        Self
    }
}
