package com.onelife.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.MimeTypeMap
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream

/**
 * Full-screen WebView shell for the OneLife web app.
 *
 * The web build (dist/client) is bundled under assets/www and served from
 * https://appassets.androidplatform.net so the app runs fully offline. All
 * user data lives in the WebView's localStorage inside the app's private data
 * directory — persistent across restarts, removed on uninstall/clear-data.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var root: FrameLayout

    // --- File save (Storage Access Framework) --------------------------------
    private var pendingSaveContent: ByteArray? = null
    private val saveFileLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uri = result.data?.data
            val content = pendingSaveContent
            pendingSaveContent = null
            if (result.resultCode == RESULT_OK && uri != null && content != null) {
                try {
                    contentResolver.openOutputStream(uri, "wt")?.use { it.write(content) }
                } catch (_: Exception) {
                    // User picked an unwritable location — silently drop, like a failed browser download.
                }
            }
        }

    // --- File import (<input type="file">) ------------------------------------
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(uris ?: emptyArray())
            filePathCallback = null
        }

    // --- Notification permission (Android 13+) --------------------------------
    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_PERMISSION_REQUESTED, true).apply()
            deliverPermissionResult(if (granted) "granted" else "denied")
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        root = FrameLayout(this)
        webView = WebView(this)
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )
        setContentView(root)
        applyEdgeToEdgeInsets(root)

        configureWebView()
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    /** Pads the WebView so content isn't hidden behind system bars (edge-to-edge is enforced on API 35). */
    private fun applyEdgeToEdgeInsets(root: FrameLayout) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        applySystemBarChrome()
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime(),
            )
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
    }

    /**
     * Matches the backdrop behind the system-bar padding to the web theme.
     * Called again from onConfigurationChanged because uiMode is declared in
     * configChanges (avoids recreating the activity, which would reset the SPA).
     */
    private fun applySystemBarChrome() {
        val isDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = !isDark
            isAppearanceLightNavigationBars = !isDark
        }
        root.setBackgroundColor(
            ContextCompat.getColor(
                this,
                if (isDark) R.color.onelife_background_dark else R.color.onelife_background,
            ),
        )
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applySystemBarChrome()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
        }
        webView.addJavascriptInterface(AndroidBridge(this), AndroidBridge.JS_NAME)

        val assetHandler = SpaAssetsPathHandler(this)
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", assetHandler)
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val url = request.url
                if (url.host == APP_HOST) return false
                // External links (marketplace resources, etc.) open in the default browser.
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    true
                } catch (_: Exception) {
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams,
            ): Boolean {
                filePathCallback?.onReceiveValue(emptyArray())
                filePathCallback = callback
                return try {
                    fileChooserLauncher.launch(params.createIntent())
                    true
                } catch (_: Exception) {
                    filePathCallback = null
                    false
                }
            }
        }
    }

    // --- Bridge entry points (called from AndroidBridge on the UI thread) -----

    fun launchSaveFile(filename: String, mimeType: String, content: String) {
        pendingSaveContent = content.toByteArray(Charsets.UTF_8)
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mimeType.ifEmpty { "application/octet-stream" }
            putExtra(Intent.EXTRA_TITLE, filename)
        }
        try {
            saveFileLauncher.launch(intent)
        } catch (_: Exception) {
            pendingSaveContent = null
        }
    }

    fun notificationPermissionState(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
            if (granted) return "granted"
            val asked = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getBoolean(KEY_PERMISSION_REQUESTED, false)
            // After a request, a missing grant with no rationale means "don't ask again".
            return if (asked && !shouldShowRequestPermissionRationale(
                    android.Manifest.permission.POST_NOTIFICATIONS,
                )
            ) {
                "denied"
            } else {
                "default"
            }
        }
        // Pre-13: no runtime permission, but the user can disable notifications per app.
        return if (NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            "granted"
        } else {
            "denied"
        }
    }

    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (notificationPermissionState() == "granted") {
                deliverPermissionResult("granted")
            } else {
                notificationPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            deliverPermissionResult(notificationPermissionState())
        }
    }

    private fun deliverPermissionResult(result: String) {
        webView.evaluateJavascript(
            "window.__onNativeNotificationPermission && window.__onNativeNotificationPermission('$result')",
            null,
        )
    }

    companion object {
        const val APP_HOST = "appassets.androidplatform.net"
        const val START_URL = "https://$APP_HOST/index.html"
        private const val PREFS_NAME = "onelife_shell"
        private const val KEY_PERMISSION_REQUESTED = "notification_permission_requested"
    }
}

/**
 * Serves the bundled web build from assets/www, with an index.html fallback
 * for extension-less SPA routes (/home, /create-goal) so deep navigation and
 * reloads work exactly like the deployed web app.
 */
class SpaAssetsPathHandler(context: Context) : WebViewAssetLoader.PathHandler {
    private val assets = context.assets

    override fun handle(path: String): WebResourceResponse? {
        val cleanPath = path.trimStart('/').ifEmpty { "index.html" }
        openAsset("$ASSET_ROOT/$cleanPath")?.let { stream ->
            return WebResourceResponse(mimeTypeFor(cleanPath), null, stream)
        }
        val isRoute = !cleanPath.substringAfterLast('/').contains('.')
        if (isRoute) {
            openAsset("$ASSET_ROOT/index.html")?.let { stream ->
                return WebResourceResponse("text/html", null, stream)
            }
        }
        return WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, ByteArrayInputStream(ByteArray(0)))
    }

    private fun openAsset(assetPath: String) = try {
        assets.open(assetPath)
    } catch (_: Exception) {
        null
    }

    private fun mimeTypeFor(path: String): String {
        val ext = path.substringAfterLast('.', "").lowercase()
        EXTRA_MIME_TYPES[ext]?.let { return it }
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
            ?: "application/octet-stream"
    }

    companion object {
        private const val ASSET_ROOT = "www"

        // Types MimeTypeMap gets wrong or doesn't know.
        private val EXTRA_MIME_TYPES = mapOf(
            "js" to "text/javascript",
            "mjs" to "text/javascript",
            "css" to "text/css",
            "html" to "text/html",
            "json" to "application/json",
            "webmanifest" to "application/manifest+json",
            "svg" to "image/svg+xml",
            "woff2" to "font/woff2",
            "woff" to "font/woff",
            "ico" to "image/x-icon",
            "mp3" to "audio/mpeg",
            "wasm" to "application/wasm",
        )
    }
}
