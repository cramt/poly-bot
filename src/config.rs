use serde::{Deserialize, Serialize};
use serde_json::Result;
use once_cell::sync::Lazy;

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    #[serde(alias = "DISCORD_TOKEN")]
    discord_token: String,
    #[serde(alias = "PREFIX")]
    prefix: String,
    #[serde(alias = "DB")]
    db: ConfigDb
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigDb {
    #[serde(alias = "HOST")]
    host: String,
    #[serde(alias = "NAME")]
    name: String,
    #[serde(alias = "PORT")]
    port: usize,
    #[serde(alias = "PASSWORD")]
    password: String,
    #[serde(alias = "USER")]
    user: String,
}

pub const CONFIG: Lazy<Config> = Lazy::new(|| {
   serde_json::from_str::<Config>(include_str!("../SECRET.json")).unwrap()
});
