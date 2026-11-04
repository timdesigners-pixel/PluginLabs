# Rust frontend sözleşmesi · 0.3.0

Sahiplik: `ui/` diğer Kurgu sohbeti; `src-tauri/` motor sohbeti. Komutlar Tauri invoke ile çağrılır; frontend dosya/shell/token erişimi yapmaz.

- `snapshot()` → `{project,media,jobs,capabilities}`. Project version 2, name/width/height/fps/clips/subtitles. Clip camelCase: id, mediaId, start, in, duration, layer, volume, fade, speed, brightness, contrast, saturation, blur, x,y,scale,opacity,keyframes,nodes. Süreler saniye; kayıt/render doğrulamasında FPS ızgarasına oturur.
- `import_media()` → güncel snapshot; native çoklu seçici, uygulama veri alanına kopya.
- `save_project({project})` / `open_project()` → snapshot. Açılan JSON yalnız mevcut medya kimliklerini kullanır; arbitrary path açmaz.
- `export_project({project,kind})` → job id. kind preview/export/proxy; proxy bu sürümde düşük çözünürlüklü proje render'ıdır.
- `cancel_job({id})`, `save_output({id})` → durum metni. job `{id,kind,status,progress,file,error}`; status queued/running/completed/failed/cancelled.
- `demo_project()` → snapshot; FFmpeg ile sentetik yerel test video ve ses üretir.
- `mymind({prompt,approved})` → `{text,source}`. `configure_hub({token})` token Windows Credential Manager içinde saklanır ve Rust belleğine alınır; snapshot'a dönmez. Sabit http://127.0.0.1:47632/v1/chat/completions endpoint'i kullanılır.
- `import_path({path})` yalnız `--evidence` argümanıyla çalışan test sürecinde; normal uygulamada reddedilir.

Media `{id,name,kind,duration,width,height,audio,file,thumbnail}`; thumbnail `data:image/jpeg;base64,...`. file yalnız backend tarafından uygulama veri alanında üretilir, `convertFileSrc(file)` ile önizlenir. Job file da bu alandadır.

Keyframe `{frame,property,value,easing}`; property x/y (opacity keyframe açıkça reddedilir; statik opacity destekli); easing linear/smooth/hold. Nodes `{id,type,inputs:[id],...parameters}`; source,color,blur,chroma,transform,output video portlarıdır. Cycle/unknown input/type doğrulanır. Bu ilk derleyici tek klipte seri efekt zincirini destekler; çok girişli merge şimdilik reddedilir. UI bu yetenek sınırını göstermelidir.
