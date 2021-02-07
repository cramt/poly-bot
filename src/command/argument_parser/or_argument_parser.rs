use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
use crate::command::argument_parser::{ArgumentParser, SingleWordArgumentParser};
use eyre::*;
use std::marker::PhantomData;

pub struct OrArgumentParser<A: SingleWordArgumentParser, B: SingleWordArgumentParser> {
    a: PhantomData<A>,
    b: PhantomData<B>,
}

#[derive(Clone, Debug)]
pub enum Or<A, B> {
    A(A),
    B(B),
}

impl<A, B> Or<A, B> {
    pub fn a(self) -> Option<A> {
        match self {
            Self::A(a) => Some(a),
            Self::B(_) => None,
        }
    }

    pub fn b(self) -> Option<B> {
        match self {
            Self::A(_) => None,
            Self::B(b) => Some(b),
        }
    }

    pub fn as_ref(&self) -> Self<&A, &B> {
        match self {
            Self::A(a) => Self::A(a),
            Self::B(b) => Self::B(b),
        }
    }
}

impl<A, B> ArgumentParser for OrArgumentParser<A, B>
where
    A: SingleWordArgumentParser,
    B: SingleWordArgumentParser,
{
    type Output = Or<A::Output, B::Output>;

    fn parse(&self, input: &mut String) -> Result<Self::Output> {
        let word = StringArgumentParser::new().parse(input)?;
        let a = A::new().parse_word(word.clone());
        let b = B::new().parse_word(word);
        if let Ok(a) = a {
            Ok(Self::Output::A(a))
        } else if let Ok(b) = b {
            Ok(Self::Output::B(b))
        } else {
            Err(a.err().unwrap())
        }
    }

    fn new() -> Self {
        Self {
            a: PhantomData::default(),
            b: PhantomData::default(),
        }
    }
}

impl<A, B> SingleWordArgumentParser for OrArgumentParser<A, B>
where
    A: SingleWordArgumentParser,
    B: SingleWordArgumentParser,
{
}
