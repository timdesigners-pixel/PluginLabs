package com.pluginlabs.hub;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.KeyGenerator;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Masaüstü Hub telefon köprüsü istemcisi (src/mobile-bridge.cjs ile aynı protokol).
 * Yalnız yerel ağ adreslerine bağlanır. Eşleşme anahtarı Android Keystore ile şifrelenip saklanır.
 */
final class BridgeClient {
    interface Listener {
        void onEvent(JSONObject event);
    }

    private static final String VERSION = "pl-bridge-v1";
    private static final String PREFS = "pl_bridge";
    private static final String KEY_ALIAS = "pl_bridge_key";

    private final Context context;
    private final Listener listener;
    private final ExecutorService pool = Executors.newSingleThreadExecutor();
    private final SecureRandom random = new SecureRandom();
    private volatile boolean pairingCancelled;

    BridgeClient(Context context, Listener listener) {
        this.context = context.getApplicationContext();
        this.listener = listener;
    }

    void shutdown() {
        pairingCancelled = true;
        pool.shutdownNow();
    }

    // ---------- Durum ----------

    JSONObject info() {
        JSONObject o = new JSONObject();
        SharedPreferences p = prefs();
        try {
            o.put("paired", p.contains("device"));
            o.put("address", p.getString("address", ""));
            o.put("hub", p.getString("hub", ""));
        } catch (JSONException ignored) {
        }
        return o;
    }

    void unpair() {
        prefs().edit().clear().apply();
    }

    // ---------- Eşleştirme ----------

    void pair(String address, String code, String deviceName) {
        pairingCancelled = false;
        pool.execute(() -> {
            try {
                String base = baseUrl(address);
                if (code == null || !code.matches("\\d{6}")) throw new IOException("Kod 6 haneli olmalı");
                String name = deviceName == null || deviceName.isEmpty() ? "Telefon" : deviceName.replaceAll("[\\p{Cntrl}]", "");
                if (name.length() > 60) name = name.substring(0, 60);

                KeyPairGenerator g = KeyPairGenerator.getInstance("EC");
                g.initialize(new ECGenParameterSpec("secp256r1"));
                KeyPair kp = g.generateKeyPair();
                byte[] devicePub = encodePoint((ECPublicKey) kp.getPublic());
                String devB64 = b64(devicePub);

                JSONObject start = new JSONObject();
                start.put("devicePub", devB64);
                start.put("name", name);
                start.put("mac", b64(hmac(code.getBytes(StandardCharsets.UTF_8), VERSION + "|start|" + devB64 + "|" + name)));
                JSONObject res = post(base + "/bridge/pair/start", start);
                String pairId = res.getString("pairId");
                String hubB64 = res.getString("hubPub");
                byte[] expected = hmac(code.getBytes(StandardCharsets.UTF_8), VERSION + "|reply|" + hubB64 + "|" + devB64 + "|" + pairId);
                if (!MessageDigest.isEqual(expected, unb64(res.getString("mac")))) {
                    throw new IOException("Masaüstü yanıtı doğrulanamadı");
                }
                byte[] hubPub = unb64(hubB64);
                KeyAgreement ka = KeyAgreement.getInstance("ECDH");
                ka.init(kp.getPrivate());
                ka.doPhase(decodePoint(hubPub, (ECPublicKey) kp.getPublic()), true);
                byte[] shared = ka.generateSecret();
                byte[] okm = hkdf(shared, code.getBytes(StandardCharsets.UTF_8),
                        (VERSION + "|" + devB64 + "|" + hubB64).getBytes(StandardCharsets.UTF_8), 64);
                byte[] key = Arrays.copyOfRange(okm, 0, 32);
                long n = new BigInteger(1, Arrays.copyOfRange(okm, 32, 36)).longValue() % 10000;
                String compare = String.format(java.util.Locale.ROOT, "%04d", n);
                emit("compare", compare, null);

                long deadline = System.currentTimeMillis() + 5 * 60 * 1000;
                while (!pairingCancelled && System.currentTimeMillis() < deadline) {
                    Thread.sleep(2000);
                    JSONObject q = new JSONObject();
                    q.put("pairId", pairId);
                    JSONObject st = post(base + "/bridge/pair/status", q);
                    String status = st.getString("status");
                    if ("pending".equals(status)) continue;
                    if (!"approved".equals(status)) {
                        emit("rejected".equals(status) ? "rejected" : "expired", null, null);
                        return;
                    }
                    JSONObject sealed = new JSONObject(new String(open(key, VERSION + "|pair|" + pairId,
                            st.getString("n"), st.getString("c")), StandardCharsets.UTF_8));
                    String deviceId = sealed.getString("deviceId");
                    String hub = sealed.optString("hub", "");
                    prefs().edit()
                            .putString("address", address)
                            .putString("device", deviceId)
                            .putString("hub", hub)
                            .putString("key", b64(wrap(key)))
                            .apply();
                    emit("paired", hub, null);
                    return;
                }
                emit(pairingCancelled ? "cancelled" : "expired", null, null);
            } catch (Exception e) {
                emit("error", null, e.getMessage() == null ? "Eşleşme başarısız" : e.getMessage());
            }
        });
    }

