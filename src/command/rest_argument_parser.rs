use crate::command::ArgumentParser;
use eyre::Result;

pub struct RestArgumentParser;

impl ArgumentParser for RestArgumentParser {
    type Output = String;

    fn parse(&self, input: &mut String) -> Result<Self::Output> {
        let out = input.to_string();
        *input = String::new();
        Ok(out)
    }

    fn new() -> Self {
        Self
    }
}
