use poly_bot_core::polymap_generator::{PolymapGenerator, BoxPolymapGenerator};
use poly_bot_core::model::user::User;
use poly_bot_core::model::relationship::Relationship;
use crate::dot_definitions::DotGenerate;
use async_trait::async_trait;
use crate::svg_renderer::render_svg;
use std::ops::Deref;

pub mod dot_definitions;
pub mod svg_renderer;

pub struct DotChromiumPolymapGenerator;

#[async_trait]
impl PolymapGenerator for DotChromiumPolymapGenerator {
    async fn generate(&self, relationships: &[&Relationship], users: &[&User]) -> Option<Vec<u8>> {
        let mut items: Vec<&(dyn DotGenerate + Sync)> = Vec::with_capacity(relationships.len() + users.len());
        for relationship in relationships {
            items.push(*relationship);
        }
        for user in users {
            items.push(*user);
        }
        let svg = items.as_slice().generate();
        render_svg(svg.deref()).await
    }
}

impl DotChromiumPolymapGenerator {
    pub fn new() -> BoxPolymapGenerator {
        Box::new(Self)
    }
}
