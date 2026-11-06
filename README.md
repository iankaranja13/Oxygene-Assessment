# Oxygene Assessment

**LaunchPad**: a mobile-first web app for Oxygene's product launch (about 200 guests).

- **Ushers** search the guest list and check people in at the door with one tap.
- **Attendees** vote in live polls from their own phones.
- **Organizers** watch check-in progress and poll results update live, and control which poll is open.

> Live demo: _added once deployed_

## Run it locally

Requires Node 22 or later.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

| Script                 | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server          |
| `npm run build`        | Production build into `dist/`      |
| `npm run preview`      | Serve the production build locally |
| `npm test`             | Run unit tests once (Vitest)       |
| `npm run lint`         | Lint with ESLint                   |
| `npm run format:check` | Check formatting with Prettier     |

## Project structure

```
data/            sample guest list and poll questions (input data)
docs/            brand guide, decisions log, PM and UX notes
src/
  components/    reusable UI pieces
  features/      usher, poll, organizer: each with its own components
  hooks/         shared React hooks
  lib/           pure logic: normalization, search, check-in rules, votes, storage
  data/          seed data loading
  styles/        design tokens and global styles
```

## Tech stack and dependencies

| Package                              | Why                                             |
| ------------------------------------ | ----------------------------------------------- |
| `react`, `react-dom`                 | UI                                              |
| `react-router`                       | Routing between `/usher`, `/poll`, `/organizer` |
| `vite`, `@vitejs/plugin-react` (dev) | Dev server and build                            |
| `vitest` (dev)                       | Unit tests for the pure logic in `src/lib`      |
| `eslint` + plugins, `prettier` (dev) | Linting and consistent formatting               |

## Deployment

_To be completed in `chore/deploy`._

## Known limitations

_To be completed as features land._

## What I'd do next

_To be completed._
