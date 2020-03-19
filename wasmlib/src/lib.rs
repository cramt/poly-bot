extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

#[no_mangle]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// this function changes a value by reference (borrowing and change)
#[no_mangle]
pub fn alter(a: &mut [u8]) {
    a[1] = 12;
}