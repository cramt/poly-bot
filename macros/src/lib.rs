use inflector::cases::snakecase::to_snake_case;
use proc_macro::TokenStream;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{parse_macro_input, LitStr};

#[proc_macro]
pub fn make_css_color_names_map(_: TokenStream) -> TokenStream {
    fn parse_hex(s: &str) -> u8 {
        u8::from_str_radix(s, 16).unwrap()
    }

    let re = Regex::new(r"#([0-f][0-f])([0-f][0-f])([0-f][0-f])").expect("regex failed to parse");
    let color_str = include_str!("../../res/css-color-names.json");
    let hashmap =
        serde_json::from_str::<HashMap<&str, &str>>(color_str).expect("json failed to parse");
    let mut map = phf_codegen::Map::new();
    for (key, val) in hashmap.into_iter() {
        let caps = re.captures(val).expect("regex captures failed");
        let r = caps.get(1).expect("regex captures failed");
        let g = caps.get(2).expect("regex captures failed");
        let b = caps.get(3).expect("regex captures failed");
        let r = parse_hex(r.as_str());
        let g = parse_hex(g.as_str());
        let b = parse_hex(b.as_str());
        map.entry(
            key,
            format!("crate::model::color::Color::new({},{},{})", r, g, b).as_str(),
        );
    }
    let rust_code = format!(
        "static CSS_COLOR_NAMES_MAP: phf::Map<&'static str, crate::model::color::Color> = {};\n",
        map.build()
    );
    rust_code.parse().expect("couldnt parse rust code")
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct EmojiEntry {
    pub codes: String,
    pub char: String,
    pub name: String,
    pub category: String,
    pub group: String,
    pub subgroup: String,
}

#[proc_macro]
pub fn make_emoji_implementation(item: TokenStream) -> TokenStream {
    fn correct_name<S: AsRef<str>>(s: S) -> String {
        let mut s = to_snake_case(s.as_ref());
        if s.chars().nth(0).unwrap().to_string().parse::<u8>().is_ok() {
            s.insert(0, '_')
        }
        deunicode::deunicode(s.as_str())
    }
    let emoji_json_str = include_str!("../../res/emoji-names-list.json");
    let emojis = serde_json::from_str::<Vec<EmojiEntry>>(emoji_json_str).unwrap();
    let mut emoji_map = HashMap::new();
    for emoji in emojis {
        let name = correct_name(&emoji.name);
        let name = if emoji_map.contains_key(&name) {
            let mut i = 0usize;
            while emoji_map.contains_key(&format!("{}{}", name, i)) {
                i += 1;
            }
            format!("{}{}", name, i)
        } else {
            name.to_string()
        };
        emoji_map.insert(name, emoji.char);
    }
    let item = item.to_string();
    let mut v = item.split(",").map(|x| x.trim()).collect::<Vec<&str>>();
    let func = v.pop().unwrap();
    let tt = v.pop().unwrap();
    let a = emoji_map
        .into_iter()
        .map(|(name, char)| {
            format!(
                r#"pub fn {}() -> {} {{
                    {}("{}")
                }}
                "#,
                name, tt, func, char
            )
        })
        .collect::<String>();
    //panic!(a);
    a.parse().unwrap()
}

#[proc_macro]
pub fn include_base64(item: TokenStream) -> TokenStream {
    let buffer = std::fs::read(parse_macro_input!(item as LitStr).value()).unwrap();

    format!("\"{}\"", base64::encode(buffer)).parse().unwrap()
}
