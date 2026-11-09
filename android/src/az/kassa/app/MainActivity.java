package az.kassa.app;

// KASSA Android proqramı: internetdəki KASSA səhifəsini (GitHub Pages) tam ekranda açır.
// Məlumat telefonun yaddaşında qalır (səhifənin öz yaddaşı), internet olanda buludla sinxronlaşır.
// Proqramın məntiqi səhifədədir, ona görə yeniliklər APK-nı yeniləmədən özü gəlir.

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    static final String URL = "https://signmasterezcad.github.io/kassa/app/";
    static final String HOST = "signmasterezcad.github.io";
    WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xff0f141b);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " KassaAndroid/1");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                Uri u = Uri.parse(url);
                if (HOST.equals(u.getHost())) return false;          // KASSA səhifəsi proqramın içində
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;                                         // digər linklər brauzerdə
            }
        });
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl(URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent ev) {
        if (code == KeyEvent.KEYCODE_BACK && web.canGoBack()) { web.goBack(); return true; }
        return super.onKeyDown(code, ev);
    }
}
