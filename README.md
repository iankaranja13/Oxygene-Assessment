# Oxygene Assessment

**LaunchPad**: a mobile-first web app for Oxygene's product launch (about 200 guests).

- **Ushers** search the guest list and check people in at the door with one tap, or by typing a ticket code.
- **Attendees** vote in live polls from their own phones.
- **Organizers** watch check-ins and poll results update live, and control which poll is open.

|                  |                                                                         |
| ---------------- | ----------------------------------------------------------------------- |
| **Live demo**    | https://oxygene-assessment.vercel.app                                   |
| **Code**         | https://github.com/iankaranja13/Oxygene-Assessment                      |
| **Poll QR code** | [`docs/poll-qr.png`](docs/poll-qr.png) (opens the live site on a phone) |

The live site syncs across devices through **Supabase**: a vote on a phone appears on the organizer's screen in about a second (staff see a **Live** badge in the header).

## How to test

### Access codes

Everyone opens the **same link** and sees one box: **"Check-in code or staff PIN"**. What you type decides who you are and which screens you get.

| Role          | Type this                                                         | You get                                                                               |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Organizer** | `4826`                                                            | Dashboard: create polls, choose/open/close polls, live results, reset. Also Check-in. |
| **Usher**     | `2026`                                                            | Guest check-in only                                                                   |
| **Attendee**  | A guest's check-in code: `1049`, `1105`, `1133`, `1336` or `1658` | The live poll only (one vote per code)                                                |

Codes work with or without the `OXY-` prefix. Each attendee code can vote once per poll, so use a **different code on each phone**. Opening another role's screen directly (e.g. `/organizer` as an usher) asks for that role's PIN. **Lock** / **Sign out** returns to the welcome screen.

### End-to-end walkthrough (about 5 minutes)

Use a laptop for the organizer and one or two phones (or private browser windows) for the others.

**1. Organizer sets up a poll (laptop)**

1. Open the live link, type `4826`, press **Continue**. You land on the **Dashboard** (tabs: Dashboard, Check-in).
2. Optional: under **Create a poll**, write a question and 2 to 6 answers, then **Create poll**. It appears under **Poll controls** marked "created here".
3. Under **Poll controls**, pick a question. Phones now show it, with voting still closed.
4. Press **Open voting**. The badge changes to "Voting open".

**2. Attendee votes (phone)**

1. Open the link (or scan the QR code), type `1049`, press **Continue**. You land on the **live poll** with the organizer's question; there are no staff tabs.
2. Tap an answer, then **Submit vote**. You see "Thanks, your vote is in · You chose: …".
3. On the laptop, the result bar updates within about a second.
4. Try `1049` on a second phone or private window: it says the code has already voted, and the count doesn't change.
5. Try `9999`: "That doesn't match a check-in code or staff PIN."

**3. Usher checks guests in (phone)**

1. Open the link, type `2026`. You land on **Guest check-in** (no other screens).
2. Search `grace`: two different Grace Wambuis appear, labelled "Same name as another guest". Tap **Check in** on one, then **Undo** in the message.
3. Tap **Enter code** and try these:

   | Code           | Expected result                                                                           |
   | -------------- | ----------------------------------------------------------------------------------------- |
   | `1336`         | Checked in: Tendai Dlamini                                                                |
   | `1336` (again) | "Already checked in" with the time                                                        |
   | `1252`         | Shared by two guests: both are listed and you choose (nobody is checked in automatically) |
   | `1455`         | Already checked in on the original list, with the time                                    |
   | `9999`         | No guest has that code                                                                    |

4. Search for a name not on the list (e.g. `Zed Example`), tap **Not on the list? Add a walk-in**, and add them.
5. Open `/organizer` in the address bar: you're asked for the organizer PIN, and `2026` is refused.
6. Tap **Lock**: back to the welcome screen.

**4. Organizer wraps up (laptop)**

1. The **Check-ins** count has moved (3 of 146 are checked in on the original list).
2. **Guest list notes** shows what the data clean-up found (152 rows became 146 guests).
3. **Close voting**, then **Reset demo data** to clear check-ins, walk-ins and votes for the next tester. Polls you created are kept.

## Run it locally

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                 | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                    |
| `npm run build`        | Production build into `dist/`                |
| `npm run preview`      | Serve the production build locally           |
| `npm test`             | Run the unit tests once (Vitest)             |
| `npm run lint`         | Lint with ESLint                             |
| `npm run format:check` | Check formatting with Prettier               |
| `npm run qr`           | Regenerate `docs/poll-qr.png` (optional URL) |

With no configuration the app stores shared data in **localStorage**: it works fully, and syncs between tabs of the same browser. To sync across devices, connect Supabase (below).

### Environment variables

Copy `.env.example` to `.env.local`.

| Variable                                                    | Purpose                                          |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `VITE_USHER_PIN`                                            | Usher PIN (default `2026`)                       |
| `VITE_ORGANIZER_PIN`                                        | Organizer PIN (default `4826`)                   |
| `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL (enables cross-device sync) |
| `VITE_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **public** anon/publishable key         |

Only these public values are copied into the browser bundle (an explicit allowlist in `vite.config.js`); secret keys never are.

## Who can see what

| Role      | How they get in                                               | Can open                                                    | Downloads guest list? |
| --------- | ------------------------------------------------------------- | ----------------------------------------------------------- | --------------------- |
| Attendee  | Their check-in code on the welcome screen (or `/poll` via QR) | Poll (and the home page)                                    | No                    |
| Usher     | Usher PIN on the welcome screen                               | Check-in only (no nav)                                      | Yes, after unlocking  |
| Organizer | Organizer PIN on the welcome screen                           | Dashboard (create polls, poll controls, reset) and Check-in | Yes, after unlocking  |

