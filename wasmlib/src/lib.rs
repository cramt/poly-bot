extern crate wasm_bindgen;
extern crate regex;
extern crate console_error_panic_hook;

use std::panic;
use wasm_bindgen::prelude::*;
use regex::Regex;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// this function changes a value by reference (borrowing and change)
#[wasm_bindgen]
pub fn alter(a: &mut [u8]) {
    a[1] = 12;
}

#[wasm_bindgen]
pub fn hello(a: &str) -> String {
    return "hello".to_owned() + a;
}

#[wasm_bindgen]
pub fn take_string_by_value(x: String) {}

#[wasm_bindgen]
pub fn return_string() -> String {
    "hello".into()
}

#[wasm_bindgen]
pub fn take_option_string(x: Option<String>) {}

#[wasm_bindgen]
pub fn return_option_string() -> Option<String> {
    None
}


#[wasm_bindgen]
pub fn fix_svg_emoji(s: &str) -> String {
    lazy_static! {
        static ref r = Regex::new(r"(?m)(?P<left><text[^>]*>[^&lt;]*)&lt;(?P<animated>a?):[^:]+:(?P<id>\d*)&gt;(?P<right></text>)").unwrap();
    }
    r.replace_all(s, "$left <image href=\"https://cdn.discordapp.com/emojis/$id\" height=\"20\" width=\"20\"/> $right").parse().unwrap()
}