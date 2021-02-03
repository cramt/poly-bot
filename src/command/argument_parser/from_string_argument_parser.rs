use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::ArgumentParser;
use crate::model::gender::Gender;
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
        StringArgumentParser::new()
            .parse(input)?
            .parse()
            .map_err(|x| Report::new(x))
    }

    fn new() -> Self {
        Self {
            a: PhantomData::default(),
        }
    }
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

create_number_argument_parser!(GenderArgumentParser, Gender);
create_number_argument_parser!(RelationshipTypeArgumentParser, RelationshipType);
