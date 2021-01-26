#[derive(Copy, Clone, Debug)]
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
