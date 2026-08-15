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
- **Data**: Supabase. Auth, profiles (`users`), buildings, and listings
  are all live against a real project — see "Current state" below for
  what's still local-only (swipe/save state, chat, moderation, impact
  tracking).
- **AI**: Gemini API (`gemini-flash-latest`, raw `fetch` — no SDK
  dependency added). Use the `-latest` alias, not a pinned version —
  Google deprecated `gemini-2.5-flash`/`gemini-2.5-flash-lite` for new
  API keys within the same day this project's key was created, even
  though both still show up in the `models.list` endpoint. `curateListings`
  (ranking) and `parseListingFromPhoto` (vision + text → structured
  listing) are live, both using `responseSchema` for structured JSON
  output. `generateDigest` is still a stub, see "Current state". The API
  key is bundled into client JS (no backend to hide it behind) — see the
  security note atop `lib/gemini.js` before extending this further.
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
    SessionContext.jsx   — the app's only global state: user (auth
                            identity), profile (public.users row),
                            profileComplete, saveProfile, buildings
                            (real), listings (real, see mapListingRow),
                            refreshListings, dormScope, swipeHistory,
                            savedListingIds (still local-only, see
                            Current state). useSession() hook. This is
                            what "no prop drilling" refers to in the
                            original brief.
  lib/
    mockData.js           — just CATEGORIES + two empty local-state
                            seeds now (MOCK_SWIPE_HISTORY,
                            MOCK_SAVED_LISTING_IDS). DORMS and
                            MOCK_LISTINGS were removed once real
                            `buildings`/`listings` replaced them —
                            don't reintroduce fake dorm-name strings,
                            use `SessionContext.buildings` instead.
    gemini.js              — curateListings/parseListingFromPhoto are
                            live (see below); generateDigest still stubbed
    supabase.js            — live client (createClient + ALLOWED_EMAIL_DOMAIN).
                            Env var is VITE_SUPABASE_PUBLISHABLE_KEY, not
                            the older VITE_SUPABASE_ANON_KEY naming.
  components/             — shared, reusable across pages
    SwipeCard/             — the signature drag-to-swipe card
    ListingPhoto/           — colored placeholder standing in for real photos
    ListingGridItem/         — grid tile used by MyDorm + Saved pages
    BottomNav/, Header/, icons/Icons.jsx (hand-drawn SVG icon set)
  pages/                   — one folder per screen, co-located CSS
    OnboardingPage          — mandatory post-signup gate, see Current state
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
- `ListingPhoto` now renders a real `<img>` when a listing has a photo
  (`src` prop, from Supabase Storage). Falls back to the colored
  placeholder + `tone`/`label` look for listings without one — that
  placeholder scheme isn't going away, it's the permanent no-photo state,
  not a temporary stand-in anymore.

## Database schema (Supabase Postgres)

This is the real, full schema the project owner designed — the app only
uses a fraction of it so far (see "Current state"). All PKs are `uuid`.
**Note the naming: `users.user_id` is the PK, not `id`** — this bit us
once already (PostgREST error "column users.id does not exist"); don't
reintroduce `id` for this table anywhere.

- **`buildings`** — `building_id` (PK), `name`, `address`, `created_at`.
  Public reference data, no RLS. Seeded manually via SQL, not through
  the app.
- **`users`** — `user_id` (PK, FK → `auth.users.id`), `full_name`
  (**not** `name`), `email`, `student_id_number`, `student_id_photo_url`,
  `verification_status` (default `'pending'`), `building_id` (FK →
  `buildings`), `room_number`, `phone_number`, `rating` (default `0`),
  `is_active` (default `true`), `created_at`. RLS on, policies:
  authenticated can SELECT all rows, INSERT/UPDATE only their own
  (`auth.uid() = user_id`).
- **`listings`** — `listing_id` (PK), `seller_id` (FK → `users`),
  `title`, `description`, `category`, `price`, `is_free`, `condition`,
  `photos` (`text[]`), `building_id` (FK → `buildings`), `status`
  (default `'available'`), `pickup_location`, `created_at`, `expires_at`.
- **`requests`** — `request_id` (PK), `listing_id` (FK → `listings`),
  `buyer_id` (FK → `users`), `status` (default `'pending'`),
  `created_at`, `updated_at`. This is the real "want it" / match
  mechanism once wired — maps to what `recordSwipe`/`savedListingIds`
  currently fake in local state.
- **`messages`** — `message_id` (PK), `request_id` (FK → `requests`),
  `sender_id` (FK → `users`), `content`, `created_at`. The chat flow
  mentioned in "Not built yet" below.
- **`reports`** — `report_id` (PK), `reported_by` (FK → `users`),
  `listing_id` (FK → `listings`), `reason`, `status` (default `'open'`),
  `created_at`. Moderation — not touched by the app at all yet.
