use include_dir::{include_dir, Dir};
use once_cell::sync::Lazy;
use regex::{Captures, Regex};
use std::num::ParseIntError;
use std::ops::Deref;
use std::path::Path;
use std::string::FromUtf8Error;

const MIGRATION_DIR: Dir = include_dir!("./migrations");

pub const MIGRATION_FILES: Lazy<Vec<(usize, String)>> = Lazy::new(|| {
    let regex = Regex::new(r"([0-9]+).sql").unwrap();
    MIGRATION_DIR
        .files()
        .into_iter()
        .map(|x| {
            let captures = match regex.captures(x.path().to_str().unwrap()) {
                None => return None,
                Some(x) => x,
            };
            let capture = match captures.get(1) {
                None => return None,
                Some(x) => x,
            };
            let i = match capture.as_str().parse::<usize>() {
                Ok(x) => x,
                Err(_) => return None,
            };
            let content = match String::from_utf8(x.contents().to_vec()) {
                Ok(x) => x,
                Err(_) => return None,
            };
            Some((i, content))
        })
        .filter(|x| x.is_some())
        .map(|x| x.unwrap())
        .collect::<Vec<(usize, String)>>()
});
