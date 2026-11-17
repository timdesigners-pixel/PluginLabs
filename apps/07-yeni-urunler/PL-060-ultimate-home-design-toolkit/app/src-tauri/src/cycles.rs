//! Cycles (Blender) render köprüsü.
//!
//! Kullanıcının bilgisayarındaki Blender, arka planda (`-b`) ve fabrika ayarlarıyla çalıştırılır;
//! yalnız uygulamanın kendi betiği (`cycles/uhd_cycles.py`) ve geçici klasördeki sahne paketi verilir.
//! Ağ erişimi yoktur. Aynı anda tek render çalışır; kullanıcı iptal edebilir.

use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{Emitter, Manager};

type R<T> = Result<T, String>;
const MAX_SECONDS: u64 = 6 * 60 * 60;

pub static RUNNING: Mutex<Option<Child>> = Mutex::new(None);

fn config_path(app: &tauri::AppHandle) -> R<PathBuf> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("cycles.json"))
}

fn is_blender(p: &Path) -> bool {
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
    (name == "blender.exe" || name == "blender") && p.is_file()
}

/// Kayıtlı yol, BLENDER ortam değişkeni, olağan kurulum klasörleri ve PATH sırasıyla aranır.
pub fn find(app: &tauri::AppHandle) -> Option<PathBuf> {
    if let Ok(p) = config_path(app) {
        if let Ok(t) = std::fs::read_to_string(p) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&t) {
                if let Some(s) = v["path"].as_str() {
                    let p = PathBuf::from(s);
                    if is_blender(&p) {
                        return Some(p);
                    }
                }
            }
        }
    }
    if let Some(s) = std::env::var_os("BLENDER") {
        let p = PathBuf::from(s);
        if is_blender(&p) {
            return Some(p);
        }
    }
    let mut roots: Vec<PathBuf> = vec![];
    for var in ["ProgramFiles", "ProgramW6432", "LOCALAPPDATA"] {
        if let Some(v) = std::env::var_os(var) {
            roots.push(PathBuf::from(&v).join("Blender Foundation"));
            roots.push(PathBuf::from(&v).join("Programs").join("Blender Foundation"));
        }
    }
    let mut found: Vec<PathBuf> = vec![];
    for r in roots {
        if let Ok(rd) = std::fs::read_dir(&r) {
            for e in rd.flatten() {
                let p = e.path().join("blender.exe");
                if is_blender(&p) {
                    found.push(p);
                }
            }
        }
    }
    // en yeni sürüm (klasör adı "Blender 4.5", "Blender 5.0" …)
    found.sort();
    if let Some(p) = found.pop() {
        return Some(p);
    }
    let exe = if cfg!(windows) { "blender.exe" } else { "blender" };
    std::env::var_os("PATH").and_then(|paths| std::env::split_paths(&paths).map(|d| d.join(exe)).find(|p| is_blender(p)))
}

pub fn set_path(app: &tauri::AppHandle, p: &Path) -> R<()> {
    if !is_blender(p) {
        return Err("@cycles_not_blender".into());
    }
    let v = serde_json::json!({"path": p.display().to_string()});
    std::fs::write(config_path(app)?, v.to_string()).map_err(|e| e.to_string())
}

fn script(app: &tauri::AppHandle) -> R<PathBuf> {
    let res = app.path().resource_dir().map_err(|e| e.to_string())?;
    for p in [res.join("cycles").join("uhd_cycles.py"), res.join("_up_").join("cycles").join("uhd_cycles.py")] {
        if p.is_file() {
            return Ok(p);
        }
    }
    // geliştirme: kaynak ağacındaki betik
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("cycles").join("uhd_cycles.py");
    if dev.is_file() {
        return Ok(dev);
    }
    Err("@cycles_script_missing".into())
}

/// Sahne paketini render eder ve PNG baytlarını döndürür. İlerleme "cycles-progress" olayıyla bildirilir.
pub fn render(app: &tauri::AppHandle, package: &str) -> R<Vec<u8>> {
    let blender = find(app).ok_or("@cycles_no_blender")?;
    let script = script(app)?;
    let dir = std::env::temp_dir().join(format!("uhd-cycles-{}", std::process::id()));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let job = dir.join("sahne.json");
    let out = dir.join("render.png");
    let _ = std::fs::remove_file(&out);
    std::fs::write(&job, package).map_err(|e| e.to_string())?;
    let mut cmd = Command::new(&blender);
    cmd.args(["-b", "--factory-startup", "--python-exit-code", "1", "-P"]).arg(&script).arg("--").arg(&job).arg(&out);
    cmd.stdout(Stdio::piped()).stderr(Stdio::null()).stdin(Stdio::null());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    {
        let mut slot = RUNNING.lock().map_err(|_| "kilit")?;
        if slot.is_some() {
            return Err("@cycles_busy".into());
        }
        let mut child = cmd.spawn().map_err(|e| format!("@cycles_start|error={e}"))?;
        let stdout = child.stdout.take();
        *slot = Some(child);
        if let Some(so) = stdout {
            let app = app.clone();
            std::thread::spawn(move || {
                for line in BufReader::new(so).lines().map_while(Result::ok) {
                    // "Sample 64/256" ya da betiğin kendi satırları
                    if let Some(i) = line.find("Sample ") {
                        let frac: Vec<&str> = line[i + 7..].split(|c: char| !c.is_ascii_digit()).filter(|s| !s.is_empty()).take(2).collect();
                        if frac.len() == 2 {
                            let _ = app.emit("cycles-progress", serde_json::json!({"sample": frac[0], "total": frac[1]}));
                        }
                    } else if line.starts_with("[uhd-cycles]") {
                        let _ = app.emit("cycles-progress", serde_json::json!({"line": line.trim_start_matches("[uhd-cycles] ")}));
                    }
                }
            });
        }
    }
    let start = Instant::now();
    let status = loop {
        std::thread::sleep(Duration::from_millis(250));
        let mut slot = RUNNING.lock().map_err(|_| "kilit")?;
        let Some(child) = slot.as_mut() else { return Err("@cycles_cancelled".into()) };
        if let Some(st) = child.try_wait().map_err(|e| e.to_string())? {
            *slot = None;
            break st;
        }
        if start.elapsed().as_secs() > MAX_SECONDS {
            let _ = child.kill();
            *slot = None;
            return Err("@cycles_timeout".into());
        }
    };
    if !status.success() {
        return Err("@cycles_failed".into());
    }
    let png = std::fs::read(&out).map_err(|_| "@cycles_failed".to_string())?;
    let _ = std::fs::remove_dir_all(&dir);
    Ok(png)
}

pub fn cancel() {
    if let Ok(mut slot) = RUNNING.lock() {
        if let Some(mut c) = slot.take() {
            let _ = c.kill();
            let _ = c.wait();
        }
    }
}
