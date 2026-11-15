//! Tarayıcı önizlemesi için WebAssembly köprüsü. Aynı `uhd_engine::api::call` kullanılır.
//! Bellek sözleşmesi: JS `uhd_alloc` ile ayırır, UTF-8 yazar, `uhd_call` sonucu
//! [u32 uzunluk (LE)][bayt…] biçiminde döner; JS okuduktan sonra `uhd_free_result` çağırır.

use std::alloc::{alloc, dealloc, Layout};

#[no_mangle]
pub extern "C" fn uhd_alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return std::ptr::null_mut();
    }
    unsafe { alloc(Layout::from_size_align(len, 1).unwrap()) }
}

#[no_mangle]
pub unsafe extern "C" fn uhd_free(ptr: *mut u8, len: usize) {
    if !ptr.is_null() && len > 0 {
        dealloc(ptr, Layout::from_size_align(len, 1).unwrap());
    }
}

unsafe fn read(ptr: *const u8, len: usize) -> String {
    if ptr.is_null() || len == 0 {
        return String::new();
    }
    String::from_utf8_lossy(std::slice::from_raw_parts(ptr, len)).into_owned()
}

#[no_mangle]
pub unsafe extern "C" fn uhd_call(cmd: *const u8, cmd_len: usize, payload: *const u8, payload_len: usize) -> *mut u8 {
    let out = uhd_engine::api::call(&read(cmd, cmd_len), &read(payload, payload_len));
    let bytes = out.into_bytes();
    let total = bytes.len() + 4;
    let p = uhd_alloc(total);
    std::ptr::copy_nonoverlapping((bytes.len() as u32).to_le_bytes().as_ptr(), p, 4);
    std::ptr::copy_nonoverlapping(bytes.as_ptr(), p.add(4), bytes.len());
    p
}

#[no_mangle]
pub unsafe extern "C" fn uhd_free_result(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    let mut len = [0u8; 4];
    std::ptr::copy_nonoverlapping(ptr, len.as_mut_ptr(), 4);
    uhd_free(ptr, u32::from_le_bytes(len) as usize + 4);
}
