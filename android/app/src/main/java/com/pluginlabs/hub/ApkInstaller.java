package com.pluginlabs.hub;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.os.Build;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Katalogdaki APK'yı indirir, boyut + SHA-256 doğrular, ardından Android paket
 * yükleyicisine verir. Son onay her zaman sistemin kendi kurulum ekranındadır.
 */
final class ApkInstaller {
    interface Listener {
        void onEvent(JSONObject event);
    }

    static final long MAX_BYTES = 400L * 1024 * 1024;
    static final Set<String> ALLOWED_HOSTS = new HashSet<>(Arrays.asList(
            "github.com",
            "objects.githubusercontent.com",
            "release-assets.githubusercontent.com"));
    static final String EXTRA_ID = "com.pluginlabs.hub.INSTALL_ID";

    private static volatile Listener resultListener;

    private final Context context;
    private final Listener listener;
    private final ExecutorService pool = Executors.newSingleThreadExecutor();
    private final Map<String, AtomicBoolean> running = new ConcurrentHashMap<>();

    ApkInstaller(Context context, Listener listener) {
        this.context = context;
        this.listener = listener;
    }

    static void setResultListener(Listener l) {
        resultListener = l;
    }

    static void deliverResult(JSONObject event) {
        Listener l = resultListener;
        if (l != null) l.onEvent(event);
    }

    static JSONObject event(String id, String state, String message) {
        JSONObject o = new JSONObject();
        try {
            o.put("type", "install");
            o.put("id", id);
            o.put("state", state);
            o.put("message", message);
        } catch (JSONException ignored) {
        }
        return o;
    }

    void shutdown() {
        for (AtomicBoolean b : running.values()) b.set(true);
        pool.shutdownNow();
    }

    void cancel(String id) {
        AtomicBoolean b = running.get(id);
        if (b != null) b.set(true);
    }

    void start(String id, String url, String sha256, long size) {
        if (!id.matches("[a-z0-9-]{2,64}")) {
            listener.onEvent(event(id, "error", "Geçersiz uygulama kimliği"));
            return;
        }
        if (!sha256.matches("[0-9a-f]{64}")) {
            listener.onEvent(event(id, "error", "Katalogda geçerli SHA-256 yok; kurulum yapılmadı"));
            return;
        }
        if (size <= 0 || size > MAX_BYTES) {
            listener.onEvent(event(id, "error", "Paket boyutu sınırın dışında"));
            return;
        }
        if (running.containsKey(id)) return;
        AtomicBoolean cancelled = new AtomicBoolean(false);
        running.put(id, cancelled);
        pool.execute(() -> {
            File file = null;
            try {
                file = download(id, url, sha256, size, cancelled);
                listener.onEvent(event(id, "verified", "SHA-256 doğrulandı"));
                commit(id, file);
                listener.onEvent(event(id, "confirm", "Android kurulum onayı bekleniyor"));
            } catch (Exception e) {
                String m = e.getMessage() == null ? "Kurulum başarısız" : e.getMessage();
                listener.onEvent(event(id, cancelled.get() ? "cancelled" : "error", m));
            } finally {
                if (file != null) //noinspection ResultOfMethodCallIgnored
                    file.delete();
                running.remove(id);
            }
        });
    }

    private File download(String id, String start, String sha256, long size, AtomicBoolean cancelled) throws Exception {
        File dir = new File(context.getCacheDir(), "apk");
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Önbellek klasörü açılamadı");
        File out = new File(dir, id + ".apk");

        HttpURLConnection conn = open(start);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        long total = 0;
        int lastPct = -1;
        try (InputStream in = conn.getInputStream(); OutputStream os = new FileOutputStream(out)) {
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) != -1) {
                if (cancelled.get()) throw new IOException("İptal edildi");
                total += n;
                if (total > size) throw new IOException("Paket katalogdaki boyuttan büyük");
                md.update(buf, 0, n);
                os.write(buf, 0, n);
                int pct = (int) (total * 100 / size);
                if (pct != lastPct) {
                    lastPct = pct;
                    JSONObject e = event(id, "download", "İndiriliyor");
                    e.put("percent", pct);
                    listener.onEvent(e);
                }
            }
        } finally {
            conn.disconnect();
        }
        if (total != size) throw new IOException("Paket boyutu katalogla eşleşmiyor");
        String got = hex(md.digest());
        if (!got.equals(sha256)) throw new IOException("SHA-256 eşleşmedi; dosya silindi");
        return out;
    }

    /** Yönlendirmeleri elle izler; her adımda yalnız HTTPS ve izinli sunucu kabul edilir. */
    private static HttpURLConnection open(String start) throws IOException {
        String current = start;
        for (int hop = 0; hop < 6; hop++) {
            URL u = new URL(current);
            if (!"https".equals(u.getProtocol()) || !ALLOWED_HOSTS.contains(u.getHost().toLowerCase(Locale.ROOT))) {
                throw new IOException("İzin verilmeyen indirme adresi: " + u.getHost());
            }
            HttpURLConnection c = (HttpURLConnection) u.openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setRequestProperty("User-Agent", "PluginLabsHub-Android");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) throw new IOException("Yönlendirme adresi yok");
                current = new URL(u, loc).toString();
                continue;
            }
            if (code != 200) {
                c.disconnect();
                throw new IOException("Sunucu yanıtı: " + code);
            }
            return c;
        }
        throw new IOException("Çok fazla yönlendirme");
    }

    private void commit(String id, File file) throws IOException {
        PackageInstaller pi = context.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params =
                new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
        }
        int sessionId = pi.createSession(params);
        try (PackageInstaller.Session session = pi.openSession(sessionId)) {
            try (InputStream in = new FileInputStream(file);
                 OutputStream os = session.openWrite("base.apk", 0, file.length())) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) != -1) os.write(buf, 0, n);
                session.fsync(os);
            }
            Intent cb = new Intent(context, InstallResultReceiver.class).putExtra(EXTRA_ID, id);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
            PendingIntent pending = PendingIntent.getBroadcast(context, sessionId, cb, flags);
            session.commit(pending.getIntentSender());
        } catch (IOException | RuntimeException e) {
            pi.abandonSession(sessionId);
            throw e;
        }
    }

    private static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder(b.length * 2);
        for (byte x : b) sb.append(String.format(Locale.ROOT, "%02x", x));
        return sb.toString();
    }
}
