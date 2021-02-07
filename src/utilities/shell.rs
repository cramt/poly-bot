use once_cell::sync::Lazy;
use std::ops::Deref;
use std::process::Command;

#[cfg(target_os = "windows")]
static ENSURE_WINDOWS_UNDERSTANDS_UTF8: Lazy<()> = Lazy::new(|| {
    Command::new("cmd")
        .arg("/C")
        .arg("chcp 65001")
        .output()
        .unwrap();
});

pub fn shell_raw<S: AsRef<str>>(s: S, use_pwsh_if_windows: bool) -> Command {
    if cfg!(target_os = "windows") {
        ENSURE_WINDOWS_UNDERSTANDS_UTF8.deref();
        if use_pwsh_if_windows {
            let mut a = Command::new("powershell");
            a.arg(s.as_ref());
            a
        } else {
            let mut a = Command::new("cmd");
            a.arg("/C").arg(s.as_ref());
            a
        }
    } else {
        let mut a = Command::new("sh");
        a.arg("-c").arg(s.as_ref());
        a
    }
}

pub fn shell<S: AsRef<str>>(s: S, use_pwsh_if_windows: bool) -> Option<String> {
    shell_raw(s, use_pwsh_if_windows)
        .output()
        .ok()
        .map(|x| String::from_utf8(x.stdout).unwrap())
}
