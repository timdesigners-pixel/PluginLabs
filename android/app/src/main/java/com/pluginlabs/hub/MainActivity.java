package com.pluginlabs.hub;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.splashscreen.SplashScreen;
import androidx.webkit.WebViewAssetLoader;

/**
 * PluginLabs Hub Android kabuğu.
 * Arayüz yerel assets/web klasöründen, yalnız appassets kökeninden yüklenir;
 * başka bir adrese gezinme engellenir ve dış bağlantılar tarayıcıda açılır.
 */
public class MainActivity extends Activity {
    static final String APP_HOST = "appassets.androidplatform.net";
    static final String START_URL = "https://" + APP_HOST + "/assets/web/index.html";

    private WebView webView;
    private HubBridge bridge;
    private volatile boolean firstPaint;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        // Sistem açılış ekranı yalnız WebView ilk kareyi çizene kadar kalır;
        // 4 saniyelik hazırlık ekranı arayüzün kendisindedir.
        splash.setKeepOnScreenCondition(() -> !firstPaint);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#101214"));
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equals(uri.getHost())) return false;
                openExternal(uri);
                return true;
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                firstPaint = true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                firstPaint = true;
            }
        });

        bridge = new HubBridge(this, webView);
        webView.addJavascriptInterface(bridge, "PLNative");
        setContentView(webView);

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    void openExternal(Uri uri) {
        if (uri == null || !"https".equals(uri.getScheme())) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ignored) {
            // Tarayıcı yoksa sessizce geç.
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bridge != null) bridge.emitResume();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript("window.PLApp && window.PLApp.back ? window.PLApp.back() : false", value -> {
            if (!"true".equals(value)) finish();
        });
    }

    @Override
    protected void onDestroy() {
        if (bridge != null) bridge.dispose();
        if (webView != null) {
            webView.removeJavascriptInterface("PLNative");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
