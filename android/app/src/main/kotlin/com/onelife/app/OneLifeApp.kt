package com.onelife.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager

class OneLifeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            REMINDER_CHANNEL_ID,
            "Task reminders",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Reminders before scheduled tasks start"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        const val REMINDER_CHANNEL_ID = "task_reminders"
    }
}
