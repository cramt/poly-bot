use proc_macro::TokenStream;
use std::collections::HashMap;
use std::io::BufWriter;
use regex::Regex;

#[proc_macro]
pub fn make_css_color_names_map(_: TokenStream) -> TokenStream {
    fn parse_hex(s: &str) -> u8 {
        u8::from_str_radix(s, 16).unwrap()
    }

    let re = Regex::new(r"#([0-f][0-f])([0-f][0-f])([0-f][0-f])").expect("regex failed to parse");
    let color_str = include_str!("../../css-color-names.json");
    let mut hashmap = serde_json::from_str::<HashMap<&str, &str>>(color_str).expect("json failed to parse");
    let mut map = phf_codegen::Map::new();
    for (key, val) in hashmap.into_iter() {
        let caps = re.captures(val).expect("regex captures failed");
        let r = caps.get(1).expect("regex captures failed");
        let g = caps.get(2).expect("regex captures failed");
        let b = caps.get(3).expect("regex captures failed");
        let r = parse_hex(r.as_str());
        let g = parse_hex(g.as_str());
        let b = parse_hex(b.as_str());
        map.entry(key, format!("crate::model::color::Color::new({},{},{})", r, g, b).as_str());
    }
    let rust_code = format!("static CSS_COLOR_NAMES_MAP: phf::Map<&'static str, crate::model::color::Color> = {};\n", map.build());
    rust_code.parse().expect("couldnt parse rust code")
}
