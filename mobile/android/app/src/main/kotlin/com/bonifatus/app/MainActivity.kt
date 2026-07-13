package com.bonifatus.app

import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterFragmentActivity

class MainActivity : FlutterFragmentActivity() {
    private val isDebuggable by lazy {
        applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        clearSecureFlagIfDebug()
    }

    override fun onResume() {
        super.onResume()
        // local_auth's BiometricPrompt fragment can re-set FLAG_SECURE.
        // Clear it again when focus returns to the activity in debug builds.
        clearSecureFlagIfDebug()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) clearSecureFlagIfDebug()
    }

    private fun clearSecureFlagIfDebug() {
        if (isDebuggable) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
