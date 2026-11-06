# Oxygene Assessment

**LaunchPad**: a mobile-first web app for Oxygene's product launch (about 200 guests).

- **Ushers** search the guest list and check people in at the door with one tap, or by typing a ticket code.
- **Attendees** vote in live polls from their own phones.
- **Organizers** watch check-ins and poll results update live, and control which poll is open.

**Live demo:** https://oxygene-assessment.vercel.app
Poll link for attendees: https://oxygene-assessment.vercel.app/poll (QR code: [`docs/poll-qr.png`](docs/poll-qr.png))
Staff PIN for `/usher` and `/organizer`: **2026** (demo value)

The live site syncs across devices through **Supabase** (the staff header shows a **Live** badge): a vote on a phone appears on the organizer's screen in about a second.

## Try it in two minutes

1. Open `/organizer` on a laptop (PIN `2026`). Under **Poll controls** pick a question, then **Open voting**.
2. Scan the QR code (or open `/poll`) on a phone. Vote. Watch the bar move on the laptop.
3. Open `/usher` (PIN `2026`). Search `grace`, tap **Check in**, then **Undo**. Switch to **Enter code** and try `1049`, `1252` (a shared code) and `9999` (not found).
4. Back on the dashboard, the check-in count has moved. **Reset demo data** clears everything for the next run.

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
| `VITE_STAFF_PIN`                                            | Staff PIN (default `2026`)                       |
| `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL (enables cross-device sync) |
| `VITE_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **public** anon/publishable key         |

Only these public values are copied into the browser bundle (an explicit allowlist in `vite.config.js`); secret keys never are.

## Live sync with Supabase

1. Create a Supabase project (or install it from the Vercel Marketplace: `vercel integration add supabase`, which also sets the env vars on Vercel).
2. Apply the schema: `node scripts/apply-schema.mjs` (needs `POSTGRES_URL` in `.env.local`, e.g. from `vercel env pull`), or paste `supabase/schema.sql` into the Supabase SQL editor.
3. Redeploy. The staff header badge shows **Live** when connected.

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
- **No real authentication:** the staff PIN is compiled into the JavaScript, so it deters casual attendees but is not security. With Supabase, the tables are writable by anyone holding the public key (Row Level Security is on, with open demo policies; votes can only be added through a database function that checks the poll is open).
- **No real QR scanning:** typing the code stands in for scanning. A camera scanner would call the same `checkInByCode` function.
- **Double-vote prevention is per device:** a private window or cleared browser data allows another vote. Real prevention needs identity (login or a one-time code per guest).
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
