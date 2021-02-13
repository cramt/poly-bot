use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    #[serde(alias = "DISCORD_TOKEN")]
    pub discord_token: String,
    #[serde(alias = "PREFIX")]
    pub prefix: String,
    #[serde(alias = "DB")]
    pub db: ConfigDb,
    #[serde(alias = "GRAPHVIZ_LOCATION")]
    pub graphviz_location: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigDb {
    #[serde(alias = "HOST")]
    pub host: String,
    #[serde(alias = "NAME")]
    pub name: String,
    #[serde(alias = "PORT")]
    pub port: usize,
    #[serde(alias = "PASSWORD")]
    pub password: String,
    #[serde(alias = "USER")]
    pub user: String,
}

impl ToString for ConfigDb {
    fn to_string(&self) -> String {
        format!(
            "host={} dbname={} port={} password={} user={}",
            self.host, self.name, self.port, self.password, self.user
        )
    }
}

pub static CONFIG: Lazy<Config> =
    Lazy::new(|| serde_json::from_str::<Config>(include_str!("../../SECRET.json")).unwrap());