    void cancelPairing() {
        pairingCancelled = true;
    }

    // ---------- Şifreli çağrı ----------

    void call(String reqId, String op, String argsJson) {
        pool.execute(() -> {
            JSONObject ev = new JSONObject();
            try {
                ev.put("type", "bridgeResult");
                ev.put("reqId", reqId);
                SharedPreferences p = prefs();
                String deviceId = p.getString("device", null);
                if (deviceId == null) throw new IOException("Masaüstü eşleşmemiş");
                byte[] key = unwrap(unb64(p.getString("key", "")));
                JSONObject msg = new JSONObject();
                msg.put("ts", System.currentTimeMillis() / 1000);
                msg.put("op", op);
                msg.put("args", argsJson == null || argsJson.isEmpty() ? new JSONObject() : new JSONObject(argsJson));
                JSONObject req = seal(key, VERSION + "|req|" + deviceId, msg.toString().getBytes(StandardCharsets.UTF_8));
                req.put("d", deviceId);
                JSONObject res = post(baseUrl(p.getString("address", "")) + "/bridge/call", req);
                JSONObject out = new JSONObject(new String(open(key, VERSION + "|res|" + deviceId,
                        res.getString("n"), res.getString("c")), StandardCharsets.UTF_8));
                ev.put("ok", out.optBoolean("ok"));
                if (out.has("data")) ev.put("data", out.get("data"));
                if (out.has("error")) ev.put("error", out.getString("error"));
            } catch (Exception e) {
                try {
                    ev.put("ok", false);
                    ev.put("error", e.getMessage() == null ? "Bağlantı başarısız" : e.getMessage());
                } catch (JSONException ignored) {
                }
            }
            listener.onEvent(ev);
        });
    }

    // ---------- Yardımcılar ----------

    private void emit(String state, String value, String error) {
        JSONObject o = new JSONObject();
        try {
            o.put("type", "bridgePair");
            o.put("state", state);
            if (value != null) o.put("value", value);
            if (error != null) o.put("error", error);
        } catch (JSONException ignored) {
        }
        listener.onEvent(o);
    }

