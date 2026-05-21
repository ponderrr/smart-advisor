package live.smartadvisor.smart_advisor

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Posts Android 16 "Live Update" promoted-ongoing notifications via a
 * MethodChannel (`.../live_update`).
 *
 * `setRequestPromotedOngoing` asks the system to promote the notification
 * to a Live Update; it is a no-op on Android < 16, so the notification
 * still posts as an ordinary ongoing notification on older releases.
 *
 * Used for the group-quiz live activity — see NotificationService and
 * lib/features/notifications/live_update.dart on the Dart side.
 */
object LiveUpdateChannel {
    private const val CHANNEL = "live.smartadvisor.smart_advisor/live_update"
    private const val NOTIFICATION_CHANNEL = "live_updates"

    fun register(engine: FlutterEngine, context: Context) {
        MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                try {
                    when (call.method) {
                        "post" -> {
                            post(
                                context,
                                call.argument<Int>("id") ?: 0,
                                call.argument<String>("title") ?: "",
                                call.argument<String>("text") ?: "",
                                call.argument<String>("chip"),
                            )
                            result.success(null)
                        }
                        "cancel" -> {
                            NotificationManagerCompat.from(context)
                                .cancel(call.argument<Int>("id") ?: 0)
                            result.success(null)
                        }
                        else -> result.notImplemented()
                    }
                } catch (e: Exception) {
                    result.error("live_update_error", e.message, null)
                }
            }
    }

    private fun ensureChannel(context: Context) {
        val manager =
            context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(NOTIFICATION_CHANNEL) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    NOTIFICATION_CHANNEL,
                    "Live updates",
                    // A Live Update channel must not use IMPORTANCE_MIN.
                    NotificationManager.IMPORTANCE_DEFAULT,
                ).apply {
                    description = "Ongoing status for an active group quiz"
                },
            )
        }
    }

    @SuppressLint("MissingPermission")
    private fun post(
        context: Context,
        id: Int,
        title: String,
        text: String,
        chip: String?,
    ) {
        ensureChannel(context)
        val builder = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            // Ask the system to promote this to a Live Update (Android 16+).
            .setRequestPromotedOngoing(true)
        if (!chip.isNullOrEmpty()) {
            // The short status-bar chip while the notification is off-screen.
            builder.setShortCriticalText(chip)
        }
        val manager = NotificationManagerCompat.from(context)
        if (manager.areNotificationsEnabled()) {
            manager.notify(id, builder.build())
        }
    }
}
