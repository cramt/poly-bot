use std::fmt::Formatter;
use std::str::FromStr;

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum RelationshipType {
    Romantic,
    Sexual,
    Friend,
    Queerplatonic,
    CuddleBuddy,
}

impl ToString for RelationshipType {
    fn to_string(&self) -> String {
        match self {
            RelationshipType::Romantic => "Romantic",
            RelationshipType::Sexual => "Sexual",
            RelationshipType::Friend => "Friend",
            RelationshipType::Queerplatonic => "Queerplatonic",
            RelationshipType::CuddleBuddy => "Cuddle Buddy",
        }
        .to_string()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParseRelationshipTypeError {
    incorrect_relationship_type: String,
}

impl ParseRelationshipTypeError {
    pub fn new<S: AsRef<str>>(s: S) -> Self {
        Self {
            incorrect_relationship_type: s.as_ref().to_string(),
        }
    }
}

impl std::fmt::Display for ParseRelationshipTypeError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(
            format!(
                "{} isnt a relationship type",
                self.incorrect_relationship_type
            )
            .as_str(),
        )
    }
}

impl std::error::Error for ParseRelationshipTypeError {}

impl FromStr for RelationshipType {
    type Err = ParseRelationshipTypeError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "romantic" => Ok(Self::Romantic),
            "sexual" => Ok(Self::Sexual),
            "friend" => Ok(Self::Friend),
            "queerplatonic" => Ok(Self::Queerplatonic),
            "cuddlebuddy" => Ok(Self::CuddleBuddy),
            _x => Err(ParseRelationshipTypeError::new(_x)),
        }
    }
}

impl RelationshipType {
    pub fn parse(u: u8) -> Option<Self> {
        match u {
            0 => Some(Self::Romantic),
            1 => Some(Self::Sexual),
            2 => Some(Self::Friend),
            3 => Some(Self::Queerplatonic),
            4 => Some(Self::CuddleBuddy),
            _ => None,
        }
    }

    pub fn to_number(&self) -> i16 {
        match self {
            RelationshipType::Romantic => 0,
            RelationshipType::Sexual => 1,
            RelationshipType::Friend => 2,
            RelationshipType::Queerplatonic => 3,
            RelationshipType::CuddleBuddy => 4,
        }
    }

    pub fn to_colour(&self) -> &'static str {
        match self {
            RelationshipType::Romantic => "#ff0000",
            RelationshipType::Sexual => "#8E7CC3",
            RelationshipType::Friend => "#6AA84F",
            RelationshipType::Queerplatonic => "#2A2A2A",
            RelationshipType::CuddleBuddy => "#F6B26B",
        }
    }
}

impl Into<u8> for RelationshipType {
    fn into(self) -> u8 {
        self.to_number() as u8
    }
}

impl Into<u16> for RelationshipType {
    fn into(self) -> u16 {
        self.to_number() as u16
    }
}

impl Into<u32> for RelationshipType {
    fn into(self) -> u32 {
        self.to_number() as u32
    }
}

impl Into<u64> for RelationshipType {
    fn into(self) -> u64 {
        self.to_number() as u64
    }
}

impl Into<usize> for RelationshipType {
    fn into(self) -> usize {
        self.to_number() as usize
    }
}
