package kr.yumin.studyroom

import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var webView: WebView

    private val devicePolicyManager by lazy {
        getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
    }
    private val adminComponent by lazy {
        ComponentName(this, YuminDeviceAdminReceiver::class.java)
    }

    // Add only child-safe apps that are installed on the tablet.
    // These packages are included in Android Lock Task Mode's allowlist.
    private val approvedChildPackages = setOf(
        "com.google.android.apps.youtube.kids"
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            safeBrowsingEnabled = true
        }
        webView.addJavascriptInterface(YuminLauncherBridge(), "YuminLauncherBridge")
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val uri = request.url
                return when (uri.scheme) {
                    "https" -> uri.host != "jroti0614-star.github.io"
                    else -> {
                        Toast.makeText(this@MainActivity, "허용되지 않은 연결이에요.", Toast.LENGTH_SHORT).show()
                        true
                    }
                }
            }
        }

        hideSystemBars()
        if (savedInstanceState == null) {
            webView.loadUrl("https://jroti0614-star.github.io/yumin-preview/")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onResume() {
        super.onResume()
        enterKioskModeIfProvisioned()
    }

    private fun enterKioskModeIfProvisioned() {
        if (!devicePolicyManager.isDeviceOwnerApp(packageName)) return

        try {
            val installedApprovedPackages = approvedChildPackages.filter { pkg ->
                packageManager.getLaunchIntentForPackage(pkg) != null
            }
            devicePolicyManager.setLockTaskPackages(
                adminComponent,
                (installedApprovedPackages + packageName).toTypedArray()
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                devicePolicyManager.setLockTaskFeatures(
                    adminComponent,
                    DevicePolicyManager.LOCK_TASK_FEATURE_NONE
                )
            }

            val activityManager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
            if (activityManager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_LOCKED) {
                startLockTask()
            }
        } catch (e: SecurityException) {
            Toast.makeText(this, "기기 잠금 설정 권한을 확인해 주세요.", Toast.LENGTH_LONG).show()
        } catch (e: IllegalArgumentException) {
            Toast.makeText(this, "허용 앱 설정을 확인해 주세요.", Toast.LENGTH_LONG).show()
        }
    }

    private fun hideSystemBars() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onBackPressed() {
        val activityManager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
        val locked = activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED
        if (locked) return

        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            moveTaskToBack(true)
        }
    }

    inner class YuminLauncherBridge {
        @JavascriptInterface
        fun launchApp(packageName: String, appName: String) {
            runOnUiThread {
                if (packageName !in approvedChildPackages) {
                    Toast.makeText(this@MainActivity, "$appName 앱은 보호자 허용 목록에 없어요.", Toast.LENGTH_SHORT).show()
                    return@runOnUiThread
                }
                try {
                    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                    if (launchIntent == null) {
                        Toast.makeText(this@MainActivity, "$appName 앱을 찾을 수 없어요.", Toast.LENGTH_SHORT).show()
                    } else {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(launchIntent)
                    }
                } catch (_: ActivityNotFoundException) {
                    Toast.makeText(this@MainActivity, "$appName 앱을 실행하지 못했어요.", Toast.LENGTH_SHORT).show()
                } catch (_: SecurityException) {
                    Toast.makeText(this@MainActivity, "$appName 앱 실행이 차단됐어요.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun getPlatform(): String = "android"
    }
}