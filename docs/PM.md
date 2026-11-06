# Product Notes: LaunchPad

Short, honest product-management notes for the Oxygene product launch (about 200 guests).

**Client request:** "Our ushers waste time searching printed lists at the door, and the client wants audience polls during the presentation. We need something simple that works on a phone that is responsive."

**Goal:** Faster, more reliable check-in at the door, and live audience polls, using only the phones people already carry.

---

## 1. User stories and acceptance criteria

### US1. Find a guest fast (usher)

_As an usher, I want to find a guest by typing part of their name, organization or code, so that I don't search a printed list._

- Results appear as I type, with no submit button and no noticeable delay.
- Matching ignores capitals, accents and extra spaces ("jose nunez" finds "José Núñez").
- Words can be in any order ("equity grace" finds Grace Wambui at Equity Bank).
- Each result shows name, organization, ticket type, code and check-in status.
- No matches shows a clear message with what to try next and an option to add a walk-in.

### US2. Check a guest in with one tap (usher)

_As an usher, I want to check a guest in with one tap and undo mistakes, so that the queue keeps moving._

- From the open screen, check-in takes: type, then one tap.
- A success message names the guest and offers Undo; Undo restores their exact previous status.
- Checking in someone already checked in shows "already checked in (time)" and keeps the original time.
- A double tap can't create two check-ins.

### US3. Check in by code (usher)

_As an usher, I want to type the code from a ticket and check the guest in, so that it works like a scanner._

- Codes work in any format: `1049`, `oxy1049`, `OXY-1049`.
- Clear outcomes for: empty input, code not found, already checked in, success.
- If several guests share a code, nobody is checked in automatically; all are listed for me to choose.
- After success the box clears for the next guest; after an error the code stays selected to retype.

### US4. Add a walk-in (usher)

_As an usher, I want to add someone who isn't on the list, so that genuine guests aren't turned away._

- Name is required; organization is optional; ticket type defaults to General.
- If the name is already on the list, I see who before confirming ("Add anyway").
- The walk-in is checked in, counted, searchable and labelled "Walk-in".

### US5. Vote in a live poll (attendee)

_As a guest, I want to answer the poll on my phone during the presentation, so that I can take part._

- The active question shows with large, tappable answers; I choose, then submit.
- After voting I see "Thanks, your vote is in" and what I chose, also after a reload.
- I enter my check-in code once; a code that isn't a guest's is refused with a clear message.
- My code can vote once per poll, from any phone; a second attempt shows that it already voted.
- If no poll is open I see a waiting screen that updates by itself; if voting closed I'm told so.

### US6. Run the polls (organizer)

_As the events manager, I want to choose the active poll and open or close voting, so that polls match the presentation._

- I can pick which poll phones show, or show the waiting screen.
- Picking a poll never opens voting by itself; Open and Close are separate, deliberate actions.
- Phones update within a few seconds without a refresh.

### US6b. Create a poll (organizer / presenter)

_As the presenter, I want to write my own poll questions on the dashboard, so that I'm not limited to the prepared ones._

- I can enter a question and 2 to 6 answers; blank, duplicate or over-long answers are explained.
- The new poll appears in Poll controls on every organizer screen straight away.
- I can delete a poll I created if it has no votes and isn't on screen.

### US7. See live results and arrivals (organizer)

_As the events manager, I want to see check-in progress and poll results live, so that I can make decisions and show results on screen._

- Check-ins show as "X of Y checked in", a percentage and a progress bar.
- Poll results show as bars with counts and percentages that add up to exactly 100.
- Everything updates automatically as ushers and guests act.
- The layout works on a phone and projected on a big screen.

### US8. Trust the guest data (organizer)

_As the events manager, I want the app to cope with a messy guest export, so that the door doesn't stall on bad data._

- Missing fields get safe defaults ("No organization", "Unspecified" ticket type).
- Exact duplicates are merged; shared codes and shared names are kept but flagged.
- Rows that can't be used are skipped and counted, never crash the app.
- The dashboard summarises what was cleaned up.

