package com.atul.looky16ui

import android.content.pm.ActivityInfo
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var webView: WebView
    private lateinit var tts: TextToSpeech
    private var ttsReady = false

    /** JavaScript bridge exposed as window.Android */
    inner class AndroidBridge {
        @JavascriptInterface
        fun speak(text: String, rate: Float = 0.9f) {
            if (!ttsReady) return
            tts.setSpeechRate(rate)
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "looky16_tts")
        }

        @JavascriptInterface
        fun stopSpeak() {
            if (ttsReady) tts.stop()
        }

        @JavascriptInterface
        fun getBatteryLevel(): Int {
            val bm = getSystemService(BATTERY_SERVICE) as? android.os.BatteryManager
            return bm?.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 85
        }

        @JavascriptInterface
        fun getWifiConnected(): Boolean {
            val cm = getSystemService(CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
            val net = cm?.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(net) ?: return false
            return caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI)
        }

        @JavascriptInterface
        fun getBluetoothState(): Boolean {
            val bta = android.bluetooth.BluetoothAdapter.getDefaultAdapter()
            return bta?.isEnabled == true
        }

        @JavascriptInterface
        fun launchApp(packageName: String) {
            try {
                val intent = packageManager.getLaunchIntentForPackage(packageName)
                if (intent != null) startActivity(intent)
            } catch (e: Exception) { /* ignore */ }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Lock to landscape for 16-inch tablet
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE

        tts = TextToSpeech(this, this)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
            }

            // Allow camera access from WebView
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    request.grant(request.resources)
                }
            }

            webViewClient = WebViewClient()
            addJavascriptInterface(AndroidBridge(), "Android")
            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale.US
            ttsReady = true
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            webView.evaluateJavascript("Router.back();", null)
        }
    }

    override fun onPause()   { super.onPause();  webView.onPause() }
    override fun onResume()  { super.onResume(); webView.onResume() }

    override fun onDestroy() {
        tts.stop()
        tts.shutdown()
        webView.destroy()
        super.onDestroy()
    }
}