use macros::make_css_color_names_map;
use once_cell::sync::Lazy;
use regex::{Captures, Regex};
use std::borrow::Cow;
use std::fmt::{Display, Formatter};

use std::str::FromStr;

make_css_color_names_map!();

fn to_hex(u: u8) -> String {
    format!("{:x}", u)
}

fn from_hex<S: AsRef<str>>(s: S) -> Option<u8> {
    let r = usize::from_str_radix(s.as_ref(), 16).ok()?;
    if r > u8::MAX as usize {
        None
    } else {
        Some(r as u8)
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Color {
    pub const fn new(r: u8, g: u8, b: u8) -> Color {
        Self { r, g, b }
    }
}

impl ToString for Color {
    fn to_string(&self) -> String {
        format!("#{}{}{}", to_hex(self.r), to_hex(self.g), to_hex(self.b))
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum ParseColorError {
    ParseR,
    ParseG,
    ParseB,
    UnsupportedFormat,
}

impl Display for ParseColorError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(format!("{:?}", self).as_str())
    }
}

impl ParseColorError {
    pub fn is_unsupported(&self) -> bool {
        self.clone() == Self::UnsupportedFormat
    }
}

impl std::error::Error for ParseColorError {}

static HEX_COLOR_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"#?([0-f][0-f])([0-f][0-f])([0-f][0-f])").unwrap());

static RGB_COLOR_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"rgb\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\s*\)").unwrap());

impl FromStr for Color {
    type Err = ParseColorError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        fn caps_parse(c: Captures) -> Result<(&str, &str, &str), ParseColorError> {
            let r = c.get(1).ok_or(ParseColorError::ParseR)?.as_str();
            let g = c.get(2).ok_or(ParseColorError::ParseG)?.as_str();
            let b = c.get(3).ok_or(ParseColorError::ParseB)?.as_str();
            Ok((r, g, b))
        }
        let fetched_color_by_name: Option<&Color> = CSS_COLOR_NAMES_MAP.get(s);
        let s = s.to_lowercase();
        let fetched_color_by_name = fetched_color_by_name.ok_or(Self::Err::UnsupportedFormat);
        let fetched_color_by_hex = match HEX_COLOR_REGEX.captures(s.as_str()) {
            None => Err(Self::Err::UnsupportedFormat),
            Some(caps) => match caps_parse(caps) {
                Ok((r, g, b)) => match from_hex(r) {
                    None => Err(Self::Err::ParseR),
                    Some(r) => match from_hex(g) {
                        None => Err(Self::Err::ParseG),
                        Some(g) => match from_hex(b) {
                            None => Err(Self::Err::ParseB),
                            Some(b) => Ok(Color::new(r, g, b)),
                        },
                    },
                },
                Err(e) => Err(e),
            },
        };
        let fetched_color_by_rgb = match RGB_COLOR_REGEX.captures(s.as_str()) {
            None => Err(Self::Err::UnsupportedFormat),
            Some(caps) => match caps_parse(caps) {
                Ok((r, g, b)) => match r.parse::<usize>() {
                    Ok(r) => {
                        if r > u8::MAX as usize {
                            Err(Self::Err::ParseR)
                        } else {
                            let r = r as u8;
                            match g.parse::<usize>() {
                                Ok(g) => {
                                    if g > u8::MAX as usize {
                                        Err(Self::Err::ParseG)
                                    } else {
                                        let g = g as u8;
                                        match b.parse::<usize>() {
                                            Ok(b) => {
                                                if b > u8::MAX as usize {
                                                    Err(Self::Err::ParseB)
                                                } else {
                                                    let b = b as u8;
                                                    Ok(Color::new(r, g, b))
                                                }
                                            }
                                            Err(_) => Err(Self::Err::ParseB),
                                        }
                                    }
                                }
                                Err(_) => Err(Self::Err::ParseG),
                            }
                        }
                    }
                    Err(_) => Err(Self::Err::ParseR),
                },
                Err(e) => Err(e),
            },
        };
        let options = vec![
            fetched_color_by_hex.map(|x| Cow::Owned(x)),
            fetched_color_by_rgb.map(|x| Cow::Owned(x)),
            fetched_color_by_name.map(|x| Cow::Borrowed(x)),
        ];
        if let Some(x) = options.iter().find(|x| x.is_ok()) {
            Ok(x.as_ref().unwrap().clone().into_owned())
        } else {
            if let Some(err) = options.iter().find(|x| match x {
                Ok(_) => false,
                Err(e) => e.is_unsupported(),
            }) {
                Err(err.as_ref().err().unwrap().clone())
            } else {
                Err(Self::Err::UnsupportedFormat)
            }
        }
    }
}

impl Default for Color {
    fn default() -> Self {
        Self::new(255, 255, 255)
    }
}

impl From<(u8, u8, u8)> for Color {
    fn from((r, g, b): (u8, u8, u8)) -> Self {
        Self::new(r, g, b)
    }
}

impl From<[u8; 3]> for Color {
    fn from(x: [u8; 3]) -> Self {
        Self::new(x[0], x[1], x[2])
    }
}

impl Into<[u8; 3]> for Color {
    fn into(self) -> [u8; 3] {
        let Self { r, g, b } = self;
        [r, g, b]
    }
}

impl From<Box<[u8]>> for Color {
    fn from(x: Box<[u8]>) -> Self {
        Self::new(x[0], x[1], x[2])
    }
}

impl Into<Box<[u8]>> for Color {
    fn into(self) -> Box<[u8]> {
        let Self { r, g, b } = self;
        [r, g, b].to_vec().into_boxed_slice()
    }
}
