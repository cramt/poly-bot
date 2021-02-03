use crate::command::string_argument_parser::StringArgumentParser;
use crate::command::ArgumentParser;
use eyre::*;
use once_cell::sync::Lazy;
use regex::{Regex};

static DISCORD_TAG_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"<@!?([0-9]+)>").unwrap());

pub struct DiscordTagArgumentParser;

impl ArgumentParser for DiscordTagArgumentParser {
    type Output = u64;

    fn parse(&self, input: &mut String) -> Result<Self::Output, Report> {
        DISCORD_TAG_REGEX
            .captures(StringArgumentParser::new().parse(input)?.as_str())
            .ok_or(eyre!("couldnt parse discord tag"))?
            .get(1)
            .ok_or(eyre!("couldnt parse discord tag"))?
            .as_str()
            .parse()
            .map_err(|x| Report::new(x))
    }

    fn new() -> Self {
        Self
    }
}
