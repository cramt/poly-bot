#[derive(Copy, Clone, Debug)]
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

    pub fn to_number(&self) -> u8 {
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
        self.to_number()
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
