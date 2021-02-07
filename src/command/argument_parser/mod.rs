pub mod discord_tag_argument_parser;
pub mod empty_argument_parser;
pub mod from_string_argument_parser;
pub mod or_argument_parser;
pub mod rest_argument_parser;
pub mod string_argument_parser;

use eyre::*;

pub trait ArgumentParser: Sized {
    type Output;
    fn parse(&self, input: &mut String) -> Result<Self::Output>;

    fn new() -> Self;
}

pub trait SingleWordArgumentParser: ArgumentParser {
    fn parse_word(&self, mut input: String) -> Result<Self::Output> {
        self.parse(&mut input)
    }
}
