package live.smartadvisor.smart_advisor

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * MethodChannel that starts / stops [GroupQuizLiveService] — the
 * foreground service that keeps the group-quiz Live Update notification
 * refreshing while the app is backgrounded.
 */
object LiveUpdateChannel {
    private const val CHANNEL = "live.smartadvisor.smart_advisor/live_update"

    fun register(engine: FlutterEngine, context: Context) {
        MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                try {
                    when (call.method) {
                        "startService" -> {
                            val intent =
                                Intent(context, GroupQuizLiveService::class.java)
                                    .putExtra(
                                        GroupQuizLiveService.EXTRA_SESSION_ID,
                                        call.argument<String>("sessionId"))
                                    .putExtra(
                                        GroupQuizLiveService.EXTRA_CODE,
                                        call.argument<String>("code"))
                                    .putExtra(
                                        GroupQuizLiveService.EXTRA_URL,
                                        call.argument<String>("supabaseUrl"))
                                    .putExtra(
                                        GroupQuizLiveService.EXTRA_ANON_KEY,
                                        call.argument<String>("anonKey"))
                            ContextCompat.startForegroundService(context, intent)
                            result.success(null)
                        }
                        "stopService" -> {
                            context.stopService(
                                Intent(context, GroupQuizLiveService::class.java))
                            result.success(null)
                        }
                        else -> result.notImplemented()
                    }
                } catch (e: Exception) {
                    result.error("live_update_error", e.message, null)
                }
            }
    }
}
