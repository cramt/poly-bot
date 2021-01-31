use std::process::Command;

pub fn shell<S: AsRef<str>>(s: S) -> Option<String> {
    match if cfg!(target_os = "windows") {
        Command::new("cmd").arg("/C").arg(s.as_ref()).output().ok()
    } else {
        Command::new("sh").arg("-c").arg(s.as_ref()).output().ok()
    } {
        None => None,
        Some(x) => String::from_utf8(x.stdout).ok(),
    }
}

pub trait U64Utils {
    fn increment(&mut self) -> Self;
}

impl U64Utils for u64 {
    fn increment(&mut self) -> Self {
        *self += 1;
        *self
    }
}
