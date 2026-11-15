//! Hub istemci anahtarı Windows Kimlik Bilgisi Yöneticisi'nde tutulur; dosyaya ve arayüze yazılmaz.
const TARGET: &str = "UltimateHome:pluginlabs-hub\0";

#[cfg(windows)]
pub fn write(token: &str) -> Result<(), String> {
    use windows_sys::Win32::Security::Credentials::*;
    let mut name: Vec<u16> = TARGET.encode_utf16().collect();
    let mut user: Vec<u16> = "Ultimate Home Design Toolkit\0".encode_utf16().collect();
    let mut bytes = token.as_bytes().to_vec();
    let mut c: CREDENTIALW = unsafe { std::mem::zeroed() };
    c.Type = CRED_TYPE_GENERIC;
    c.TargetName = name.as_mut_ptr();
    c.UserName = user.as_mut_ptr();
    c.CredentialBlobSize = bytes.len() as u32;
    c.CredentialBlob = bytes.as_mut_ptr();
    c.Persist = CRED_PERSIST_LOCAL_MACHINE;
    let r = unsafe { CredWriteW(&c, 0) };
    bytes.fill(0);
    if r == 0 {
        Err("Windows kimlik kasasına kaydedilemedi".into())
    } else {
        Ok(())
    }
}

#[cfg(windows)]
pub fn read() -> Option<String> {
    use windows_sys::Win32::Security::Credentials::*;
    let name: Vec<u16> = TARGET.encode_utf16().collect();
    let mut ptr: *mut CREDENTIALW = std::ptr::null_mut();
    if unsafe { CredReadW(name.as_ptr(), CRED_TYPE_GENERIC, 0, &mut ptr) } == 0 || ptr.is_null() {
        return None;
    }
    let v = unsafe {
        let c = &*ptr;
        String::from_utf8(std::slice::from_raw_parts(c.CredentialBlob, c.CredentialBlobSize as usize).to_vec()).ok()
    };
    unsafe { CredFree(ptr.cast()) };
    v
}

#[cfg(not(windows))]
pub fn write(_: &str) -> Result<(), String> {
    Err("Güvenli kasa bu platformda bağlı değil".into())
}
#[cfg(not(windows))]
pub fn read() -> Option<String> {
    None
}
