package com.onelife.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Schedules reminder alarms with AlarmManager so notifications fire even while
 * the WebView is backgrounded (its JS timers are paused then). The active set
 * is persisted so it can be cancelled wholesale and re-registered after boot.
 */
class NotificationScheduler(private val context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val alarmManager = context.getSystemService(AlarmManager::class.java)

    /** Replaces every scheduled reminder with the given batch. */
    fun replaceAll(reminders: List<Reminder>) {
        cancelAll()
        val now = System.currentTimeMillis()
        val future = reminders.filter { it.triggerAtMillis > now }
        for (reminder in future) {
            schedule(reminder)
        }
        prefs.edit().putString(KEY_ACTIVE, ReminderParser.toJson(future)).apply()
    }

    fun cancelAll() {
        for (reminder in activeReminders()) {
            pendingIntent(reminder)?.let { alarmManager.cancel(it) }
        }
        prefs.edit().remove(KEY_ACTIVE).apply()
    }

    /** Called from BootReceiver — alarms don't survive a reboot. */
    fun rescheduleAfterBoot() {
        replaceAll(activeReminders())
    }

    private fun activeReminders(): List<Reminder> =
        ReminderParser.parse(prefs.getString(KEY_ACTIVE, null) ?: "[]")

    private fun schedule(reminder: Reminder) {
        val pi = pendingIntent(reminder) ?: return
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            alarmManager.canScheduleExactAlarms()
        if (canExact) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP, reminder.triggerAtMillis, pi,
            )
        } else {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP, reminder.triggerAtMillis, pi,
            )
        }
    }

    private fun pendingIntent(reminder: Reminder): PendingIntent? {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_REMINDER
            putExtra(EXTRA_ID, reminder.id)
            putExtra(EXTRA_TITLE, reminder.title)
            putExtra(EXTRA_BODY, reminder.body)
            // Distinguishes intents so alarms for different tasks don't collide.
            data = android.net.Uri.parse("onelife://reminder/${reminder.id}")
        }
        return PendingIntent.getBroadcast(
            context,
            reminder.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        private const val PREFS_NAME = "onelife_reminders"
        private const val KEY_ACTIVE = "active"
        const val ACTION_REMINDER = "com.onelife.app.REMINDER"
        const val EXTRA_ID = "reminder_id"
        const val EXTRA_TITLE = "reminder_title"
        const val EXTRA_BODY = "reminder_body"
    }
}
