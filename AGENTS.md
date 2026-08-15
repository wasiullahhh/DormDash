# DormDash — Agent Context

Campus-only marketplace PWA for dorm move-in/move-out. Students swipe
through listings (Tinder-style), curated by Gemini based on their stated
interests. Built for a hackathon; optimized for speed and a small team
editing in parallel, not for long-term scale.

Read this before making changes — it covers what exists, what's
deliberately stubbed, and constraints that aren't obvious from the code.

## Stack & hard constraints

- **React + Vite**, plain JS (no TS). Mobile-first responsive web app
  (PWA), not React Native.
- **Styling**: plain CSS with CSS custom properties. No Tailwind, no
  component library. Every component owns a co-located `.css` file.
- **No router.** Navigation is local `useState` tab-switching in
  `App.jsx`, not react-router. Keep it that way unless asked — the app
  is five flat screens plus one modal, a router is unneeded weight.
- **Data**: Supabase (Postgres/Auth/Storage) is the target backend, but
  **not wired up yet** — see "Current state" below.
- **AI**: Gemini API, planned for vision (photo → structured listing),
  text cleanup (voice-to-text → description), and ranking
  (personalized swipe feed via structured JSON / function calling).
- **Do not add a new npm dependency without asking first.** This was an
  explicit instruction from the project owner. That includes routing,
  animation, and icon libraries — the swipe gestures and icon set are
  hand-rolled specifically to avoid them.

## Repo structure

```
src/
  main.jsx              — entry, wraps <App> in <SessionProvider>
  App.jsx                — tab state + routes to the 5 pages, renders
                            BottomNav and the ListingDetailPage modal
  context/
    SessionContext.jsx   — the app's only global state: user, listings,
                            dormScope, swipeHistory, savedListingIds.
                            useSession() hook. This is what "no prop
                            drilling" refers to in the original brief.
  lib/
    mockData.js           — CURRENT_USER, MOCK_LISTINGS, DORMS, CATEGORIES
    gemini.js              — stubbed AI functions (see below)
    supabase.js            — config placeholder, NOT initialized
  components/             — shared, reusable across pages
    SwipeCard/             — the signature drag-to-swipe card
    ListingPhoto/           — colored placeholder standing in for real photos
    ListingGridItem/         — grid tile used by MyDorm + Saved pages
    BottomNav/, Header/, icons/Icons.jsx (hand-drawn SVG icon set)
  pages/                   — one folder per screen, co-located CSS
    SwipeFeedPage, MyDormPage, PostItemPage, SavedPage,
    ProfilePage, ListingDetailPage
  styles/tokens.css        — design tokens, imported by index.css
```

## Design system (kraft / shipping-label aesthetic)

No mockup file was ever committed to this repo — the visual language
was built directly from the written brief, not ported from HTML. If a
`dormdash_mockup.html` shows up later, treat it as the source of truth
and reconcile `tokens.css` against it.

- **Palette** (`src/styles/tokens.css`): `--color-kraft*` (cream/kraft
  background), `--color-navy*` (text, nav, headers), `--color-forest*`
  (primary actions — "want it", sustainability), `--color-stamp*`
  (orange — pass/urgency only, never primary).
- **Type**: Oswald (`--font-display`, headings/stamps), Inter
  (`--font-body`), Space Mono (`--font-mono`, prices/dorm codes/meta —
  the "barcode" text). Loaded via Google Fonts `<link>` in `index.html`.
- **Signature element**: `SwipeCard` — ticket-notch circles on the left/
  right edges, a dashed `.perforation` divider, a rotated `.stamp-badge`
  category tag, and the drag-triggered "Kept on Campus" / "Passed"
  stamp overlays. Reuse `.stamp-badge`, `.perforation`, and
  `.meta-text` utility classes (defined in `index.css`) rather than
  re-implementing this look elsewhere.
- Listings have no real photos yet — `ListingPhoto` renders a colored
  placeholder block with a printed-label look. Swap its internals for
  a real `<img>` once Storage is wired up; keep the component's props
  contract (`tone`, `label`) so callers don't need to change.

## Current state — what's real vs. stubbed

- All data is in-memory mock data (`lib/mockData.js`), held in
  `SessionContext`. Posting an item, swiping, and saving all mutate
  local React state only — nothing persists across a reload.
- `lib/gemini.js` exports `curateListings`, `parseListingFromPhoto`,
  `generateDigest` — all stubbed with `setTimeout` latency and
  deterministic mock logic, but with the **real intended return
  shapes** (structured JSON, matching what function-calling output
  should look like). Wire real Gemini calls by replacing the function
  bodies; keep the signatures and return shapes so the UI doesn't need
  to change.
- `lib/supabase.js` only exports a `supabaseConfig` object read from
  `import.meta.env`. `createClient` is **not called** — the
  `@supabase/supabase-js` package isn't even installed yet. Do that as
  its own step, then export the Supabase client and swap
  `SessionContext`'s mock state for Supabase reads/writes.
- `.env.example` lists the expected Supabase + Gemini env vars.
  `.env` itself is gitignored — never commit real keys.

## Known gotcha: pointer capture in SwipeCard

`SwipeCard.jsx` deliberately does **not** call `setPointerCapture` on
`pointerdown`. It waits until the drag has moved past
`DRAG_ENGAGE_DISTANCE` (in `pointermove`) before capturing. Capturing
immediately on `pointerdown` was tried first and broke tapping the
card's info button — once an element has pointer capture, the browser
retargets the trailing `pointerup`/`click` to the capturing element
instead of whatever was actually tapped, so short taps stopped
reaching child buttons entirely (confirmed with real Playwright mouse
events, not just synthetic `.click()`). If you touch the drag logic,
keep this "only capture once a real drag starts" behavior, or taps
will silently break again.

## Not built yet (next steps, roughly in order)

1. Install `@supabase/supabase-js`, create a Supabase client, and wire
   Supabase Auth restricted to the campus `.edu` domain
   (`ALLOWED_EMAIL_DOMAIN` in `lib/supabase.js` is a placeholder).
2. Replace `SessionContext`'s mock listings/user with Supabase
   reads/writes; keep the same context shape so pages don't change.
3. Wire real Supabase Storage upload in `PostItemPage` (currently just
   does `URL.createObjectURL` for a local preview).
4. Replace the three `lib/gemini.js` stub bodies with real Gemini API
   calls (vision for photo→listing, text cleanup, ranking).
5. Match/meetup chat flow after a mutual "want it" — not built at all
   yet, out of scope for the shells phase.
6. Periodic "you might want this" digest surfacing
   (`generateDigest` exists as a stub but nothing calls it yet).

## Running it

```
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run lint      # oxlint
```
