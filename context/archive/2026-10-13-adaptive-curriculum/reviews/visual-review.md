# Visual review — adaptive-curriculum (S-07)

Step: visual gate of autonomous run 2026-10-12-s04-s08, after impl-review (`MERGE: CLEAR`, fix `88e898c`).
Capture: Claude in Chrome (browser selected at preflight; own tab, closed at the end), dev server on port 4399, one game
instance per run inside a same-origin iframe captured at 1024×768 and, resized in place, at the 1440×773 page viewport
(profile § 9). Frames at `94ae4de`. Month: the real one, October 2026 (dev build, no `?e2eMonth`). All states reached
by taps with first-try answers computed from the screen; nothing written, no IndexedDB, no scene read. Frames and how
each was reached: `screenshots/README.md`. Kit: `designs/martynka-maths-A-v1/screenshots/unlock.png`, `.unlock-card`
in `designs/martynka-maths-A-v1/maths.css`.

## Choosing the stages (unlock comes quickly)

The calendar floor (`calendarStart`, rule D) for October puts most stages on a step with one or two playable skills.
Picked:

- **E4 through the parent path, age 8** (proposal E3, so E4 is an override and has no warm-up): current step 2
  „Działania do 100”, **1 playable skill** (`ADD_SUB`) → card after round 5. Next name „Dopełnianie do dziesiątki”
  (25 characters), the long name.
- **E1 through the child path, age 6** (proposal E1; no warm-up because E1 has no previous stage,
  `placement.ts` `warmupPending: previousStage(stage) !== null`): current step 4 „Rozkłady liczb 6 i 7”, 2 playable
  skills (`E1.4.bonds_6_7`, `E1.4.calendar_weekdays`) → card after round 7. Next name „Działania do 9” (14 characters),
  the short name.

The longest names in the data (28 characters, e.g. „Mnożenie i dzielenie do 100”, „Odejmowanie z przekroczeniem”) are
not the next step of any October calendar start, so they are not reachable in a few rounds; the card's name field
(`UNLOCK_LAYOUT.name.maxWidth` 1100 at the 48 px name font) leaves ample room: „Dopełnianie do dziesiątki” uses about
530 of 1100 scene px.

## States

