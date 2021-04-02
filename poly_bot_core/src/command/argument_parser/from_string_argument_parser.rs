use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::{ArgumentParser, SingleWordArgumentParser};
use crate::model::color::Color;
use crate::model::relationship_type::RelationshipType;
use eyre::Report;
use eyre::Result;
use serde::ser::StdError;
use std::marker::PhantomData;
use std::str::FromStr;

pub struct FromStringArgumentParser<T: FromStr> {
    a: PhantomData<T>,
}

impl<T> ArgumentParser for FromStringArgumentParser<T>
where
    T: FromStr,
    <T as FromStr>::Err: StdError + Send + Sync + 'static,
{
    type Output = T;

    fn parse(&self, input: &mut String) -> Result<Self::Output> {
        let str_parser = StringArgumentParser::new();
        let word = str_parser.parse(input)?;
        match T::from_str(word.as_str()) {
            Ok(x) => Ok(x),
            Err(err) => {
                str_parser.undo(input, word);
                Err(Report::new(err))
            }
        }
    }

    fn new() -> Self {
        Self {
            a: PhantomData::default(),
        }
    }
}

impl<T> SingleWordArgumentParser for FromStringArgumentParser<T>
where
    T: FromStr,
    <T as FromStr>::Err: StdError + Send + Sync + 'static,
{
}

macro_rules! create_number_argument_parser {
    ($name:ident, $t:ty) => {
        pub struct $name;

        impl ArgumentParser for $name {
            type Output = $t;

            fn parse(&self, input: &mut String) -> Result<Self::Output, Report> {
                FromStringArgumentParser::new().parse(input)
            }

            fn new() -> Self {
                Self
            }
        }

        impl SingleWordArgumentParser for $name {}
    };
}

create_number_argument_parser!(U8ArgumentParser, u8);
create_number_argument_parser!(U16ArgumentParser, u16);
create_number_argument_parser!(U32ArgumentParser, u32);
create_number_argument_parser!(U64ArgumentParser, u64);
create_number_argument_parser!(U128ArgumentParser, u128);

create_number_argument_parser!(I8ArgumentParser, i8);
create_number_argument_parser!(I16ArgumentParser, i16);
create_number_argument_parser!(I32ArgumentParser, i32);
create_number_argument_parser!(I64ArgumentParser, i64);
create_number_argument_parser!(I128ArgumentParser, i128);

create_number_argument_parser!(ColorArgumentParser, Color);
create_number_argument_parser!(RelationshipTypeArgumentParser, RelationshipType);
