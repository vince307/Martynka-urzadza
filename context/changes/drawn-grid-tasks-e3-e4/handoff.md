# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 4 (tdd) done and committed as e69e6e8. The clock-to-set logic exists in `core` (reducer, CLOCK `set`, layout); no skill uses `set` yet (phase 8) and no scene draws it (phase 7). The e2e part of row 4.3 is open (Chromium cannot start in this session).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | e69e6e8 (phase 4) on 3cb42cc (phase 3) on 2166514 (phase 2) on c84ece8 (phase 1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 4.1, 4.2 ticked; 4.3 (e2e part) and 4.4 `[reviewer]` open; 1.5, 2.5, 3.5 `[reviewer]` open; phases 5-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/clockSet.ts` | `stepClockSet` reducer (down/move/up/cancel/reset), `initialClockSet`, `clockValue`, `reachableTimes(60 or 5)` |
| `src/core/round/pictureLayout.ts` | `clockSetLayout(drag, dial)` (centre, scale, hand lengths in scene px, ok, lines); `pictureLayout` branches for `drag` (mat) and `select` (above `select.top`); `belowPrompt(..., minHeight)` |
| `src/core/tasks/generators/clock.ts`, `visual.ts` | CLOCK `set` (`minuteStep` 60/30/15, `h24`), visual `{clock, set: true, snap: 60|5}` (hour/minute = start pose), key/validate/describe |
| `src/core/round/canonicalInput.ts` | clock drag answer must be in `reachableTimes(visual.snap)`, else throws |
| `src/data/layout.ts`, `balance.ts`, `pl.ts` | `TASK_LAYOUT.clockSet.dial`, `picture.select/drag/minHeight`, `balance.clockSet {grabRadius 56, startDistance 12}`, `tasks.clockSet*` strings |
| `src/scenes/TaskScene.ts` | only passes `minHeight` to `belowPrompt` |
| `tests/clockSet.test.ts` (new), `clock.test.ts`, `visual.test.ts`, `pictureLayout.test.ts`, `solvableInMode.test.ts` | 41 new tests |

## 3. Verification

| command | result |
|---|---|
| RED | pictureLayout: "expected +0 to be 120", "expected 690 to be less than or equal to 600"; clockSet: "expected '9.0' to be '3.00'" (stub reducer); CLOCK set: "expected undefined to be 'drag'"; visual: "expected '[clock 9.00]' to be '[clock set from 9.00]'"; canonicalInput: "no reachable set for the clock yet" |
| lint / typecheck | OK / OK |
| unit | branch baseline 2112 + 41 = 2153 passed; `sample` E1-E6 exit 0 (no skill uses `set` yet); deploy and ops scripts OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, 3 plain tries); expected branch baseline 57 + 0 (no scene or hook change, only the `belowPrompt` argument) |
| Deliberate breaks | `|| 12` removed from the hour -> "angle 2: expected '0.00' to be '12.00'"; `idle()` keeps the new pose on cancel/reset -> 3 tests "expected '3.00' to be '9.00'"; `select` branch of `pictureLayout` disabled -> "expected 690 to be less than or equal to 600"; all restored. Meta-check: touch points are built from `clockSetLayout` centre and lengths and `clockHandAngles`, never from reducer code |
| Teacher read (6 draws x full, h24, half, quarter, scratch script) | prompt "Ustaw zegar na 8.30." (h24 "na 15.00."); `speak` "Ustaw zegar na godzinę 8 i 30 minut." / "...godzinę 8."; hint[0] teaches the hands with no time; short-hand hint says "na 8" or "między 8 a 9"; h24 adds "Po południu ... odejmij 12." and "19 − 12 = 7"; start poses are other hours with hands apart (>= 30 degrees). Numerals agree ("30 minut", "15 minut", "45 minut") |
| Phase 3 e2e row (3.4) | ticked from the orchestrator note: full suite on 3cb42cc 57 passed |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 5`

## 5. Open

- 4.3 e2e part (orchestrator: 57 + 0), 4.4 `[reviewer]` teacher read of `set` wording (the `speak` line "godzinę 8 i 30 minut" is the weakest).
- `ClockFace.DIAL` (widget) and `TASK_LAYOUT.clockSet.dial` carry the same dial numbers (150/4/78/106); phase 7 should make the widget read the layout constant so the hit geometry and the drawing cannot drift.
- `clockSetLayout` scale is 1.513 (mat 460 / 304); a 5-minute arc at the minute tip is about 83 px. Phase 7 draws the 96 px handles from `balance.clockSet.grabRadius` (56 px radius).
- The `[human]` row 10.6 still has to cover: hour hand chosen separately (not geared), E4.3 quarters only with a 5-minute snap.
- `layout.ts` comment on `clockSet` says "DESIGN-GAP (row written in phase 10)": phase 10 must add the gap row and put its number there.

## 6. Autonomous decisions

1. Mixed phase: TDD for the reducer, generator, layout and `canonicalInput`; data constants (`layout.ts`, `balance.ts`, `pl.ts`) added inline as scaffolding before the tests. Driver stays `tdd`.
2. Grab rule: a hand is held when its tip is within `grabRadius` (56 px); with both tips in reach the nearer angle wins (tie 0.5 degree goes to the radius past the mid between the tips); the plan's pure-angle grab was extended with the reach test so a far touch does not grab. Would change: a tablet test showing children miss the tip.
3. A new `down` while carrying restores the previous pose and grabs afresh (a touch on nothing leaves the restored pose, nothing held).
4. `startDistance` (12 px) also applies to the clock: a tap does not move a hand.
5. `belowPrompt` takes a required `minHeight` (120): the drawing may then overlap the prompt's last line rather than vanish (audit S13-08). The select drawing area is 190 px tall above `select.top`.
6. `set` rejects `minuteStep` 5 (answers are 60/30/15); start pose differs in hour, and in minute when minutes move.
