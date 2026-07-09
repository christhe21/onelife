# Keep the JavaScript bridge — methods are invoked reflectively from the WebView.
-keepclassmembers class com.onelife.app.AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}
