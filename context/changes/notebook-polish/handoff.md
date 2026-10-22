# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-plan-review` step of run 2026-10-22-notebook-polish. The plan was reviewed against the code and
Phaser 4.2.1 source, and the verdict is PROCEED. Two critical and three warning findings were fixed in `plan.md`, and
`change.md` is `plan_reviewed`. The next agent must not get this wrong: `ChunkyFace` uses a TWO-level pivot. The outer
container sits at the rect centre and an inner container at minus the centre holds the Graphics and Text at absolute
coordinates. A Text placed straight in a centred container is drawn double-offset. Zones stay outside and never move.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish`, cut from `main` at `6e426ed` |
| Commits | 6 on the branch after this step (`40e27fe` … `ea88a6f`, then `docs(notebook-polish): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 59 (all; `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/notebook-polish/reviews/plan-review.md` | the review: grounding, code verification with evidence, findings F1–F5 and O1–O2 (all FIXED), and the `VERDICT:` line |
| `context/changes/notebook-polish/plan.md` | fixes applied in place (listed in §6), Progress kept consistent |
| `context/changes/notebook-polish/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/notebook-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/notebook-polish` |
| Python check: each phase's Success Criteria bullets equal its Progress rows | 12/12 phases match after the edits (phase 12 compared by hand: 3 rows); one `## Progress`; every phase has `Driver:` |
| sub-agent source reading (Phaser 4.2.1 `DynamicTexture.js`, `DynamicTextureHandler.js`, `Filters.js`, `BaseTween.js`; repo widgets, scenes, hook) | evidence quoted in `reviews/plan-review.md` § Grounding |
| `grep` `precacheCovers` in `scripts/check-deploy.ts` | the font was not covered (F4) |
| `tests/e2e/health-lines.spec.ts` | asserts `fontHealth` `'fallback'` on a 404 only (F3) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no product code changed (contract baseline: unit 3736, e2e 144 on `main` 6e426ed) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-tdd notebook-polish phase 1`

## 5. Open

- Proof steps with decided fallbacks, unchanged:
  - Phase 2, row 2.4: WebGL gradient on rounded rects, falling back to a two-band fill.
  - Phase 3, row 3.5: blur baked into the `DynamicTexture`. The blur part is now source-confirmed; the visual check stays, with the ⅛ fallback.
  - Phase 10, rows 10.4/10.5: Chromium `fontHealth === 'loaded'` on the hook snapshot, falling back to a revert.
  - Row 11.8: Safari is checked by the maintainer only.
- Manual rows:
  - `[visual]`: 2.4, 2.5, 3.5, 3.6, 4.5, 5.5, 6.5, 7.5, 8.4, 9.4, 10.5, 11.7.
  - `[reviewer]`: 11.6.
  - `[human]`: 11.8. The maintainer checks the look and the plain zero on the tablet. They also confirm D-1: no spine band, and the shadow straight down, which departs from scope.md's words.
- DESIGN-GAP numbers 155–164, plus updates to rows 20, 25 and 152: unchanged from the plan.
- Phase 10 also edits `scripts/check-deploy.ts` (new `precacheCovers('task font', …)`). Its script pins the `fontTools` version (research used 4.61.1).
- Follow-ups list for phase 11: as in the plan, plus "bare stroke/animation numbers in untouched widgets".
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **F1 fixed as a two-level pivot plus `ChunkyFace.place(rect)`.**
  - Rejected: rewriting every `Text.setPosition` in widget-local coordinates.
  - Why: drawing code and label placement stay unchanged.
  - Would change: Phaser input or depth quirks with nested containers found in phase 4.
- **F2 fixed in phase 3:**
  - draw the container with no x/y, then `dt.render()`;
  - make the container off the display list and use a throw-away `Graphics`;
  - build the key from `stagesDone` in core;
  - do the wake check before the stage branch.
  - Rejected: editing `RoomView` to export a key function (the plan avoids touching `RoomView`).
  - Would change: the impl finding `drawRoomMiniature` unusable off-list.
- **F3 to F5 and O1, O2 fixed in place.** None needed a split or merge of phases.
  - Would change: an implement step measuring a phase as too large for one fresh agent.
- **D-1 kept, with a `[human]` confirmation, not overturned.**
  - Why: scope.md also says "as in the kit screenshots", and the kit CSS/screenshots show stitch marks only and a downward shadow.
  - Would change: the maintainer at row 11.8 or the visual gate.
- **No driver changes.**
  - Phase 1 `tdd`: four absent pure functions.
  - Phases 2–11 `impl`: visual work or tooling.
  - Phase 12 `e2e`: after the seam sweep.
  - Would change: an implement agent finding phase-1 functions already present (then `tdd → impl`).
- No questions asked (contract rule 1).
