# Decisions Log

A running record of significant technical and design decisions, with the alternatives rejected.
Newest entries at the bottom.

---

## D1. Repository name: `Oxygene-Assessment`

- **Decision:** GitHub repo is `Oxygene-Assessment` (public). "Oxygene Assessment" is the display title.
- **Why:** Git hosts don't allow spaces in repo names. Public so judges can read the code and history without an invite.
- **Rejected:** `oxygene_assessment` (less readable); private repo (adds friction for judges).

## D2. Stand-in sample data and brand guide

- **Decision:** The real `guests.json`, poll questions and brand guide were not supplied, so stand-ins were generated: `data/guests.json` (152 entries), `data/polls.json` (3 polls), `docs/brand-guide.md`.
- **Why:** Unblocks the build. The guest file deliberately contains the kinds of problems real exports have (missing fields, inconsistent codes, duplicates, junk rows), so the normalization layer is tested against realistic mess.
- **How to swap:** Replace the files with the real ones. The normalization layer is designed to accept the real data without code changes; if the real field names differ, only the field-alias map in `src/lib/normalizeGuests.js` changes.
- **Rejected:** Waiting for the real files (blocks all work); a clean, tidy sample (would hide the data-handling work the judges are assessing).

## D3. JavaScript with JSDoc, not TypeScript

- **Decision:** Plain JavaScript. Functions in `src/lib` document their inputs and outputs with JSDoc comments.
- **Why:** Less syntax to explain to a judge, and a faster build loop. The real risk in this app is bad _data at runtime_, which TypeScript cannot catch; the normalization layer validates that explicitly.
- **Rejected:** TypeScript (worth it on a larger, longer-lived codebase or a team).

## D4. ESLint + Prettier, not the Vite template's oxlint

- **Decision:** The current Vite React template ships oxlint. Replaced with ESLint (JS recommended, react-hooks, react-refresh) and Prettier, with `eslint-config-prettier` so the two never conflict.
- **Why:** The brief asks for ESLint and Prettier; ESLint's react-hooks rules are the standard, well-known check for hook mistakes.
- **Rejected:** oxlint (faster, but less familiar and not what the brief specifies).

## D5. Supabase for cross-device live sync (scope change, approved)

- **Decision:** Add a Supabase-backed store so votes and check-ins sync across _devices_ in real time. localStorage remains the fallback when Supabase isn't configured, and still syncs across tabs of one browser.
- **Why:** The judged demo is on real phones. With localStorage only, a vote cast on a judge's phone would never appear on the organizer screen.
- **How:** The UI talks to a small store interface (domain actions such as `checkIn`, `castVote`, `setActivePoll`, plus `subscribe`). Two implementations: `localStore` and `supabaseStore`. Which one is used is decided once at startup from environment variables.
- **Trade-off:** Adds one runtime dependency (`@supabase/supabase-js`) and an external service. Without real authentication, the database tables must be writable by anyone holding the public key; acceptable for a one-evening event demo, documented as a limitation.
- **Rejected:** localStorage only (fails the multi-device demo); Firebase (equivalent, but Supabase's Postgres tables are easier to inspect and explain); a custom Node + WebSocket server (more code to build, host and explain).

## D6. "Reset demo data" button on the organizer screen

- **Decision:** One button, behind a confirmation, clears check-ins, walk-ins, votes, poll state and this device's "already voted" flags.
- **Why:** The double-vote guard is per device, so a demo on a single browser could otherwise only vote once per poll. It also gives a clean slate before the real event.
- **Rejected:** A hidden "vote again" link on the poll screen (would let attendees bypass the guard).

## D7. Design tokens in CSS variables, component styles in CSS Modules

- **Decision:** All brand values (colours, fonts, spacing, radius, touch-target size) live in `src/styles/tokens.css` as CSS custom properties. Each component has its own `*.module.css` that only references tokens.
- **Why:** One place to swap in the real brand guide. CSS Modules scope class names to the component, so styles can't leak between screens, with zero extra dependencies (Vite supports them natively).
- **Accessibility:** Every text/background pair was checked against WCAG AA (lowest is 4.55:1, primary text on the light teal background). Touch targets are 48px, above the 44px minimum.
- **Rejected:** Tailwind (another tool and vocabulary to explain); a UI library (heavy, harder to match the brand); one global stylesheet (class-name collisions as the app grows).

## D8. Lightweight staff PIN, not authentication

- **Decision:** `/usher` and `/organizer` are wrapped in a `PinGate`. The PIN comes from `VITE_STAFF_PIN` (default `2026`) and unlocking is remembered in `sessionStorage` until the tab closes or staff tap "Lock".
- **Why:** Stops curious attendees wandering into check-in or the poll controls, with no login friction for ushers at a busy door.
- **Trade-off (stated honestly):** The PIN is compiled into the JavaScript bundle, so a determined person can find it. This is a deterrent, not security. Real protection would need server-side auth (e.g. Supabase Auth with staff accounts), which is out of scope.
- **Rejected:** No gate at all (attendees could close polls); full login (slow at the door, needs accounts).

## D9. Navigation only for staff; a simple home screen at `/`

- **Decision:** The bottom nav (Check-in, Poll, Dashboard) appears only once the device is unlocked. Attendees, who arrive at `/poll` by QR code, see no nav. `/` is a small landing screen sending guests to the poll and staff to their screens.
- **Why:** Attendees should see one thing: the poll. Staff need to hop between all three views, including previewing the poll.
- **Rejected:** Always-visible nav (invites attendees into staff screens); redirecting `/` to `/poll` (a judge opening the bare URL would have no way to find the staff views).

## D10. Brand fonts from Google Fonts with `display=swap`

- **Decision:** Inter and Poppins load from Google Fonts; system fonts are the fallback.
- **Why:** No extra npm dependency. With `display=swap`, text appears immediately in a system font and the app still works if the fonts fail to load (poor venue Wi-Fi).
- **Rejected:** Self-hosting via `@fontsource` (two more dependencies for a small gain).
