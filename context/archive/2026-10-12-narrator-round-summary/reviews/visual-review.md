# Visual review — narrator-round-summary (S-05)

Step: visual gate of autonomous run 2026-10-12-s04-s08, after impl-review (`MERGE: CLEAR`, fix `3f372ca`).
Capture: Claude in Chrome (browser selected at preflight; own tab, closed at the end), dev server on port 4399 at
`184da15`, desktop 1440×900 window (viewport 1440×773), tablet 1024×768 through a same-origin iframe (profile § 9).
The no-voice frames use an iframe whose `speechSynthesis.getVoices` returns `[]` before the game boots; no game
code changed. All states reached by taps; nothing written, no IndexedDB. Frames and how each was reached:
`screenshots/README.md`. Kit: `designs/martynka-maths-A-v1/screenshots/` (`summary`, `task-tiles`,
`task-keypad`, `correct`, `tablet-1024`) and `screen.css` / `maths.css` for tokens.

## States

| Plan row | State | Desktop | Tablet | Verdict |
|---|---|---|---|---|
| 5.4 | task-keypad / task-tiles with the speaker | `desktop-01`, `-05` | `tablet-01`, `-05` | speaker 104 px square left of the counter, ivory fill, `#d3b77d` border, as kit `.hud button` / `.speaker` (`task-tiles.png`) |
| 5.4 | task-tiles (and keypad) without a Polish voice | `desktop-12` | `tablet-13` (`tablet-12`) | speaker hidden, nothing else moves (DESIGN-GAP 13) |
| 6.6 | summary, clean round | `desktop-06` | `tablet-06` | layout matches `summary.png` (below); "Runda bez błędu! +2 ★" line is DESIGN-GAP 9 |
| 6.6 | summary, round with a retype | `desktop-11` | `tablet-11` | 4 butter + 1 pale star, "+4", no bonus line (DESIGN-GAP 11) |
| 7.5 | room (counter above), summary after returning | `desktop-07`, `-08` | `tablet-07`, `-08` | placeholder panel + "Wróć do notesu" in kit `.resume` tokens (`#a6ddd2`, border `#397f73`, 480×116 at left 720); summary unchanged after return (DESIGN-GAP 12, 14) |
| 9.4 | correct with HUD "Do pokoju" | `desktop-02` | `tablet-02` | 316×104 at left 104, house icon + label, kit `.room-button` |
| 9.4 | hint without the switch | `desktop-09` | `tablet-09` | switch hidden while solving (DESIGN-GAP 4) |
| 9.4 | room from the HUD, task after returning | `desktop-03`, `-04` | `tablet-03`, `-04` | same round, `done` phase, "Dalej" and the switch back; speaker and switch hidden in the room |
| — | retype done (switch shown, no star) | `desktop-10` | `tablet-10` | switch also after a retype (phase 4 decision), counter unchanged |

Summary geometry against `summary.png` / `maths.css` (desktop frame, scene = (screen − 33) / 0.716):
title centre y 335 (kit 290 top, 86 px font), star row 657–1246 centred on 951 (kit ≈ 952), "+N" line centre y 638
(kit `.earned` top 578, 124 px), buttons left 453, width 451, top ≈ 816 (kit `.page-buttons` left 454, top 816,
`min-width` 450, height 128, gap 36). "Kolejna runda" `#a6ddd2`/`#397f73`, "Do pokoju" `#fff6dc`/`#c0a363`
(kit `.page-button`, `.secondary`). Copy "Brawo!", "Kolejna runda", "Do pokoju" as the kit.

## Hand-checked number

Rule (PRD FR-006/FR-007, `balance.round`): 1 star per task solved on the first or second try, 0 after the
solution walk and retype, +2 for a round without a mistake.

- Clean round (`desktop-06`, `tablet-06`): five first-try answers → 5 × 1 + 2 = **7**. The summary shows "+7"
  and the bonus line; the HUD counter shows 7 = 0 (session start) + 7, the session total.
- Round 2 (`desktop-11`, `tablet-11`): task 1 wrong twice → steps → "Już wiem" → retype (0 stars), tasks 2–5
  first try → 0 + 4 × 1 + 0 = **4**. The summary shows "+4", the first star pale, no bonus line; the counter
  shows 7 + 4 = **11**. During the retype the counter stayed 7 (`desktop-10`).
- Room round trips do not change the total: 1 before and after (`desktop-03`/`-04`), 7 before and after
  (`desktop-07`/`-08`).

## Touch targets at 1024×768

Canvas scale 1024 / 1920 = 0.533; measured on the tablet frames in CSS px:

| Target | Scene size | CSS px (computed) | Measured |
|---|---|---|---|
| Speaker | 104×104 | 55×55 | ≈ 57×57 (`tablet-01`) |
| HUD "Do pokoju" | 316×104 | 169×55 | ≈ 170×57 (`tablet-02`) |
| "Kolejna runda" / summary "Do pokoju" | 450×128 | 240×68 | ≈ 241×69 (`tablet-06`) |
| "Wróć do notesu" | 480×116 | 256×62 | ≈ 256×63 (`tablet-03`) |

All ≥ 48 CSS px.

## Findings

No discrepancy against the kit that this slice owns, so no code changed in this step.

Kept, recorded, not changed:

- DESIGN-GAP 9–14 (bonus line, highlighted "Do pokoju", pale star, room placeholder, hidden speaker, HUD over
  the summary and the room): the frames show the provisional behaviour each row describes.
- Art the kit has and the placeholders do not (room background, ribbon, ruled margin, button gradients
  flattened, label font 40 px vs kit 42 px in the HUD switch — an earlier recorded decision): S-09 / S-16.

Observations, recorded as follow-ups (`follow-ups/review-fixes.md`, "From the visual gate"):

- O1 A star in flight when the child taps HUD "Do pokoju" is frozen while `TaskScene` sleeps and finishes its
  flight after the return (`desktop-04`, `tablet-04`); the counter is already right. Cosmetic. Trigger: S-09.
- O2 One E3 round showed the same prompt as tasks 2 and 3 ("Liczba 22 jest parzysta czy nieparzysta?"); skills
  are drawn with repeats by design (S-04). Trigger: S-07.

VISUAL: PASS — every [visual] state of rows 5.4, 6.6, 7.5, 9.4 captured at 1440 and 1024×768, matches the kit within DESIGN-GAP 9–14; +7 = 5 × 1 + 2 and the counter equals the session total; targets ≥ 48 CSS px