---

## 2. Prioritised scope (MoSCoW)

| Priority   | Item                                                               | Status                              |
| ---------- | ------------------------------------------------------------------ | ----------------------------------- |
| **Must**   | Usher search by name, organization or code                         | Done                                |
| **Must**   | One-tap check-in with Undo                                         | Done                                |
| **Must**   | Typed code entry with clear success and error results              | Done                                |
| **Must**   | Edge cases: already checked in, not found, shared code, no results | Done                                |
| **Must**   | Poll screen: vote, confirmation, one vote per device, all states   | Done                                |
| **Must**   | Organizer: check-in count, live results, poll controls             | Done                                |
| **Must**   | Normalization of the guest export; never crash on bad data         | Done                                |
| **Must**   | Mobile first, accessible, brand tokens, live URL                   | Done                                |
| **Should** | Walk-in guests                                                     | Done                                |
| **Should** | Live sync across devices (Supabase)                                | Done                                |
| **Should** | Staff PIN to keep attendees out of staff screens                   | Done (deterrent only)               |
| **Should** | Reset demo data                                                    | Done                                |
| **Could**  | Real QR scanning with the camera                                   | Not done (typed code stands in)     |
| **Could**  | Export check-ins to CSV after the event                            | Not done                            |
| **Could**  | Show results to attendees after a poll closes                      | Not done                            |
| **Could**  | Edit or delete walk-ins                                            | Not done                            |
| **Won't**  | Real authentication and staff accounts                             | Out of scope for a one-evening demo |
| **Won't**  | Native mobile apps                                                 | A responsive web app covers it      |

---

## 3. Open questions for the client

1. **Codes:** What do the real check-in codes look like? Do they ever contain letters? (The code keypad is numeric-only today.)
2. **QR:** Are tickets already printed with QR codes? Which format, and what does the QR contain (code or URL)?
3. **Ticket types:** What does each ticket type entitle a guest to (VIP area, seating)? Should ushers see that?
4. **Plus-ones:** Do guests bring plus-ones, and how are they recorded?
5. **Walk-ins:** Are walk-ins allowed at all? Who approves them? Do we need their email or phone?
6. **Duplicates:** For people sharing a code or a name, who resolves it: usher, or a supervisor?
7. **Polls:** Should results be shown to attendees, or only on the main screen? Anonymous, or tied to guests?
8. **Data:** When will the final guest list arrive, and can it change on the day?
9. **Privacy:** Are we allowed to store guest names in a cloud database (Supabase, EU or US region)? For how long?
10. **Venue:** How reliable is Wi-Fi and mobile data at the venue? How many door positions and ushers?
11. **Branding:** Can we have the real brand guide (colours, fonts, logo files)?
12. **After the event:** Does the client want a report (arrivals, no-shows, poll results)?

---

## 4. Change-impact note (template for a mid-task curveball)

Copy this section when a change request arrives, fill it in, and agree it with the client before building.

```
### Change request: <short title>

Requested by: <name / role>          Date: <date>
Description: <what is being asked, in the client's words>

Why it matters: <the user problem it solves>

Impact
- Screens affected: <usher / poll / organizer / none>
- Code affected: <files or modules, e.g. src/lib/search.js, src/features/usher/...>
- Data affected: <guest file format, shared state shape, Supabase schema?>
- Effort estimate: <hours>
- Risk: <low / medium / high>, because <reason>
- Tests to add or change: <list>
- Docs to update: <README / DECISIONS / WALKTHROUGH>

What we'd drop or delay to fit it in: <Must/Should/Could items affected>

Options
1. <Smallest version that meets the need>
2. <Full version>
3. <Do nothing / defer, and the consequence>

Recommendation: <option> because <reason>

Decision: <accepted / deferred / rejected>, by <who>, on <date>
```
