# Living Garden Homepage

## Goal
Turn the homepage background into a calm monochrome garden that feels alive without distracting from the product or slowing the page.

## Visual direction
- Keep the existing monochrome light and dark themes, homepage content, typography, and product preview unchanged.
- Add layered botanical silhouettes along the lower edge and page sides, with different opacity and scale for depth.
- Leave clear negative space around headings, buttons, screenshots, and other interactive content.
- Use restrained field-guide-style leaves, grasses, stems, and small flowers rather than colorful or cartoon-like artwork.

## Butterfly behavior
- Replace fixed left-to-right tracks with multiple irregular curved paths moving in different directions.
- Give each butterfly independent speed, scale, altitude, wing rhythm, and pauses so they do not move as a synchronized group.
- Let some butterflies hover, circle, briefly settle near flowers or leaves, then take off again.
- Keep movement bounded to the garden area and prevent butterflies from lingering over important text or controls.

## Lifelike interactions
- Add very subtle foliage sway and occasional butterfly reactions near the pointer on devices that support precise pointing.
- Butterflies should gently veer away rather than snap, chase the pointer, or become a game.
- Touch devices will use autonomous garden movement without requiring interaction.
- Decorative elements remain excluded from keyboard navigation and screen readers.

## Motion and performance
- Use lightweight SVG/CSS layers and browser animation frames only where needed for varied flight behavior.
- Pause or reduce background activity when the page is hidden.
- Honor reduced-motion preferences with a static garden and resting butterflies.
- Keep the composition responsive across mobile and desktop, with fewer active butterflies on small screens.

## Validation
- Check the homepage in light and dark themes at mobile and desktop sizes.
- Confirm text contrast, button access, scrolling, and screenshots remain unobstructed.
- Verify random-looking motion, pointer avoidance, resting behavior, reduced motion, and clean runtime/build diagnostics.
