pub mod from_string_argument_parser;
pub mod rest_argument_parser;
pub mod string_argument_parser;

use eyre::{Report, Result};
use serde::de::StdError;
use std::marker::PhantomData;
use std::str::FromStr;

pub trait Command<T: ArgumentParser> {
    fn help() -> String;
    fn argument_help() -> String;
    fn arguments() -> T;
}

pub trait ArgumentParser: Sized {
    type Output;
    fn parse(&self, input: &mut String) -> Result<Self::Output>;

    fn new() -> Self;
}
