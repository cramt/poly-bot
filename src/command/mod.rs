pub mod string_argument_parser;
pub mod from_string_argument_parser;
pub mod rest_argument_parser;

use eyre::{Result, Report};
use std::str::FromStr;
use std::marker::PhantomData;
use serde::de::StdError;

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
