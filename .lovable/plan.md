# New rank marks: soldier helmet to king's crown

Replace the nine existing rank SVGs with a fresh, hand-authored set that reads as a clear military hierarchy — a plain soldier's helmet at Beginner, growing in detail and ornament, ending in a king's crown at One.

## Visual progression

Each mark is a monochrome outline drawing on the same 64x64 canvas, same optical weight and footprint, so the ladder looks like one family:

1. Beginner — plain rounded skull cap, single brow band.
2. Intermediate — cap with nose guard and a rivet.
3. Advanced — cheek guards added, reinforced crest line.
4. Professional — short crest ridge, one chevron on the brow band.
5. Master — full plume crest, two chevrons.
6. Grandmaster — tall plume, visor slits, laurel starting at the base.
7. Epic — winged side ornaments, star above the crest.
8. Legendary — full laurel wreath framing the helmet, star and crest peak.
9. One — king's crown replacing the helmet: five points, jewels, base band.

Style rules kept from the current set so nothing else changes visually: `stroke="currentColor"`, no fills except tiny jewel/rivet dots, round caps and joins, stroke widths 1.2–2, centered subject with consistent margins.

## Files

- Overwrite the nine files in `public/ranks/`: `beginner.svg`, `intermediate.svg`, `advanced.svg`, `professional.svg`, `master.svg`, `grandmaster.svg`, `epic.svg`, `legendary.svg`, `one.svg`.
- No change to `src/components/life/RankIcon.tsx`, the ladder, the dialog, or any rank logic — the filename map already points at these paths and dark-mode inversion keeps working.

## Verification

Open the rank ladder modal at mobile width and scroll the strip to confirm all nine render, sit at the same size, and read as an escalating hierarchy in both light and dark themes.
