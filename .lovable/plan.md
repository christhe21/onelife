# OneLife official website

Turn the current `/home` screen into a proper marketing website — the public face of OneLife you can share with stakeholders — and move the workspace app to its own address.

## New URL structure

```text
/            Marketing home (hero, what it is, screenshots, CTA)
/about       Who builds OneLife, the philosophy, current status (free)
/features    Full feature breakdown: skills, goals, milestones, tasks, calendar, ranks
/app         The actual OneLife workspace (today's dashboard/tabs UI)
/app?onboarding=1  Onboarding wizard, launched from the marketing CTA
/home        Permanent redirect to /
/auth, /create-goal  unchanged
```

Anyone who had `/` bookmarked as the app lands on the marketing page with a prominent "Open the app" button, so nothing is lost.

## Marketing pages

Shared marketing chrome (used by all three pages):
- Sticky header: OneLife mark, links Home / Features / About, a GitHub icon link, and a primary "Open app" button. Mobile: compact menu.
- Footer: short blurb, page links, GitHub link, "Free to use", copyright.

**Home**
- Hero: headline, one-paragraph pitch, "Start free" (goes to onboarding) and "See features".
- What it is: 3-4 short cards answering "what problem does this solve".
- Real product screenshots (dashboard, calendar, mindmap overview) in a framed showcase.
- How it works: Skills → Goals → Milestones → Tasks → Calendar, as a simple 5-step strip.
- Closing CTA band: "Free to try. No cost, no catch."

**Features**
- Grouped sections with a screenshot or icon each: Planning hierarchy, Calendar & auto-scheduling, Mindmap overview, Ranks & points, Marketplace templates, Reminders, Themes, Export/Import and cloud sync.

**About**
- Positioning: built by a productivity practitioner focused on improving their own life and helping others do the same.
- Why OneLife exists, the approach, current status: free, open to try, feedback welcome.
- Links out: GitHub repo, "Open the app".

## Screenshots

I will capture real UI from the running app (dashboard, calendar month view, mindmap overview, rank ladder) at desktop and mobile sizes, frame them, and store them as project assets used across the marketing pages. Light theme, with representative sample content.

## Technical notes

- New route files: `src/routes/index.tsx` becomes the marketing home; the current workspace shell moves to `src/routes/app.tsx` (`/app`). `src/routes/home.tsx` becomes a redirect to `/`.
- New components under `src/components/marketing/`: `SiteHeader`, `SiteFooter`, `Hero`, `FeatureGrid`, `HowItWorks`, `ScreenshotFrame`, `CTABand`.
- The existing `Welcome`/onboarding component is kept and reached via `/app?onboarding=1`; the app's own redirect rule changes from "no onboarding → `/home`" to "no onboarding → onboarding step", so first-time users entering `/app` still get onboarded.
- Per-page `head()` metadata: unique title, description, og:title, og:description, og:image (hero screenshot), canonical on each leaf, plus `SoftwareApplication` JSON-LD on the home page.
- Marketing pages use existing semantic design tokens — no hardcoded colors — and are fully responsive.

## Open item

I need the GitHub repository URL to wire up the GitHub icon and contribute links. Tell me the URL and I will use it; otherwise I will leave the icon out until you provide it.
