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
- **Data**: Supabase. Auth (email/password, sign-up + sign-in) is wired
  and live against a real project. Firestore-equivalent data (listings,
  profiles) is still mock/local state — see "Current state" below.
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
    mockData.js           — MOCK_LISTINGS, DORMS, CATEGORIES (no more
                            mock CURRENT_USER — the signed-in user now
                            comes from Supabase Auth)
    gemini.js              — stubbed AI functions (see below)
    supabase.js            — live client (createClient + ALLOWED_EMAIL_DOMAIN)
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

- **Auth is real.** `src/lib/supabase.js` exports a live client
  (`createClient` against a real project — `.env` has real keys, don't
  print/log its contents). `SessionContext.jsx` calls
  `supabase.auth.signUp` / `signInWithPassword` / `signOut`, restores
  the session on load via `getSession()`, and stays in sync via
  `onAuthStateChange`. Sign-up/sign-in are gated client-side to
  `@my.centennialcollege.ca` emails (`ALLOWED_EMAIL_DOMAIN` in
  `lib/supabase.js` — also enforce this server-side via a Supabase Auth
  Hook before this goes anywhere near production). This project has
  **email confirmation enabled**, so a fresh sign-up won't get a
  session until the user clicks the confirmation link — `registerUser`
  returns `{ success: false, error: "...check your email..." }` in
  that case, it's not a bug.
- **User profile fields are NOT persisted.** Supabase Auth only knows
  email/password/metadata. `toAppUser()` in `SessionContext.jsx`
  defaults `dorm`, `room`, `interests`, `sustainabilityScore` to
  empty/zero on every session — there's no `profiles` table yet. If
  you build one, hydrate from it there instead of defaulting.
- **Listings are still in-memory mock data** (`lib/mockData.js`), held
  in `SessionContext`. Posting an item, swiping, and saving all mutate
  local React state only — nothing persists across a reload.
- `lib/gemini.js` exports `curateListings`, `parseListingFromPhoto`,
  `generateDigest` — all stubbed with `setTimeout` latency and
  deterministic mock logic, but with the **real intended return
  shapes** (structured JSON, matching what function-calling output
  should look like). Wire real Gemini calls by replacing the function
  bodies; keep the signatures and return shapes so the UI doesn't need
  to change.
- `.env.example` lists the expected Supabase + Gemini env vars.
  `.env` itself is gitignored and has real Supabase keys in it locally
  — never commit it, never echo its contents into a commit message,
  issue, or chat log.

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

1. ~~Wire Supabase Auth~~ — done, see "Current state" above.
2. Create a `profiles` table (dorm, room, interests, sustainabilityScore)
   keyed on `auth.uid()`, and hydrate/update it from `ProfilePage`
   instead of defaulting those fields every session.
3. Replace `SessionContext`'s mock listings with a Supabase `listings`
   table (reads/writes); keep the same context shape so pages don't
   change.
4. Wire real Supabase Storage upload in `PostItemPage` (currently just
   does `URL.createObjectURL` for a local preview).
5. Replace the three `lib/gemini.js` stub bodies with real Gemini API
   calls (vision for photo→listing, text cleanup, ranking).
6. Match/meetup chat flow after a mutual "want it" — not built at all
   yet, out of scope for the shells phase.
7. Periodic "you might want this" digest surfacing
   (`generateDigest` exists as a stub but nothing calls it yet).

## Running it

```
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run lint      # oxlint
```
