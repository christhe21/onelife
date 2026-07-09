package com.onelife.app

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationCompat

/**
 * Injected into the WebView as `window.AndroidBridge`. Method signatures must
 * stay in sync with `AndroidBridgeApi` in `src/lib/native-bridge.ts`.
 *
 * Called on the WebView's JS bridge thread — anything touching the Activity UI
 * is dispatched via [MainActivity.runOnUiThread].
 */
class AndroidBridge(private val activity: MainActivity) {

    private val scheduler = NotificationScheduler(activity.applicationContext)

    @JavascriptInterface
    fun saveFile(filename: String, mimeType: String, content: String) {
        activity.runOnUiThread { activity.launchSaveFile(filename, mimeType, content) }
    }

    @JavascriptInterface
    fun getNotificationPermission(): String = activity.notificationPermissionState()

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.runOnUiThread { activity.requestNotificationPermission() }
    }

    @JavascriptInterface
    fun showNotification(title: String, body: String) {
        val context = activity.applicationContext
        val tapIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, OneLifeApp.REMINDER_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(tapIntent)
            .build()
        try {
            context.getSystemService(NotificationManager::class.java)
                .notify(IMMEDIATE_NOTIFICATION_ID, notification)
        } catch (_: SecurityException) {
            // Permission revoked between check and notify — ignore.
        }
    }

    @JavascriptInterface
    fun scheduleNotifications(payloadJson: String) {
        scheduler.replaceAll(ReminderParser.parse(payloadJson))
    }

    @JavascriptInterface
    fun cancelScheduledNotifications() {
        scheduler.cancelAll()
    }

    companion object {
        const val JS_NAME = "AndroidBridge"
        private const val IMMEDIATE_NOTIFICATION_ID = 1
    }
}
