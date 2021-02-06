pub mod command;
pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod polymap_generator;
pub mod tests;
pub mod utilities;

use std::fs::File;
use std::io::Write;

use crate::model::color::Color;
use crate::model::relationship::Relationship;
use crate::model::relationship_type::RelationshipType;
use crate::model::user::User;
use crate::polymap_generator::dot_definitions::{dot_generate, invoke_graphviz};
use crate::polymap_generator::svg_renderer::render_svg;

use tokio_postgres::Error;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let _svg = r#"<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <style>
    .small { font: italic 13px sans-serif; }
    .heavy { font: bold 30px sans-serif; }

    /* Note that the color of the text is set with the    *
     * fill property, the color property is for HTML only */
    .Rrrrr { font: italic 40px serif; fill: red; }
  </style>

  <text x="20" y="35" class="small">My</text>
  <text x="40" y="35" class="heavy">cat</text>
  <text x="55" y="55" class="small">is</text>
  <text x="65" y="55" class="Rrrrr">Grumpy!</text>
</svg>
    "#;
    let usera = User::new(0, "aa 😀", Color::default(), vec![], None);
    let userb = User::new(1, "bb", Color::default(), vec![], None);
    let relationship = Relationship::new(3, RelationshipType::Sexual, usera.clone(), userb.clone());
    let dot_str = dot_generate(&[&usera, &userb, &relationship]);
    File::create("aa.dot")
        .unwrap()
        .write(dot_str.as_bytes())
        .unwrap();
    let svg_str = invoke_graphviz(dot_str).unwrap();
    File::create("bb.svg")
        .unwrap()
        .write(svg_str.as_bytes())
        .unwrap();
    let png = render_svg(svg_str).await.unwrap();
    File::create("cc.png")
        .unwrap()
        .write(png.as_slice())
        .unwrap();
    Ok(())
}