| Plan row | State | Desktop | Tablet | Verdict |
|---|---|---|---|---|
| 7.6 | summary with a card pending | `desktop-01` (E4), `desktop-04` (E1) | `tablet-01`, `tablet-04` | identical to a plain summary, as in the kit (the kit's summary has no unlock hint either): „Brawo!”, 5 stars, „+7” = 5 first tries + 2 bonus, „Runda bez błędu! +2 ★”, „Kolejna runda” / „Do pokoju". The card shows only after „Kolejna runda” (kit flow `data-action="round"` → `screen='unlock'`) |
| 7.6 | card, long name | `desktop-02` | `tablet-02` | layout of `.unlock-card`: card 1144×660 at 388/284, 7 px `#d8bc6f` border, radius 46; title „Nowa umiejętność!” 56 px under the border; book 200×200; name under the art; „Dalej” 450×108 teal page button centred 36 px above the inner bottom. Name on one line |
| 7.6 | card, short name | `desktop-05` | `tablet-05` | same layout, name centred |
| 7.6 | round after „Dalej” | `desktop-03`, `desktop-06` | `tablet-03`, `tablet-06` | a new round of 5 dots at index 0, star counter kept (35 / 49), no card; the room switch returns after the first answer as in every round |

Differences from `unlock.png`, all covered:

- Book: the kit's green book art → a book drawn in code (DESIGN-GAP row 22, art in S-16).
- Card fill: the kit's 120° gradient `#fffef4 → #fff0c8` is flattened to its middle `#fff7de`
  (`PLACEHOLDER_COLORS.unlockCard`, commented in `src/data/layout.ts`); the Phaser placeholder pages draw flat fills.
- Background: the kit blurs the room behind a notebook with binder marks and a ribbon; ours is the plain placeholder
  notebook on the page colour (room and notebook art: S-16, like every earlier screen).
- HUD on the card: the kit's unlock view has no HUD; ours keeps the star counter (as on the summary since S-05) and the
  speaker, which reads „Nowa umiejętność! <name>.” (DESIGN-GAP row 23). The room switch is hidden while the card is
  open (DESIGN-GAP row 24) — confirmed in `desktop-02`, `desktop-05`.
- Copy: „Nowa umiejętność!” and „Dalej” are the kit's strings (`pl.unlock.title`, `pl.unlock.next`); step names come
  from `childName` (teacher read: `reviews/teacher-read.md`).

## Hand-checked number: which step the card names

Rule (`src/core/curriculum.ts`): `calendarStart` = the k-th playable step, k = min(n, max(1, max(`minStartSteps` 2,
ceil(progress · n)))), progress = clamp((position − semesterStart + 0.5) / 5), position = (month + 4) mod 12; a stage
behind the calendar stage starts at its last playable step. `unlockReady`: the current step is ready when at least
ceil(`unlockShare` 0.5 · n) of its n playable skills have mastery ≥ `unlockAt` 4 (mastery +1 per 3 first tries in a
row, so 12 in a row reach 4); the unlocked step is the **next playable** step after the current one.

- **E4, age 8, October**: month 9 → position (9 + 4) mod 12 = 1. Calendar stage for age 8 in October = E3, E4 is not
  behind. E4 is the 4th stage (index 3, odd) → semesterStart 5 → progress = clamp((1 − 5 + 0.5) / 5) = 0. Playable
  steps of E4 = [1, 2, 4, 5, 6, 8] (n = 6; step 3 „Zegar…” has no skills yet). k = max(1, max(2, ceil(0 · 6))) = 2 →
  start step **2**. Step 2 has 1 playable skill → needs ceil(0.5 · 1) = 1 skill at mastery 4. ADD_SUB first tries seen
  on screen: round 1: 4 (20 + 6, 60 − 9, 78 − 6, 21 + 6), round 2: 3, round 3: 1 (36 + 1), round 4: 2, round 5: 5 →
  15 ≥ 12 only after round 5 (10 after round 4), so the card first appears after round 5 — as observed. Next playable
  after 2 is **4** (3 is skipped) → „Dopełnianie do dziesiątki” = `E4.steps` step 4 `childName`. ✓
- **E1, age 6, October**: E1 index 0 → semesterStart 0 → progress = (1 − 0 + 0.5) / 5 = 0.3. Playable steps of E1 =
  [2, 3, 4, 5, 6, 7, 9, 11] (n = 8); k = max(2, ceil(0.3 · 8) = 3) = 3 → start step **4**. Needs 1 of 2 skills at
  mastery 4; the bonds-6/7 skill reached 12 first tries in a row in round 7. Next playable after 4 is **5** →
  „Działania do 9” ✓.
- Stars: E4 5 clean rounds × (5 + 2) = 35 on the HUD; E1 7 × 7 = 49 — both as shown.

## Touch target at 1024×768

Canvas 1024×576 at top 96, scale 1024 / 1920 = 0.533. „Dalej” on the card: 450×108 scene px → **240×57.6 CSS px**
(left 392, top 518.9, measured from the canvas `getBoundingClientRect`). ≥ 48 ✓ (`tests/layout.test.ts` checks the
scene size against `MIN_TOUCH_TARGET` 96 through `TASK_TOUCH_TARGETS.unlockNext`).

## Findings and fixes

No discrepancy needing a code change; no code changed in this step.

Observation, recorded as a follow-up (`follow-ups/review-fixes.md`, „Bramka wizualna”): in the extension-driven tab
the first tap after an iframe resize or reload was ignored 3 times out of 5 (the second always worked), together with
flight stars frozen mid-way. Most likely the throttled frame loop of an unfocused tab (the O2 note of the S-05/S-06
gates), not `TaskScene`; to confirm on a tablet with a rotate-and-back. Trigger: first device playtest (S-17).

E2E: `npx playwright test` run once as one plain command in this session — Chromium could not launch (`SIGTRAP`,
sandbox), 5 failed at launch, 10 did not run. No code changed since `88e898c`, so the orchestrator's pending e2e
re-run on `88e898c` still covers this branch.

VISUAL: PASS — summary with a pending card, the „Nowa umiejętność!” card (long „Dopełnianie do dziesiątki”, short „Działania do 9”) and the round after „Dalej” match the kit's unlock.png at 1440 and 1024×768 within DESIGN-GAP 22–24 and S-16 art; step 2→4 and 4→5 hand-checked; „Dalej” 240×58 CSS px; no code change
