# Architecture rules

- Enforce monthly focus scheduling in `app-data.tsx`; every calendar UI must use guarded data actions so alternate entry points cannot bypass the three-pillar limit.- The Life Editor (Overview map) must change real data only through app-data actions; board-only layout/shapes live in the `editor` snapshot slice.
- Voice assistant actions run in the browser through `applyAssistantAction` (src/lib/assistant-actions.ts) on app-data actions; every new data action must be registered in `ASSISTANT_TOOLS` there (the relay builds its tools from it), and Settings stay excluded.
