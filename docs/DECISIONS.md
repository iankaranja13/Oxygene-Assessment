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

## D11. Guest list bundled at build time, not fetched at runtime

- **Decision:** `src/data/seed.js` imports `data/guests.json` and `data/polls.json` directly, and normalizes them once when the app starts.
- **Why:** The list is available instantly (no loading spinner at the door), and keeps working if venue Wi-Fi drops after the page has loaded. About 150 records is roughly 25 KB, which is trivial.
- **Trade-off:** Updating the guest list needs a redeploy (about a minute on Vercel). A malformed JSON file fails the _build_, never the live app.
- **Rejected:** Fetching `/guests.json` at runtime (adds loading and error states for no real benefit at this size); storing the list in Supabase (needs an import step and admin UI, which is out of scope).

## D12. Normalization rules: fix what's certain, flag what isn't

- **Decision:**
  - _Fixed automatically:_ whitespace, ALL-CAPS or all-lower-case names, code formats (always `OXY-1234`), ticket-type spellings, alternative field names, "N/A"-style organizations.
  - _Safe defaults:_ "Unnamed guest", "No organization", and "Unspecified" ticket type (never assume General, so we never guess someone's entitlements).
  - _Merged:_ only records that are identical once cleaned.
  - _Kept but flagged:_ guests sharing a code, or sharing a name. The usher decides, with the organization and ticket type shown to tell them apart.
  - _Skipped and reported:_ rows that aren't objects, or have neither a name nor a code (nobody could ever find them).
- **Why:** Silently "fixing" an ambiguous record could check in the wrong person. Flagging keeps the human in control.
- **IDs:** Generated from the data (code, or name), never randomly, so the same guest has the same id on every phone. That matters because check-ins are stored by guest id.
- **Rejected:** Fuzzy auto-merging of similar names (risky: the two Grace Wambuis are different people at different companies).

## D13. Check-ins stored as overrides, the guest list is never modified

- **Decision:** Shared state stores `checkIns[guestId] = { checkedIn, at }`. A guest's status is the override if present, otherwise the status from the original list.
- **Why:** Undo is just writing `checkedIn: false`. "Reset demo data" clears overrides and the list returns to exactly what was supplied, including people marked as checked in in the export. It also maps cleanly to one database row per check-in in Supabase.
- **Rejected:** Copying the whole guest list into storage and editing it (larger writes, harder reset, and the list and storage could drift apart).

## D14. Store interface with domain actions; `useSharedState` instead of `useLocalStorage`

- **Decision:** Screens call `appStore.setCheckIn`, `addWalkIn`, `castVote`, `setPollState` and `resetAll`, and read state with the `useSharedState()` hook (React's `useSyncExternalStore`). The brief's suggested `useLocalStorage` hook became `useSharedState` because screens shouldn't know storage is local.
- **Why:**
  - Swapping to Supabase changes one file (`appStore.js`).
  - Vote counting can be atomic on the server, which a plain get/set can't do.
  - The store re-reads storage before each write, so two tabs don't overwrite each other.
  - Every value read back from storage is validated (`sharedState.js`).
  - If the browser refuses to save, the change still shows on screen and the action returns an error message for the UI to show, so nothing fails silently.
- **Device flags stay local:** "This phone already voted" is about the device, not the event, so it always lives in localStorage even with Supabase.
- **Rejected:** A generic key/value `useLocalStorage` hook used directly by components (couples every screen to localStorage); a state library like Redux or Zustand (unnecessary for this size of app).
