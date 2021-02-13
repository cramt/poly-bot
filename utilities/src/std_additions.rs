pub trait NumUtils {
    fn pre_increment(&mut self) -> Self;
    fn post_increment(&mut self) -> Self;
    fn pre_decrement(&mut self) -> Self;
    fn post_decrement(&mut self) -> Self;
}

#[macro_export]
macro_rules! for_each_number_type {
    ($x:tt! $(, $y:tt)*) => {
        $x!($($y, )* u8);
        $x!($($y, )* u16);
        $x!($($y, )* u32);
        $x!($($y, )* u64);
        $x!($($y, )* u128);
        $x!($($y, )* usize);

        $x!($($y, )* i8);
        $x!($($y, )* i16);
        $x!($($y, )* i32);
        $x!($($y, )* i64);
        $x!($($y, )* i128);
        $x!($($y, )* isize);

    }
}

macro_rules! impl_num_utils {
    ($t:ty) => {
        impl NumUtils for $t {
            fn pre_increment(&mut self) -> Self {
                *self += 1;
                *self
            }
            fn post_increment(&mut self) -> Self {
                let r = *self;
                *self += 1;
                r
            }
            fn pre_decrement(&mut self) -> Self {
                *self -= 1;
                *self
            }
            fn post_decrement(&mut self) -> Self {
                let r = *self;
                *self -= 1;
                r
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

pub struct Pairs<T, I>
where
    T: Clone,
    I: Iterator<Item = T>,
{
    inner: I,
    last_element: Option<T>,
}

impl<T, I> Pairs<T, I>
where
    T: Clone,
    I: Iterator<Item = T>,
{
    pub fn new(mut iter: I) -> Self {
        let last = iter.next();
        Self {
            inner: iter,
            last_element: last,
        }
    }
}

impl<T, I> Iterator for Pairs<T, I>
where
    T: Clone,
    I: Iterator<Item = T>,
{
    type Item = (T, T);

    fn next(&mut self) -> Option<Self::Item> {
        let new = self.inner.next()?;
        let re = (self.last_element.take()?, new.clone());
        self.last_element = Some(new);
        Some(re)
    }
}

pub trait IteratorUtils: Iterator {
    fn pairs(self) -> Pairs<Self::Item, Self>
    where
        Self: Sized,
        Self::Item: Clone,
    {
        Pairs::new(self)
    }
}

impl<T: ?Sized> IteratorUtils for T where T: Iterator {}
