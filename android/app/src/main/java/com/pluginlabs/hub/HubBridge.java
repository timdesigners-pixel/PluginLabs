package com.pluginlabs.hub;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Locale;

/**
 * Arayüzün (window.PLNative) çağırabildiği dar köprü.
 * Yalnız okuma amaçlı cihaz bilgisi, doğrulamalı APK kurulumu ve dış bağlantı açma sunar.
 * Anahtar, belirteç veya kişisel dosya içeriği arayüze verilmez.
 */
final class HubBridge implements ApkInstaller.Listener {
    private final MainActivity activity;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ApkInstaller installer;
    private volatile WebView webView;

    HubBridge(MainActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.installer = new ApkInstaller(activity.getApplicationContext(), this);
        ApkInstaller.setResultListener(this);
    }

    void dispose() {
        ApkInstaller.setResultListener(null);
        installer.shutdown();
        webView = null;
    }

    @JavascriptInterface
    public String appInfo() {
        JSONObject o = new JSONObject();
        try {
            o.put("version", BuildConfig.VERSION_NAME);
            o.put("versionCode", BuildConfig.VERSION_CODE);
            o.put("applicationId", BuildConfig.APPLICATION_ID);
            o.put("debug", BuildConfig.DEBUG);
            o.put("platform", "android");
        } catch (JSONException ignored) {
        }
        return o.toString();
    }

    @JavascriptInterface
    public String deviceInfo() {
        JSONObject o = new JSONObject();
        try {
            Context c = activity.getApplicationContext();
            o.put("manufacturer", Build.MANUFACTURER);
            o.put("model", Build.MODEL);
            o.put("android", Build.VERSION.RELEASE);
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "");
            o.put("locale", Locale.getDefault().toLanguageTag());

            BatteryManager bm = (BatteryManager) c.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                o.put("batteryPercent", bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) o.put("charging", bm.isCharging());
            }

            StatFs fs = new StatFs(Environment.getDataDirectory().getPath());
            o.put("storageTotal", fs.getTotalBytes());
            o.put("storageFree", fs.getAvailableBytes());

            ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                am.getMemoryInfo(mi);
                o.put("ramTotal", mi.totalMem);
                o.put("ramFree", mi.availMem);
            }

            o.put("network", networkType(c));

            DisplayMetrics dm = c.getResources().getDisplayMetrics();
            o.put("screen", dm.widthPixels + "×" + dm.heightPixels);
            o.put("density", dm.densityDpi);
        } catch (Exception ignored) {
            // Kısmi bilgi yine de döner.
        }
        return o.toString();
    }

    private static String networkType(Context c) {
        ConnectivityManager cm = (ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return "unknown";
        Network n = cm.getActiveNetwork();
        if (n == null) return "none";
        NetworkCapabilities nc = cm.getNetworkCapabilities(n);
        if (nc == null) return "none";
        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "wifi";
        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return "cellular";
        if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "ethernet";
        return "other";
    }

    @JavascriptInterface
    public String packageVersion(String packageName) {
        if (packageName == null || !packageName.matches("[A-Za-z0-9_.]{3,120}")) return "";
        try {
            PackageInfo pi = activity.getPackageManager().getPackageInfo(packageName, 0);
            return pi.versionName == null ? "" : pi.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "";
        }
    }

    @JavascriptInterface
    public boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return activity.getPackageManager().canRequestPackageInstalls();
    }

    @JavascriptInterface
    public void openInstallSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        main.post(() -> {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName()));
            try {
                activity.startActivity(i);
            } catch (Exception ignored) {
            }
        });
    }

    /** {"id","url","sha256","size"} — boyut ve SHA-256 tutmazsa kurulum yapılmaz. */
    @JavascriptInterface
    public void installApk(String json) {
        try {
            JSONObject o = new JSONObject(json);
            installer.start(o.getString("id"), o.getString("url"),
                    o.getString("sha256"), o.getLong("size"));
        } catch (JSONException e) {
            onEvent(ApkInstaller.event("", "error", "Kurulum isteği okunamadı"));
        }
    }

    @JavascriptInterface
    public void cancelInstall(String id) {
        installer.cancel(id);
    }

    @JavascriptInterface
    public void openApp(String packageName) {
        if (packageName == null || !packageName.matches("[A-Za-z0-9_.]{3,120}")) return;
        main.post(() -> {
            Intent i = activity.getPackageManager().getLaunchIntentForPackage(packageName);
            if (i != null) activity.startActivity(i);
        });
    }

    @JavascriptInterface
    public void openExternal(String url) {
        main.post(() -> activity.openExternal(Uri.parse(url)));
    }

    @JavascriptInterface
    public void share(String text) {
        if (text == null) return;
        final String body = text.length() > 2000 ? text.substring(0, 2000) : text;
        main.post(() -> {
            Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, body);
            activity.startActivity(Intent.createChooser(send, "Paylaş"));
        });
    }

    void emitResume() {
        onEvent(ApkInstaller.event("", "resume", ""));
    }

    @Override
    public void onEvent(JSONObject event) {
        final String payload = JSONObject.quote(event.toString());
        main.post(() -> {
            WebView w = webView;
            if (w != null) {
                w.evaluateJavascript("window.PLApp && window.PLApp.onNative && window.PLApp.onNative(" + payload + ")", null);
            }
        });
    }
}
