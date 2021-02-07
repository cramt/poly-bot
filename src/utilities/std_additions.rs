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
