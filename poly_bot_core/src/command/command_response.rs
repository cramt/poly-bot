use macros::*;

#[derive(Debug, Clone)]
pub enum CommandResponse {
    Text(String),
    TextBlock(String),
    Reaction(String),
}

impl CommandResponse {
    fn internal_emoji_receiver<S: AsRef<str>>(s: S) -> Self {
        Self::Reaction(s.as_ref().to_string())
    }

    make_emoji_implementation!(Self, Self::internal_emoji_receiver);
}