The welcome screen decides the role from what's typed (staff PINs are checked first; a test guarantees no guest code equals a PIN). Ushers get only check-in; organizers get a two-tab nav (Dashboard, Check-in); attendees get only the poll. Opening another role's address directly asks for that role's PIN. **Lock** / **Sign out** returns to the welcome screen. See DECISIONS D27 for what this does and doesn't protect.

## Live sync with Supabase

1. Create a Supabase project (or install it from the Vercel Marketplace: `vercel integration add supabase`, which also sets the env vars on Vercel).
2. Apply the schema: `npm run db:schema` (needs `POSTGRES_URL` in `.env.local`, e.g. from `vercel env pull`), or paste `supabase/schema.sql` into the Supabase SQL editor.
3. Load the guest check-in codes into the private `guest_codes` table: `npm run db:guest-codes`. Rerun it whenever `data/guests.json` changes.
4. Redeploy. The staff header badge shows **Live** when connected.

## Deploy

The app is a static single-page app on Vercel.

```bash
vercel link
vercel deploy --prod
```

`vercel.json` rewrites every path to `index.html`, so deep links like `/poll` work on refresh.

## Project structure

```
data/               sample guest list and poll questions (input data, never edited by the app)
docs/               PM, UX, decisions log, walkthrough, brand guide, poll QR code
scripts/            QR code generator, Supabase schema runner
supabase/           database schema, vote and reset functions, security policies
src/
  components/       reusable UI: buttons, badges, page shell, nav, PIN gate, status messages
  features/
    usher/          search, guest cards, check-in actions, code entry, walk-ins
    poll/           attendee poll question, vote confirmation, voting hook
    organizer/      check-in summary, live results, poll controls, data notes, reset
    home/           landing and 404 pages
  hooks/            useGuests, usePolls, useSharedState, useConnectionStatus, ...
  lib/              pure logic: normalization, search, check-in rules, votes, walk-ins
    storage/        safe storage wrapper, local and Supabase stores, device vote flags
  data/             loads and normalizes the seed data
  styles/           design tokens and global styles
```

Business rules live in `src/lib` as pure functions with unit tests (123 tests). Components stay thin.

## Tech stack and dependencies

| Package                              | Why                                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| `react`, `react-dom`                 | UI                                                               |
| `react-router`                       | Routing between `/usher`, `/poll`, `/organizer`                  |
| `@supabase/supabase-js`              | Cross-device sync (database + realtime), used only if configured |
| `vite`, `@vitejs/plugin-react` (dev) | Dev server and build                                             |
| `vitest` (dev)                       | Unit tests                                                       |
| `eslint` + plugins, `prettier` (dev) | Linting and formatting                                           |
| `qrcode` (dev)                       | Generates the poll QR image (build-time script only)             |

No UI or charting library: plain CSS with design tokens and CSS Modules.

## Known limitations (stated honestly)

- **Sync without Supabase:** run locally without Supabase keys, the app uses localStorage, which only syncs between tabs of one browser. (The live site has Supabase connected.)
- **No real authentication:** ushers and organizers have separate PINs, and attendees never download the guest list, but both PINs are compiled into the JavaScript, so they deter casual access rather than secure it. The staff screens' files (including the guest list) are still publicly reachable by URL for anyone who goes looking. With Supabase, the tables are writable by anyone holding the public key (Row Level Security is on, with open demo policies; votes can only be added through a database function that checks the poll is open).
- **No real QR scanning:** typing the code stands in for scanning. A camera scanner would call the same `checkInByCode` function.
- **One vote per check-in code, with limits:** the database enforces it, but guests who share a code share a vote, walk-ins have no code so can't vote, and short codes could be guessed (no rate limiting). In local mode (no Supabase) the code check runs in the browser and loads the guest list there.
- **Guest list is bundled at build time:** changing it needs a redeploy (about a minute on Vercel).
- **Offline:** the guest list keeps working once loaded, but check-ins made while offline are rejected with an error (not queued) when using Supabase.
- **Bundle size:** about 157 kB gzipped, mostly the Supabase client. Fine on 4G; code-splitting it is a next step.
- **Walk-ins** can't be edited or deleted (Undo un-checks them; reset clears them).
- **Brand guide and guest data are stand-ins**, generated because the real files weren't supplied.
- **Not tested** with a real screen reader on a phone or with real ushers at a door.

## What I'd do next

1. Camera QR scanning (e.g. the browser's `BarcodeDetector`) feeding the existing code-entry logic.
2. Staff accounts with Supabase Auth, and Row Level Security that only lets staff write check-ins.
3. An offline queue for check-ins, synced when the connection returns.
4. Upload the guest list from the organizer screen instead of redeploying.
5. CSV export of arrivals and poll results after the event.
6. Usability test with two or three real ushers before the event.

## Documentation

- [`docs/WALKTHROUGH.md`](docs/WALKTHROUGH.md): guided tour of the code, with likely questions and answers
- [`docs/DECISIONS.md`](docs/DECISIONS.md): every significant decision and the alternatives rejected
- [`docs/PM.md`](docs/PM.md): user stories, priorities, open questions, change-impact template
- [`docs/UX.md`](docs/UX.md): flows (Mermaid), screen states, design decisions
- [`docs/brand-guide.md`](docs/brand-guide.md): stand-in brand guide
