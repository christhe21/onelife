# Real push reminders (web + Android)

Today reminders only fire while the app is open (a JS timer) or via local Android alarms. This adds true server-sent push so a reminder arrives even when the app is fully closed, on every device you've signed in on, using the existing "remind me X minutes before" setting.

## How it will work

```text
task scheduled  ->  reminder rows in the database
                      |
     cron every minute (server)
                      |
   finds reminders due now (start time - lead minutes)
                      |
        +-------------+-------------+
        |                           |
   Web Push (browser/PWA)     FCM (Android app)
```

## Pieces to build

### 1. Database

- `push_subscriptions` — one row per device: user, platform (`web` / `android`), endpoint or FCM token, keys, last seen. Owner-only access.
- `reminder_queue` — user, task/subtask id, title, body, `fire_at`, `sent_at`, dedupe key. Owner-only read; the scheduler writes with elevated rights.

### 2. Device registration

- A small `usePushRegistration` hook: asks for notification permission, registers the service worker, subscribes with the public VAPID key, and saves the subscription through a server function.
- In the Android shell, the same hook instead asks the Kotlin bridge for the FCM token and saves that.
- Settings gets a "Push reminders" row showing status (enabled / blocked / this device registered) with an enable button and a "send test notification" action.

### 3. Reminder queue sync

- Whenever tasks/subtasks change, the client syncs upcoming reminders (start time minus lead minutes, future only, not done) to `reminder_queue` via a server function that replaces that user's pending rows.
- Cancelling or completing a task removes its pending reminder.

### 4. Delivery

- Public endpoint `/api/public/hooks/send-reminders` — pulls due, unsent reminders, sends each to that user's devices, marks them sent, and deletes dead subscriptions (410/404 responses).
- Web Push signed with VAPID; Android via FCM HTTP v1.
- A `pg_cron` job calls it every minute with the project's public API key.

### 5. Service worker

- `public/sw-push.js` handling `push` (show notification) and `notificationclick` (focus/open the app on the relevant day). Registered only in production/standalone contexts, never in the editor preview iframe.

### 6. Android shell

- Add Firebase Messaging to the Gradle build, a `FirebaseMessagingService` that posts the notification on the existing reminder channel, and bridge methods `getPushToken()` / `onPushTokenRefresh` exposed to the WebView.
- Existing local AlarmManager reminders stay as an offline fallback, de-duplicated by reminder id so you don't get two notifications.

## What I need from you

- **Web push**: nothing — I'll generate a VAPID key pair and store the private key as a secret.
- **Android/FCM**: a Firebase project — specifically `google-services.json` for `com.onelife.app`, plus a service-account JSON for sending. Without these I'll ship the web push half fully working and leave the Android side wired but inactive until you provide them.

## Technical notes

- Web Push signing uses a Workers-compatible pure-JS/WebCrypto implementation (no `web-push` Node package, which doesn't run on the edge runtime).
- FCM HTTP v1 access tokens are minted from the service account via WebCrypto JWT signing inside the handler.
- Endpoint lives under `/api/public/*` and authenticates via the `apikey` header, per the cron pattern.
- Reminder rows carry a dedupe key so re-syncing never double-sends.

## Acceptance

- Enable push in Settings, close the app entirely, and a reminder still arrives at start time minus your lead minutes.
- The same reminder arrives once per device, not twice.
- Turning a task done or rescheduling it updates/cancels the pending reminder.
- "Send test notification" delivers immediately.
