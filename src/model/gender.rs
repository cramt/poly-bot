use eyre::Report;
use eyre::*;
use serenity::static_assertions::_core::fmt::Formatter;
use serenity::static_assertions::_core::num::ParseIntError;
use std::fmt::Display;
use std::str::FromStr;

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Gender {
    Femme,
    Masc,
    Neutral,
    System,
}

impl ToString for Gender {
    fn to_string(&self) -> String {
        match self {
            Self::Femme => "Femme",
            Self::Masc => "Masc",
            Self::Neutral => "Neutral",
            Self::System => "System",
        }
        .to_string()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParseGenderError {
    incorrect_gender: String,
}

impl ParseGenderError {
    pub fn new<S: AsRef<str>>(s: S) -> Self {
        Self {
            incorrect_gender: s.as_ref().to_string(),
        }
    }
}

impl Display for ParseGenderError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(format!("{} isnt a gender", self.incorrect_gender).as_str())
    }
}

impl std::error::Error for ParseGenderError {}

impl FromStr for Gender {
    type Err = ParseGenderError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "femme" => Ok(Self::Femme),
            "masc" => Ok(Self::Masc),
            "neutral" => Ok(Self::Neutral),
            "system" => Ok(Self::System),
            _x => Err(ParseGenderError::new(_x)),
        }
    }
}

impl Gender {
    pub fn parse(u: u8) -> Option<Gender> {
        match u {
            0 => Some(Self::Femme),
            1 => Some(Self::Masc),
            2 => Some(Self::Neutral),
            3 => Some(Self::System),
            _ => None,
        }
    }

    pub fn to_number(&self) -> i16 {
        match self {
            Self::Femme => 0,
            Self::Masc => 1,
            Self::Neutral => 2,
            Self::System => 3,
        }
    }

    pub fn to_colour(&self) -> &'static str {
        match self {
            Self::Femme => "#F7A8B8",
            Self::Masc => "#55CDFC",
            Self::Neutral => "#FFFFFF",
            Self::System => "#FFE599",
        }
    }
}

impl Into<u8> for Gender {
    fn into(self) -> u8 {
        self.to_number() as u8
    }
}

impl Into<u16> for Gender {
    fn into(self) -> u16 {
        self.to_number() as u16
    }
}

impl Into<u32> for Gender {
    fn into(self) -> u32 {
        self.to_number() as u32
    }
}

impl Into<u64> for Gender {
    fn into(self) -> u64 {
        self.to_number() as u64
    }
}

impl Into<usize> for Gender {
    fn into(self) -> usize {
        self.to_number() as usize
    }
}
