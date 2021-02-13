use include_dir::{include_dir, Dir};
use once_cell::sync::Lazy;
use regex::Regex;

const MIGRATION_DIR: Dir = include_dir!("./migrations");

pub static MIGRATION_FILES: Lazy<Vec<(usize, String)>> = Lazy::new(|| {
    let regex = Regex::new(r"([0-9]+).sql").unwrap();
    MIGRATION_DIR
        .files()
        .iter()
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