- **`impact_log`** — `log_id` (PK), `request_id` (FK → `requests`),
  `weight_diverted_estimate`, `dollar_value_estimate`, `building_id`
  (FK → `buildings`), `created_at`. The sustainability-tracking
  differentiator from the original brief — not touched yet.

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
- **User profile sync to `public.users` is real.** `SessionContext.jsx`'s
  `establishSession()` upserts `{ user_id, email }` on every sign-in/
  sign-up/restored-session (`syncUserRow`), then loads the full row into
  `profile`. `OnboardingPage` is a **mandatory gate** in `App.jsx` shown
  whenever `profile.full_name` is empty — `profileComplete` in
  `SessionContext` is literally `Boolean(profile?.full_name)`.
  `saveProfile({ name, building, phone })` writes `full_name`/
  `building_id`/`phone_number` and self-heals if a column turns out not
  to exist (drops just that key, keeps the rest, and for `full_name`
  specifically falls back to Auth `user_metadata` so nothing's lost).
  **Deliberately not collected in onboarding**: `room_number` (product
  decision — "too invasive", not a schema limitation; the column exists
  and is fine to use elsewhere) and `student_id_number`/
  `student_id_photo_url`/`verification_status` (a separate ID-
  verification feature, needs Storage for the photo, not built).
- **`buildings` is real.** Loaded once on mount in `SessionContext`
  (`buildings` state, public read, no auth needed) and used by the
  dorm picker in both `OnboardingPage` and `ProfilePage` — they submit
  a real `building_id` uuid, not a text name.
- **Listings are real, end to end.** `PostItemPage` writes rows straight
  to the `listings` table (photo → `listing-images` Storage bucket first,
  then insert with `seller_id`/`building_id`/`pickup_location` from the
  signed-in user's real profile). `SessionContext`'s `refreshListings()`
  fetches `listings` joined with `seller:users!seller_id(full_name)` and
  `building:buildings!building_id(name)`, filtered to `status = 'available'`,
  and maps each row through `mapListingRow()` into the same shape the UI
  always expected (`id`, `dorm`, `room`, `seller.name`, `photoTone`/
  `photoLabel` as a no-photo fallback, etc.) — this is why
  `SwipeFeedPage`/`MyDormPage`/`SavedPage`/`ListingDetailPage` needed
  almost no changes. Runs once on mount and again after `PostItemPage`
  successfully inserts, so a freshly-posted item shows up without a
  reload. `dormScope === "mine"` filtering compares `listing.buildingId`
  against `profile.building_id` (a real uuid) — not a name string.
  **Caveat**: the `seller` embed only resolves for an authenticated
  request — the `users` RLS policy grants SELECT `to authenticated` only,
  not `anon`. The live app always has a session once past login, so this
  should be fine, but if seller names ever show as the "A student"
  fallback in the actual app (not just an unauthenticated test script),
  that RLS assumption is the first thing to check.
  Swiping/saving (`recordSwipe`/`savedListingIds`) are still local-state
  only — that's `requests` table wiring, a separate "Not built yet" item.
  `tags` are always `[]` for real listings — `PostItemPage`'s insert
  doesn't send any (there's no `tags` column on `listings`).
- **Gemini is live for two of three functions.** `curateListings` and
  `parseListingFromPhoto` call the real API (see `lib/gemini.js` and the
  "AI" bullet above). `generateDigest` is still the original stub —
  nothing calls it yet either way.
- `.env.example` lists the expected Supabase + Gemini env vars.
  `.env` itself is gitignored and has real Supabase + Gemini keys in it
  locally — never commit it, never echo its contents into a commit
  message, issue, or chat log.

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

## Known gotcha: Gemini model names go stale fast

Don't hardcode a specific Gemini model version (`gemini-2.5-flash`,
etc.) from memory/training data — check `models.list` (or just use an
alias) instead. Confirmed firsthand: `gemini-2.5-flash` and
`gemini-2.5-flash-lite` both 404 with "no longer available to new
users" on a freshly-created API key, despite both still being returned
by the `models.list` endpoint (which apparently doesn't filter by
new-user eligibility). `lib/gemini.js` uses `gemini-flash-latest` — an
alias Google maintains to point at whatever the current recommended
flash model is — specifically to avoid this. Keep using an alias here
rather than pinning a version again.

## Not built yet (next steps, roughly in order)

1. ~~Wire Supabase Auth~~ — done, see "Current state" above.
2. ~~Sync profile fields to a real table~~ — done (`public.users`, see
   "Current state" and "Database schema" above).
3. ~~Fix the listings split-brain~~ — done, see "Current state" above.
4. Wire the real "want it" flow to the `requests` table instead of
   local `recordSwipe`/`savedListingIds` state.
5. ~~Wire real Supabase Storage upload in PostItemPage~~ — done
   (`listing-images` bucket).
6. ~~Replace the Gemini stub bodies with real API calls~~ — done for
   `curateListings`/`parseListingFromPhoto`. `generateDigest` is still
   a stub (see "Current state").
7. Match/meetup chat flow after a mutual "want it" — `messages` table
   exists, nothing built against it yet.
8. Periodic "you might want this" digest surfacing — wire
   `generateDigest` to real Gemini (still a stub) and call it from
   somewhere; nothing invokes it today.
9. ID verification flow (`student_id_number`/`student_id_photo_url`/
   `verification_status` on `users`) — needs a Storage bucket for the
   photo upload, not started.
10. Sustainability impact tracking (`impact_log` table) — the
    landfill-diversion differentiator from the original brief, not
    started.

## Running it

```
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run lint      # oxlint
```
