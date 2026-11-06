# Oxygene Brand Guide (STAND-IN)

> **Stand-in document.** The real client brand guide was not supplied. These values are
> placeholders chosen to be plausible and to meet WCAG AA. Replace this file and the
> design tokens in `src/styles/tokens.css` when the real guide arrives.

## Personality and tone

- Fresh, confident, calm under pressure. "Oxygene" suggests air, clarity, energy.
- Copy is short, plain and friendly. Use the guest's name where possible.
- Say what happened and what to do next: "Checked in. Welcome, Amina!" not "Operation successful".
- No jargon, no exclamation-mark overload (one per message at most).

## Colours

| Role         | Name        | Hex       | Notes                                             |
| ------------ | ----------- | --------- | ------------------------------------------------- |
| Primary      | Oxygen Teal | `#0B7A75` | Buttons, links, active nav. White text passes AA. |
| Primary dark | Deep Teal   | `#075652` | Hover / pressed states                            |
| Accent       | Spark Coral | `#FF6B4A` | Highlights, poll bars. Use dark text on it.       |
| Ink          | Midnight    | `#14213D` | Body text, headings                               |
| Surface      | Cloud       | `#F5F7FA` | App background                                    |
| Card         | White       | `#FFFFFF` | Cards, inputs                                     |
| Muted text   | Slate       | `#5B6475` | Secondary text (AA on white and Cloud)            |
| Success      | Leaf        | `#1E7B34` | Checked in / success states                       |
| Warning      | Amber       | `#8A5A00` | Already checked in / caution (text colour)        |
| Error        | Signal Red  | `#B42318` | Errors, not found                                 |

## Typography

- Headings: **Poppins** (600, 700). Fallback: system-ui, sans-serif.
- Body and UI: **Inter** (400, 500, 600). Fallback: system-ui, sans-serif.
- Base size 16px minimum on mobile (prevents iOS zoom on input focus).
- Scale: 14 / 16 / 18 / 22 / 28 / 36 px.

## Shape and spacing

- Corner radius: 12px for cards, 999px (pill) for buttons and chips.
- Spacing on a 4px grid: 4, 8, 12, 16, 24, 32, 48.
- Soft shadows only: `0 1px 3px rgba(20, 33, 61, 0.12)`.

## Logo

- Wordmark "Oxygene" in Poppins 700, Oxygen Teal, with a small coral dot over the final "e".
- Minimum clear space: the height of the "O".
