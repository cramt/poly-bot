use std::process::{Command, Output};
use once_cell::sync::Lazy;
use std::ops::Deref;

#[cfg(target_os = "windows")]
static ENSURE_WINDOWS_UNDERSTANDS_UTF8: Lazy<()> = Lazy::new(|| {
    Command::new("cmd").arg("/C").arg("chcp 65001").output().unwrap();
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
    shell_raw(s, use_pwsh_if_windows).output().ok().map(|x| String::from_utf8(x.stdout).unwrap())
}

pub trait NumUtils {
    fn increment(&mut self) -> Self;
    fn decrement(&mut self) -> Self;
}

#[macro_export]
macro_rules! for_each_number_type {
    ($x:tt! $(, $y:tt)*) => {
        $x!($($y, )* u8);
        $x!($($y, )* u16);
        $x!($($y, )* u32);
        $x!($($y, )* u64);
        $x!($($y, )* u128);

        $x!($($y, )* i8);
        $x!($($y, )* i16);
        $x!($($y, )* i32);
        $x!($($y, )* i64);
        $x!($($y, )* i128);

    }
}

macro_rules! impl_num_utils {
    ($t:ty) => {
        impl NumUtils for $t {
            fn increment(&mut self) -> Self {
                *self += 1;
                *self
            }
            fn decrement(&mut self) -> Self {
                *self -= 1;
                *self
            }
        }
    };
}

for_each_number_type!(impl_num_utils!);

pub trait PostgresClientUtils {
    fn close(self);
}

impl PostgresClientUtils for tokio_postgres::Client {
    fn close(self) {
        std::mem::drop(self)
    }
}
