# Floating Voice Assistant + Suggestions

## What you get
- An animated floating bubble at the bottom-right of every app screen (gentle pulse/breathing animation).
- Tap it to open **Voice mode**: a panel with a big mic button, live captions of what you and the assistant say, and an "End" button. You can also type instead of speaking.
- The assistant can **create and change your data** by voice, e.g. "Add a goal to learn Java by March", "Add a task 'read chapter 3' under English", "Add the book Atomic Habits", "Log a reading session", "Mark today's walk done". It reads back what it did and asks before deleting anything.
- It respects your rules: the three-focus-pillar limit, Health always active, and Survival Mode stays AI-free (bubble hidden there).
- **Hide option**: a "Hide" button tucks the bubble into a small tab on the screen edge; tap the tab to bring it back. Also a toggle in Settings → Assistant to show/hide it. Your choice is remembered.
- **Suggestions**: a "Send a suggestion" action in the panel (and by voice: "I have a suggestion…"). Suggestions are saved and emailed to learn.christyjose.in@gmail.com.

## Email note
Sending email from the app needs a domain you own (e.g. notify@christyjose.in). If none is set up yet, suggestions are still saved and you'll get a setup prompt; emails start once the domain is verified.

## Technical details
- Live voice via Lovable AI Gateway (`openai/gpt-live-1`, client delegation) following the live-voice skill: `src/lib/live-relay.server.ts`, `src/hooks/use-live-voice.ts`, `live-vite-plugin.ts`; backend model `openai/gpt-6-astra` with tools.
- Tools (create_goal, create_task, create_milestone, create_skill, add_book, log_reading, complete_task, update_item, send_suggestion) are returned to the browser and executed through existing `app-data.tsx` actions, so focus-limit guards apply and data syncs as today.
- New `AssistantFloater.tsx` mounted in `AppShell`; hidden on `/survival`; visibility stored in the synced snapshot.
- Suggestions: new `suggestions` table (user_id, text, created_at, RLS own-rows) + app email template "suggestion" sent to the fixed address via the app email service.
- Tests: tool → app-data action mapping, and focus-limit block via voice-created tasks.
