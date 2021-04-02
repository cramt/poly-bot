use eyre::*;

pub fn no_user_by_discord_id() -> Report {
    eyre!("this discord user dont have polybot user")
}
