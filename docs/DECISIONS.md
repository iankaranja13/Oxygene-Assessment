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

## D15. Search: a plain filter on every keystroke, no index or debounce

- **Decision:** `searchGuests` folds the query (case, accents, spaces), splits it into words, and keeps guests whose pre-folded `searchText` contains _every_ word. Results are ranked: exact code, then names starting with the query, then names with a word starting with it, then other matches, alphabetically within each group. At most 50 cards render, with a "keep typing" hint.
- **Why:** About 150 guests filter in well under a millisecond, so results appear as the usher types. Matching words in any order means "equity grace" finds the right Grace Wambui. Codes match in any format because each guest's search text includes the code with and without its dash, and an exact code match always comes first.
- **Rejected:** A fuzzy-search library like Fuse.js (a dependency, plus surprising matches when you need precision at the door); debouncing (adds lag for no benefit at this size); typo tolerance (could surface the wrong guest; the empty state suggests trying surname, organization or code instead).

## D16. Usher screen layout

- **Decision:** A compact header with a live "X of Y checked in" count, then a large, sticky, auto-focused search box. Results are cards showing name, organization, ticket badge, code, status badge and data warnings. Placeholder values ("Unnamed guest", "No organization") are shown in muted italics so they're never mistaken for real data.
- **Status never relies on colour alone:** "✓ Checked in · 17:45" or "Not checked in" as text, reinforced by a green left edge.
- **Known limitation:** iOS Safari only opens the keyboard on focus that follows a tap. Arriving at `/usher` via the nav does that; a cold page load focuses the box but needs one tap to raise the keyboard.
- **Rejected:** A table layout (cramped on a 360px screen); hiding data warnings (ushers need them to resolve duplicates and shared codes on the spot).

## D17. Check-in feedback and undo

- **Decision:** Every action produces one message, shown directly under the input inside the sticky controls, with an icon, plain words and (for changes) an **Undo** button. Undo restores the guest's _exact_ previous status, so undoing a check-in for someone the original list marked as arrived puts them back to "checked in".
- **Why under the input:** That's where the usher is looking, and it stays visible with the phone keyboard open. A bottom "toast" would be hidden behind the keyboard on iOS.
- **No auto-dismiss:** The message stays until the next action or until it's dismissed, so Undo never disappears while someone is reaching for it (WCAG 2.2.1, timing adjustable).
- **Double taps:** The card's button is disabled while saving, and checking in an already-checked-in guest shows "already checked in (17:45)" instead of overwriting the original time.
- **After a check-in from search:** the search text is re-focused and selected, so typing the next name replaces it while the card still shows the result.
- **Rejected:** A confirmation dialog before check-in (slower at a busy door; Undo is the safer, faster pattern); toast notifications that time out.

## D18. Typed code entry as the QR stand-in

- **Decision:** A "Find guest / Enter code" switch. Code mode has a numeric keypad input; pressing **Check in** checks the guest in immediately, like a scanner would. `resolveCodeEntry` returns one of five outcomes: empty, not found, ambiguous, already checked in, or ready.
- **Ambiguous codes:** When several guests share a code, nobody is checked in. Instead, all of them are listed with their own Check in buttons, and the usher asks for a name. We never guess.
- **After a code:** On success the box clears for the next guest; on a problem the code stays selected so retyping replaces it.
- **Why a separate mode:** Search already finds codes, but a scanner-style "type, then go" flow is one action shorter and mirrors how a real QR scanner would plug in later (it would call the same `checkInByCode`).
- **Trade-off:** `inputMode="numeric"` gives a big number pad but no letters. Sample codes are `OXY-` plus digits, and the prefix is optional. If real codes contain letters, it's a one-word change.

## D19. Walk-ins

- **Decision:** "Add a walk-in" appears in the empty search state and when a search finds nothing (pre-filled with what was typed). The form asks for name (required), organization (optional) and ticket type (defaults to General: here staff are choosing it deliberately, unlike missing list data). Saving adds the guest and checks them in, then shows their card.
- **Duplicate guard:** If the name matches someone on the list (ignoring case and accents), the form lists those guests and changes the button to "Add anyway".
- **Storage:** Walk-ins are stored in shared state and pass through the same normalization as list guests when read back, flagged with a "Walk-in" badge.
- **Rejected:** Letting walk-ins be edited or deleted (scope; Undo un-checks them, and the organizer can reset demo data).

## D20. Choose, then submit (two steps) for poll votes

- **Decision:** Answers are big radio-button cards (64px tall); a separate **Submit vote** button sends the vote, and stays disabled until something is chosen.
- **Why:** A vote can't be changed afterwards, so an accidental tap while scrolling shouldn't count. Real radio buttons inside a `<fieldset>` whose `<legend>` is the question give screen-reader and arrow-key support for free.
- **Rejected:** One-tap voting (faster, but irreversible mistakes); allowing vote changes (complicates counting and double-vote rules).

## D21. Double-vote prevention per device, per voting round

- **Decision:** After a successful vote, the device stores `{ "<round>/<pollId>": optionIndex }` in localStorage. The poll screen shows "Thanks, your vote is in · You chose: X" instead of the question while that entry exists. The vote is counted _first_, then remembered, so a failed vote never locks a device out.
- **Voting rounds:** "Reset demo data" can only clear flags on the organizer's own device, but attendees' phones are out of reach. So the shared poll state carries a `votingRound` id that changes on every reset. Phones remember the round they voted in; a new round means old flags no longer match, on every device.
- **If storage is blocked:** the vote still counts, and the device is blocked from voting again for as long as the page stays open (in-memory fallback).
- **Honest limitation:** This stops casual double voting, not a determined person: a private window or cleared browser data allows another vote. Real prevention needs identity (login, or a one-time code per guest) and is out of scope.
- **Rejected:** Counting by IP address (everyone on venue Wi-Fi shares one); browser fingerprinting (privacy-hostile).

## D22. Poll screen states and rules as a pure function

- **Decision:** `getPollViewState` maps `{ activePoll, isOpen, hasVoted }` to exactly one of: no active poll, open, already voted, closed. "Already voted" wins over "closed", so voters keep their thank-you. An active poll id that doesn't exist (or corrupted state) counts as "no active poll".
- **Server-side check too:** The store re-checks that the poll is still open when the vote arrives, so a vote submitted just after the organizer closes voting is rejected with "Voting is closed for this poll."
- **Percentages:** `toPercentages` uses the largest-remainder method, so displayed percentages always total exactly 100 (plain rounding can show 33 + 33 + 33 = 99).
