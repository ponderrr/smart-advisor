package live.smartadvisor.smart_advisor

import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine

// FlutterFragmentActivity is required by local_auth (biometric prompt).
class MainActivity : FlutterFragmentActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Native channel for Android 16 Live Update notifications.
        LiveUpdateChannel.register(flutterEngine, applicationContext)
    }
}
