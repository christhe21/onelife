package com.onelife.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Covers the JSON contract between `src/lib/native-bridge.ts`
 * (nativeScheduleNotifications) and the Kotlin scheduler.
 */
class ReminderParserTest {

    @Test
    fun `parses a valid payload`() {
        val json = """
            [
              {"id":"t1","title":"Upcoming: Run","body":"In 10 min · Get fit","triggerAtMillis":1900000000000},
              {"id":"t2","title":"Upcoming: Read","body":"Starts soon","triggerAtMillis":1900000600000}
            ]
        """.trimIndent()

        val reminders = ReminderParser.parse(json)

        assertEquals(2, reminders.size)
        assertEquals(Reminder("t1", "Upcoming: Run", "In 10 min · Get fit", 1900000000000L), reminders[0])
        assertEquals(Reminder("t2", "Upcoming: Read", "Starts soon", 1900000600000L), reminders[1])
    }

    @Test
    fun `skips malformed entries instead of failing the batch`() {
        val json = """
            [
              {"id":"ok","title":"Valid","body":"b","triggerAtMillis":1900000000000},
              {"title":"missing id","triggerAtMillis":1900000000000},
              {"id":"no-title","triggerAtMillis":1900000000000},
              {"id":"no-time","title":"t"},
              {"id":"bad-time","title":"t","triggerAtMillis":-5},
              "not an object",
              42
            ]
        """.trimIndent()

        val reminders = ReminderParser.parse(json)

        assertEquals(1, reminders.size)
        assertEquals("ok", reminders[0].id)
    }

    @Test
    fun `missing body defaults to empty string`() {
        val reminders = ReminderParser.parse(
            """[{"id":"t","title":"Title","triggerAtMillis":1900000000000}]""",
        )
        assertEquals("", reminders[0].body)
    }

    @Test
    fun `returns empty list for invalid json`() {
        assertTrue(ReminderParser.parse("not json").isEmpty())
        assertTrue(ReminderParser.parse("{}").isEmpty())
        assertTrue(ReminderParser.parse("").isEmpty())
    }

    @Test
    fun `returns empty list for empty array`() {
        assertTrue(ReminderParser.parse("[]").isEmpty())
    }

    @Test
    fun `toJson round-trips through parse`() {
        val original = listOf(
            Reminder("a", "Title A", "Body A", 1900000000000L),
            Reminder("b", "Title B", "", 1900000600000L),
        )

        val roundTripped = ReminderParser.parse(ReminderParser.toJson(original))

        assertEquals(original, roundTripped)
    }
}
