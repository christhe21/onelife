# Architecture rules

- Enforce monthly focus scheduling in `app-data.tsx`; every calendar UI must use guarded data actions so alternate entry points cannot bypass the three-pillar limit.