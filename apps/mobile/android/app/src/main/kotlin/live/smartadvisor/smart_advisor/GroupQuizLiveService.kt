package live.smartadvisor.smart_advisor

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL

/**
 * Foreground service that keeps the group-quiz Live Update fresh while
 * the app is backgrounded.
 *
 * It polls the Supabase REST API for the session + participants every
 * [POLL_MS] and re-posts a promoted (Android 16 Live Update) notification.
 * Because it runs as a foreground service it keeps polling even when the
 * Flutter UI is backgrounded — the Dart isolate would otherwise suspend.
 *
 * Started / stopped from Dart via LiveUpdateChannel.
 */
@SuppressLint("MissingPermission")
class GroupQuizLiveService : Service() {

    companion object {
        const val NOTIFICATION_ID = 71
        private const val CHANNEL_ID = "live_updates"
        private const val POLL_MS = 12_000L

        const val EXTRA_SESSION_ID = "sessionId"
        const val EXTRA_CODE = "code"
        const val EXTRA_URL = "supabaseUrl"
        const val EXTRA_ANON_KEY = "anonKey"
    }

    @Volatile private var running = false
    private var worker: Thread? = null

    private var sessionId = ""
    private var code = ""
    private var baseUrl = ""
    private var anonKey = ""

    private data class LiveState(
        val line: String,
        val chip: String?,
        val terminal: Boolean,
        val completed: Boolean,
    )

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: ""
        code = intent.getStringExtra(EXTRA_CODE) ?: ""
        baseUrl = (intent.getStringExtra(EXTRA_URL) ?: "").trimEnd('/')
        anonKey = intent.getStringExtra(EXTRA_ANON_KEY) ?: ""

        ensureChannel()
        startForegroundCompat(
            buildNotification("Group quiz · $code", "Starting…", null, true))

        if (!running && sessionId.isNotEmpty() && baseUrl.isNotEmpty()) {
            running = true
            worker = Thread { pollLoop() }.also { it.start() }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        running = false
        worker?.interrupt()
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID)
        super.onDestroy()
    }

    // ── Polling ────────────────────────────────────────────────────

    private fun pollLoop() {
        while (running) {
            try {
                val state = fetchState()
                if (state != null && state.terminal) {
                    if (state.completed) postFinal() else cancelNotification()
                    running = false
                    ServiceCompat.stopForeground(
                        this, ServiceCompat.STOP_FOREGROUND_DETACH)
                    stopSelf()
                    return
                } else if (state != null) {
                    update(buildNotification(
                        "Group quiz · $code", state.line, state.chip, true))
                }
                // A transient failure (state == null) keeps the last
                // notification and simply retries on the next tick.
            } catch (_: InterruptedException) {
                return
            } catch (_: Exception) {
                // Ignore and retry on the next tick.
            }
            try {
                Thread.sleep(POLL_MS)
            } catch (_: InterruptedException) {
                return
            }
        }
    }

    private fun fetchState(): LiveState? {
        val sessions = httpGet(
            "quiz_sessions?id=eq.$sessionId&select=status,max_participants")
            ?: return null
        if (sessions.length() == 0) return null
        val session = sessions.getJSONObject(0)
        val status = session.optString("status")
        val max = session.optInt("max_participants", 0)

        val parts = httpGet(
            "quiz_participants?session_id=eq.$sessionId" +
                "&select=answers_submitted_at") ?: return null
        val players = parts.length()
        var submitted = 0
        for (i in 0 until parts.length()) {
            if (!parts.getJSONObject(i).isNull("answers_submitted_at")) {
                submitted++
            }
        }
        return computeState(status, players, max, submitted)
    }

    private fun computeState(
        status: String,
        players: Int,
        max: Int,
        submitted: Int,
    ): LiveState = when (status) {
        "lobby" ->
            if (max > 0 && players >= max) {
                LiveState("Lobby full — starting soon", "Full", false, false)
            } else {
                LiveState(
                    "Waiting for players — $players of $max joined",
                    "$players/$max", false, false)
            }
        "in_progress" ->
            if (players > 0 && submitted >= players) {
                LiveState(
                    "Everyone's finished — results coming up",
                    "Done", false, false)
            } else {
                LiveState(
                    "Quiz in progress — $submitted of $players finished",
                    "$submitted/$players", false, false)
            }
        "completed" ->
            LiveState("Quiz complete — results are in", "Done", true, true)
        "cancelled" ->
            LiveState("Session cancelled", null, true, false)
        else ->
            LiveState("Quiz in progress", null, false, false)
    }

    // ── HTTP ───────────────────────────────────────────────────────

    private fun httpGet(path: String): JSONArray? {
        val conn = URL("$baseUrl/rest/v1/$path")
            .openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = "GET"
            conn.connectTimeout = 8_000
            conn.readTimeout = 8_000
            conn.setRequestProperty("apikey", anonKey)
            conn.setRequestProperty("Authorization", "Bearer $anonKey")
            conn.setRequestProperty("Accept", "application/json")
            if (conn.responseCode in 200..299) {
                JSONArray(conn.inputStream.bufferedReader().readText())
            } else {
                null
            }
        } finally {
            conn.disconnect()
        }
    }

    // ── Notifications ──────────────────────────────────────────────

    private fun ensureChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Live updates",
                    // A Live Update channel must not use IMPORTANCE_MIN.
                    NotificationManager.IMPORTANCE_DEFAULT,
                ).apply {
                    description = "Ongoing status for an active group quiz"
                },
            )
        }
    }

    private fun buildNotification(
        title: String,
        text: String,
        chip: String?,
        ongoing: Boolean,
    ): Notification {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setOngoing(ongoing)
            .setOnlyAlertOnce(true)
            .setContentIntent(openAppIntent())
        if (ongoing) {
            // Ask the system to promote it to a Live Update (Android 16+).
            builder.setRequestPromotedOngoing(true)
        } else {
            builder.setAutoCancel(true)
        }
        if (!chip.isNullOrEmpty()) {
            builder.setShortCriticalText(chip)
        }
        return builder.build()
    }

    private fun openAppIntent(): PendingIntent {
        val launch = packageManager.getLaunchIntentForPackage(packageName)
            ?.apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            }
        return PendingIntent.getActivity(
            this, 0, launch,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    private fun startForegroundCompat(notification: Notification) {
        val type = if (Build.VERSION.SDK_INT >= 29) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        } else {
            0
        }
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type)
    }

    private fun update(notification: Notification) {
        val manager = NotificationManagerCompat.from(this)
        if (manager.areNotificationsEnabled()) {
            manager.notify(NOTIFICATION_ID, notification)
        }
    }

    /** A dismissible "results are in" notification once the quiz ends. */
    private fun postFinal() {
        update(
            buildNotification(
                "Group quiz · $code",
                "Quiz complete — tap to see the results",
                null,
                false,
            ),
        )
    }

    private fun cancelNotification() {
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID)
    }
}
