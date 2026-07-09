package com.onelife.app

import org.json.JSONArray

data class Reminder(
    val id: String,
    val title: String,
    val body: String,
    val triggerAtMillis: Long,
)

/**
 * Parses the payload of `AndroidBridge.scheduleNotifications` — a JSON array of
 * `{ id, title, body, triggerAtMillis }` produced by `src/lib/native-bridge.ts`.
 * Malformed entries are skipped rather than failing the whole batch.
 */
object ReminderParser {
    fun parse(json: String): List<Reminder> {
        val result = mutableListOf<Reminder>()
        val array = try {
            JSONArray(json)
        } catch (_: Exception) {
            return emptyList()
        }
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            val id = obj.optString("id")
            val title = obj.optString("title")
            val triggerAtMillis = obj.optLong("triggerAtMillis", -1L)
            if (id.isEmpty() || title.isEmpty() || triggerAtMillis <= 0) continue
            result.add(
                Reminder(
                    id = id,
                    title = title,
                    body = obj.optString("body"),
                    triggerAtMillis = triggerAtMillis,
                ),
            )
        }
        return result
    }

    fun toJson(reminders: List<Reminder>): String {
        val array = JSONArray()
        for (r in reminders) {
            array.put(
                org.json.JSONObject()
                    .put("id", r.id)
                    .put("title", r.title)
                    .put("body", r.body)
                    .put("triggerAtMillis", r.triggerAtMillis),
            )
        }
        return array.toString()
    }
}
