//! Motorun arayüze döndürdüğü adları ve kimlikleri yazdırır (dil dosyası denetimi için).
use uhd_engine::api::call;

fn main() {
    for (cmd, payload) in [("catalog", "{}"), ("demo", ""), ("motor_defaults", "{}"), ("texture_kinds", "{}")] {
        println!("{}", call(cmd, payload));
    }
}
