# Architecture rules

- Enforce monthly focus scheduling in `app-data.tsx`; every calendar UI must use guarded data actions so alternate entry points cannot bypass the three-pillar limit.- The Life Editor (Overview map) must change real data only through app-data actions; board-only layout/shapes live in the `editor` snapshot slice.