    private SharedPreferences prefs() {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Yalnız özel (yerel ağ) IPv4 adresi ve bağlantı noktası kabul edilir. */
    static String baseUrl(String address) throws IOException {
        if (address == null || !address.matches("\\d{1,3}(\\.\\d{1,3}){3}(:\\d{2,5})?")) {
            throw new IOException("Adres 192.168.1.20:47633 biçiminde olmalı");
        }
        String[] hp = address.split(":");
        int port = hp.length > 1 ? Integer.parseInt(hp[1]) : 47633;
        if (port < 1024 || port > 65535) throw new IOException("Geçersiz bağlantı noktası");
        InetAddress ip = InetAddress.getByName(hp[0]);
        if (!ip.isSiteLocalAddress()) throw new IOException("Yalnız yerel ağ adresleri desteklenir");
        return "http://" + hp[0] + ":" + port;
    }

    private static JSONObject post(String url, JSONObject body) throws IOException, JSONException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setInstanceFollowRedirects(false);
        c.setConnectTimeout(6000);
        c.setReadTimeout(15000);
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json");
        byte[] data = body.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = c.getOutputStream()) {
            os.write(data);
        }
        int code = c.getResponseCode();
        InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
        String text = in == null ? "{}" : readLimited(in, 256 * 1024);
        c.disconnect();
        JSONObject o = new JSONObject(text);
        if (code >= 400) throw new IOException(o.optString("error", "Masaüstü yanıtı: " + code));
        return o;
    }

    private static String readLimited(InputStream in, int max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) != -1) {
            if (out.size() + n > max) throw new IOException("Yanıt çok büyük");
            out.write(buf, 0, n);
        }
        in.close();
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    private JSONObject seal(byte[] key, String aad, byte[] plain) throws Exception {
        byte[] iv = new byte[12];
        random.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        c.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
        JSONObject o = new JSONObject();
        o.put("n", b64(iv));
        o.put("c", b64(c.doFinal(plain)));
        return o;
    }

    private static byte[] open(byte[] key, String aad, String n, String cipher) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, unb64(n)));
        c.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
        return c.doFinal(unb64(cipher));
    }

    private static byte[] hmac(byte[] key, String data) throws Exception {
        Mac m = Mac.getInstance("HmacSHA256");
        m.init(new SecretKeySpec(key, "HmacSHA256"));
        return m.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    /** RFC 5869 HKDF-SHA256. */
    static byte[] hkdf(byte[] ikm, byte[] salt, byte[] info, int length) throws Exception {
        Mac m = Mac.getInstance("HmacSHA256");
        m.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] prk = m.doFinal(ikm);
        m.init(new SecretKeySpec(prk, "HmacSHA256"));
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] t = new byte[0];
        for (int i = 1; out.size() < length; i++) {
            m.update(t);
            m.update(info);
            m.update((byte) i);
            t = m.doFinal();
            out.write(t, 0, t.length);
        }
        return Arrays.copyOf(out.toByteArray(), length);
    }

    private static byte[] encodePoint(ECPublicKey pub) {
        byte[] out = new byte[65];
        out[0] = 4;
        copyFixed(pub.getW().getAffineX(), out, 1);
        copyFixed(pub.getW().getAffineY(), out, 33);
        return out;
    }

    private static void copyFixed(BigInteger v, byte[] dst, int off) {
        byte[] b = v.toByteArray();
        int len = Math.min(b.length, 32);
        System.arraycopy(b, b.length - len, dst, off + 32 - len, len);
    }

    private static java.security.PublicKey decodePoint(byte[] raw, ECPublicKey like) throws Exception {
        if (raw.length != 65 || raw[0] != 4) throw new IOException("Geçersiz masaüstü anahtarı");
        BigInteger x = new BigInteger(1, Arrays.copyOfRange(raw, 1, 33));
        BigInteger y = new BigInteger(1, Arrays.copyOfRange(raw, 33, 65));
        ECPublicKeySpec spec = new ECPublicKeySpec(new ECPoint(x, y), like.getParams());
        return KeyFactory.getInstance("EC").generatePublic(spec);
    }

    // Eşleşme anahtarı, Android Keystore'daki cihaza bağlı bir anahtarla sarılarak saklanır.
    private SecretKey keystoreKey() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(KEY_ALIAS)) return (SecretKey) ks.getKey(KEY_ALIAS, null);
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return kg.generateKey();
    }

    private byte[] wrap(byte[] plain) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, keystoreKey());
        byte[] iv = c.getIV();
        byte[] body = c.doFinal(plain);
        byte[] out = new byte[1 + iv.length + body.length];
        out[0] = (byte) iv.length;
        System.arraycopy(iv, 0, out, 1, iv.length);
        System.arraycopy(body, 0, out, 1 + iv.length, body.length);
        return out;
    }

    private byte[] unwrap(byte[] data) throws Exception {
        if (data.length < 2) throw new IOException("Eşleşme anahtarı okunamadı; yeniden eşleştirin");
        int ivLen = data[0];
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, keystoreKey(), new GCMParameterSpec(128, Arrays.copyOfRange(data, 1, 1 + ivLen)));
        return c.doFinal(Arrays.copyOfRange(data, 1 + ivLen, data.length));
    }

    private static String b64(byte[] b) {
        return Base64.encodeToString(b, Base64.NO_WRAP);
    }

    private static byte[] unb64(String s) {
        return Base64.decode(s, Base64.NO_WRAP);
    }
}
