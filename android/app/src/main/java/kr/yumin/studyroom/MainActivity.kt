package kr.yumin.studyroom

import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.app.admin.DevicePolicyManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.text.InputType
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import java.security.MessageDigest
import java.security.SecureRandom

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val prefs by lazy { getSharedPreferences("guardian_settings", MODE_PRIVATE) }

    private val devicePolicyManager by lazy {
        getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
    }
    private val adminComponent by lazy {
        ComponentName(this, YuminDeviceAdminReceiver::class.java)
    }

    // Add only child-safe apps that are installed on the tablet.
    private val approvedChildPackages = setOf(
        "com.google.android.apps.youtube.kids"
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = WebView(this)
        webView.setOnLongClickListener {
            showGuardianDialog()
            true
        }
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
        if (!prefs.getBoolean("parent_mode", false)) {
            enterKioskModeIfProvisioned()
        }
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

    private fun showGuardianDialog() {
        if (!prefs.contains("pin_hash")) {
            showPinSetupDialog()
            return
        }

        val input = EditText(this).apply {
            hint = "보호자 PIN"
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        }
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 8, 48, 0)
            addView(input)
        }
        AlertDialog.Builder(this)
            .setTitle("보호자 확인")
            .setMessage("보호자 PIN을 입력해 주세요.")
            .setView(container)
            .setNegativeButton("취소", null)
            .setPositiveButton("확인", null)
            .create().also { dialog ->
                dialog.setOnShowListener {
                    dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                        val entered = input.text.toString()
                        if (verifyPin(entered)) {
                            if (prefs.getBoolean("parent_mode", false)) {
                                showChildModeConfirmation()
                            } else {
                                activateParentMode()
                                dialog.dismiss()
                            }
                        } else {
                            input.error = "PIN이 일치하지 않습니다."
                        }
                    }
                }
                dialog.show()
            }
    }

    private fun showPinSetupDialog() {
        val first = EditText(this).apply {
            hint = "숫자 4~8자리"
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        }
        val second = EditText(this).apply {
            hint = "PIN 다시 입력"
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        }
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 8, 48, 0)
            addView(first)
            addView(second)
        }
        AlertDialog.Builder(this)
            .setTitle("보호자 PIN 만들기")
            .setMessage("처음 한 번만 설정하면 됩니다. PIN은 태블릿 안에 암호화된 형태로 저장됩니다.")
            .setView(container)
            .setNegativeButton("취소", null)
            .setPositiveButton("저장", null)
            .create().also { dialog ->
                dialog.setOnShowListener {
                    dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                        val a = first.text.toString()
                        val b = second.text.toString()
                        if (!a.matches(Regex("\\d{4,8}"))) {
                            first.error = "숫자 4~8자리로 입력해 주세요."
                        } else if (a != b) {
                            second.error = "PIN이 서로 다릅니다."
                        } else {
                            val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
                            prefs.edit()
                                .putString("pin_salt", salt.joinToString("") { "%02x".format(it) })
                                .putString("pin_hash", hashPin(a, salt))
                                .apply()
                            Toast.makeText(this, "보호자 PIN이 저장됐습니다.", Toast.LENGTH_LONG).show()
                            activateParentMode()
                            dialog.dismiss()
                        }
                    }
                }
                dialog.show()
            }
    }

    private fun verifyPin(pin: String): Boolean {
        if (!pin.matches(Regex("\\d{4,8}"))) return false
        val saltHex = prefs.getString("pin_salt", null) ?: return false
        val expected = prefs.getString("pin_hash", null) ?: return false
        val salt = saltHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
        val actual = hashPin(pin, salt)
        return MessageDigest.isEqual(
            actual.toByteArray(Charsets.UTF_8),
            expected.toByteArray(Charsets.UTF_8)
        )
    }

    private fun hashPin(pin: String, salt: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(salt + pin.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun activateParentMode() {
        prefs.edit().putBoolean("parent_mode", true).apply()
        val manager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
        if (manager.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE) {
            stopLockTask()
        }
        hideSystemBars()
        Toast.makeText(this, "보호자 모드입니다. 태블릿 설정과 다른 앱을 사용할 수 있어요.", Toast.LENGTH_LONG).show()
    }

    private fun showChildModeConfirmation() {
        AlertDialog.Builder(this)
            .setTitle("유민이 모드로 전환")
            .setMessage("보호자 모드를 종료하고 유민이 공부방 잠금을 다시 시작할까요?")
            .setNegativeButton("취소", null)
            .setPositiveButton("전환") { _, _ ->
                prefs.edit().putBoolean("parent_mode", false).apply()
                enterKioskModeIfProvisioned()
                Toast.makeText(this, "유민이 모드로 전환했습니다.", Toast.LENGTH_SHORT).show()
            }
            .show()
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