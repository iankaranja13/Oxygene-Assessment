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
