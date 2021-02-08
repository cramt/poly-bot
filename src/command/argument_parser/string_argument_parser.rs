use crate::command::argument_parser::ArgumentParser;

use eyre::Result;

pub struct StringArgumentParser;

impl ArgumentParser for StringArgumentParser {
    type Output = String;

    fn parse(&self, input: &mut String) -> Result<Self::Output> {
        let mut out = String::new();
        loop {
            if input.len() == 0 {
                break;
            }
            match input.remove(0) {
                ' ' => break,
                _c => out.push(_c),
            }
        }
        Ok(out)
    }

    fn new() -> Self {
        Self
    }
}

impl StringArgumentParser {
    pub fn undo(&self, input: &mut String, mut reverting: String) {
        input.insert(0, ' ');
        while let Some(c) = reverting.pop() {
            input.insert(0, c);
        }
    }
}
