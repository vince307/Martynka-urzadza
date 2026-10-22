# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-e2e` step of phase 12 (the last phase). Phase 12 is committed as `18d0cee`; `change.md` status is `implemented`. The next step is the implementation review; rows tagged [reviewer], [visual] and [human] stay open and are not the e2e step's to tick.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` (cut from `main` at `6e426ed`) |
| Commits | p1 `a659097` ... p11 `6b2c84b` (see earlier phases), p12 `18d0cee`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 22 (`grep -c '^- \[ \]' plan.md`): the e2e rows of phases 4-11 that the orchestrator ticks, and the [reviewer]/[visual]/[human] rows |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/notebook-polish.spec.ts` | p12: 6 tests, `#12` welcome backdrop + age tap; `#11` counter immediate during the star flight (E1 tiles tapped in the entrance), summary `nextRound` tapped at once, backdrop re-captured after a room purchase, `?e2eArt=room` plain page, reduced-motion round with `fontHealth === 'loaded'` |
| `tests/e2e/support/hook.ts` | `Snapshot.backdrop?` type (the hook already published it) |
| `playwright.config.ts` | `notebook-polish` added to the `ROUND_SPEC` regex so the spec runs in the hook project (the webServer entries untouched) |
| `context/changes/notebook-polish/plan.md` | rows 12.1-12.3 ticked with `18d0cee` |

Earlier phases (kept):

| path | what it is |
|---|---|
| `src/ui/widgets/chunky.ts` | `ChunkyFace`: static lip Graphics, outer centred Container (`face`) over an inner one at minus the centre; `add`, `place`, `press`, `release`, `reset`, `setDepth`, `setVisible`, `destroy`; tweens skipped under `prefersReducedMotion()` |
| `AnswerTiles.ts`, `Keypad.ts`, `ActionButton.ts` | each control owns a `ChunkyFace` (lips `LIPS.answer/key/action`, no lip literals left); zones stay outside, fire moments unchanged (`pointerdown`), release on `pointerup`/`pointerout` |
| `tests/layout.test.ts` | new case: tile, key and bar lips stay inside the notebook and clear of the next control, from the real `TASK_LAYOUT`, `LIPS`, `tileRow`, `keypadGrid` |
| `tests/reducedMotionWiring.test.ts` | new: files that tween (list: `chunky.ts`) reference `prefersReducedMotion()`, checked before `tweens.add` |
| `docs/design-gaps.md` | rows 156 (bar buttons lip) and 157 (press with Back overshoot) |
| `src/data/layout.ts` `CONTENT_LEFT` (314) | fix `89b265e`: one inset = frame left + border + `NOTEBOOK.margin.fromInnerLeft` (92) + width 2 + `margin.gap` 24; `NOTEBOOK` moved above `TASK_LAYOUT`; `promptBeside`/`expression` box now 314..1000; left-column picture, drag mat, wallet, digits, hint, tall rectangles start at it (right edges kept or tightened); tap zones untouched except the wallet (x 308 -> 314) and the drag mat (x 236 -> 314), which the e2e hook reads from the layout |
| `PageButton.ts`, `AgeButton.ts` | p5: `ChunkyFace` with `LIPS.page` / `LIPS.age`; press on `pointerdown`, release on `pointerup`/`pointerout`; fire stays on `pointerup` behind `pressed`; `ageButtonShadow` colour and `WELCOME_LAYOUT.ages.shadow` removed (tests use `LIPS.age.offset`); `docs/design-gaps.md` row 152 updated |
| `src/ui/widgets/hudPill.ts` | p6: `drawHudPill(g, rect, { pressed?, lip?, radius? })`: gradient (flat mid colour) face, 5 px border, optional static lip from `LIPS.hud`; used by all four HUD widgets |
| `SpeakerButton.ts`, `RoomSwitchButton.ts` | p6: `ChunkyFace` with `LIPS.hud`; press on `pointerdown`, release on `pointerup`/`pointerout`; the darker pressed face stays; fire moment unchanged (`pointerup`); zone outside the face |
| `StarCounter.ts`, `SettingsIcon.ts` | p6: counter is a `ChunkyFace` that never presses, public `face` container for the phase-7 pop, `setValue` still synchronous; counter 104 px high, top 44 (centre unchanged, 96); gear = pill + static lip, no tweens |
| `HUD_LAYOUT` | p6: unused `fill/pressed/borderColor/border` tokens removed from speaker, room switch and gear; `docs/design-gaps.md` row 158 added, row 25 updated; new case in `tests/layout.test.ts` |
| `fix 5d901ff` | `TASK_LAYOUT.keypad.left` 1040 -> 1120 (keys 156 x 104 unchanged, right end 1636, inside the notebook), hint picture and lines width up to x 1110 (796 px): 0..30 labels 12.1 CSS px on a 1024 tablet; `pictureLayout.test.ts` floor back to 12 |
| `fix 35aba94` | `fillPaper` is now one flat face (mid colour of the two kit tints) so no seam; stitch marks start `phase` 44 px into the kit strip (inner top - 20): 8 marks y 244..944, all inside the page; `NOTEBOOK.stitches.phase`; test with hand-computed oracle |
| `src/scenes/TaskScene.ts` | p7: `answerFace(value)` (tile face, keypad entry field, or the "OK" face; none for digits and dice), `bounce`, `wobble` (+ `stopWobble`, `wobbling` field), camera shake and both `scrollX` resets gone; `flyStar` `onComplete` emits `GAME_EVENTS.starLanded`; keypad `answerSpot` is the entry field centre |
| `Keypad.ts`, `AnswerTiles.ts`, `ActionButton.ts`, `SelectTiles/BlockMat/CoinWallet/ClockSet.ts` | p7: `entryFace()`/`entryTarget()` (field wrapped in a centre container), `faceOf(value)`, `faceObject()`, `okFace()` |
| `chunky.ts` | p7: `moveTo` stops only its own press tween (`pressTween`), so a bounce or wobble on the same face survives the release |
| `StarCounter.ts`, `UIScene.ts` | p7: `pop()` (scale yoyo, off under reduced motion); `UIScene` handles `starLanded`; `onStars` still calls `setValue` directly |
| `tests/motionWiring.test.ts` | p7 (7 cases, AST anchored on method bodies); `reducedMotionWiring.test.ts` list gained `TaskScene.ts`, `StarCounter.ts`; `ANIMATION.shake*` removed; `docs/design-gaps.md` rows 159, 160 |
| `starBurst.ts`, `SummaryPanel.ts` | p9: `starBurst(scene, x, y, {count, depth, speed?, scale?})` owns the particle texture (key `purchase-star`, unchanged) and the explode; `RoomScene.celebrate` calls it (same count, speeds, depth); `SummaryPanel` draws one Graphics per star (centred at its own origin), pops them at `summaryPopDelays`, then "star +N" and the burst; `hide()` kills tweens, timers and star objects; buttons shown synchronously in `show()`; `docs/design-gaps.md` row 163; `reducedMotionWiring.test.ts` gained `SummaryPanel.ts` and a burst case |
| `scripts/make-font.py`, `package.json` (`npm run font`) | p10: builds `public/fonts/MartynkaNext.ttf` from `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf`: zero's two counters replaced by one oval counter (outer contour scaled into the box of the two counters, per gvar master, IUP-inferred deltas first); name IDs 1, 3, 4, 6, 25 renamed, ID 5 gets a modification note, ID 0 untouched; `head.modified` fixed; refuses any fontTools other than 4.61.1 |
| `public/fonts/MartynkaNext.ttf`, `OFL.txt` | p10: shipped font (114 640 B, sha1 `42ff8ec7`); old `AtkinsonHyperlegibleNext.ttf` removed from `public/` (the original stays in `designs/`); `OFL.txt` keeps the full license, one line added at the top naming the modification and the new name |
| `src/data/layout.ts` | p10: `FONT_FAMILY`/`FONT_KEY` `MartynkaNext`, `FONT_URL` `fonts/MartynkaNext.ttf` (BootScene load path untouched) |
| `scripts/check-deploy.ts` | p10: `record(precacheCovers('task font', precache, [FONT_URL]))` inside `if (sha7)` (a rollback skips it) |
| `tests/fontZero.test.ts` | p10: 6 cases reading `cmap`/`loca`/`glyf`/`name`/`fvar` from the bytes (zero has 2 contours, the original 3; glyph id and count as the original; names; copyright kept; wght 200-800; OFL.txt present and notes the modification) |
| `docs/design-gaps.md` | row 164 (plain zero overrides the kit) |
| `CLAUDE.md` | p11: font sentence fixed, `npm run font` in Commands, one "Notebook polish" block naming the new modules and tokens, save v4 stated |
| `context/changes/notebook-polish/follow-ups/review-fixes.md` | p11: 14 open entries and 5 closed, every one with a `Trigger:` line |


## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/notebook-polish.spec.ts --workers=1` | 6 passed |
| full `npx playwright test --workers=2` | 145 passed, 5 failed under load (own `counter shows`, `save-backup-health` SV2-04, `save-transfer` #10, two `stale-tab`); `--last-failed --workers=1`: 5 passed; total 150 = baseline 144 + 6 (`--list` says 150 in 40 files) |
| `npm run lint`, `typecheck`, `npm test` | OK, 3780 passed (199 files) |
| break 1 | `setValue` moved into the `starLanded` handler (UIScene): "counter shows" red on `counterText` `'1'`; restored |
| break 2 | `onWake` re-capture removed (TaskScene): "captured again" red (`captures` stayed 1); restored |
| break 3 | `AnswerTiles.press` ignored until the entrance (650 ms) ended: "counter shows" red (phase stayed `first`); restored with `git checkout` |
| meta-check | break 3 first stayed green on E3 (keypad), so the test moved to the child path age 6 (E1 tiles) and asserts `input === 'tiles'`; a copy-only change is not a break here |

## 4. Next command

`/10x-impl-review notebook-polish`

## 5. Open

- The `counter shows` test reads `counterText` once right after `done`; the flight lasts 850 ms, so a machine slower than that between two reads could make a break invisible, never a false red.
- Rows 4.4-11.5 e2e rows: the full suite is green with the six new tests, the orchestrator ticks them.

- p11: seam sweep found no duplicated gradient/lip code, no second star texture, no stale `shake`/slashed-zero comments, no unused `ageButtonShadow`. `AGENTS.md` repeats none of the facts, left alone. Row 11.7 [visual] and 11.8 [human] (D-1 and the iPad zero) are not mine.

- p10 not seen in a browser: the shipped font must load in Chromium (`fontHealth === 'loaded'` through the hook snapshot, row 10.4) and Safari; if the hook reports `fallback`, the pre-decided fallback is: revert `public/fonts/` and the `layout.ts` constants to the original file (zero stays slashed), keep `scripts/make-font.py`, record a follow-up. Rows 10.4 (e2e part) and 10.5 [visual] are not mine. Phase 11 must update CLAUDE.md (font file name in "Current state" and `## Commands`, `npm run font`) and re-record the FontFace time-limit follow-up.
- `tests/fontZero.test.ts` reads the original from `designs/` (tracked in git, so CI has it).

- p9 not seen in a browser: pop look and timing, "+N" pop, burst position from the earned star, 6-star warm-up row centred, reduced-motion static summary, purchase burst in the room unchanged. Rows 9.3 (e2e part) and 9.4 [visual] are not mine. `summaryView` re-shown (return from the room) replays the pops.

- p8 not seen in a browser: bead row size (radius 28, pitch 74) against the HUD pills, pop feel, stagger look at 0/150/400 ms, reduced-motion rest. Rows 8.3 (e2e part) and 8.4 [visual] are not mine.

- p7 not seen in a browser: bounce/wobble feel, star start over the keypad entry field, counter pop on landing, wobble not cut by the release (chunky now stops only its press tween), reduced-motion path. Wobble target of a keypad answer is the (cleared) entry field showing `?`. A done-phase answer in `retype` is judged by the same `roundView(...).input` as `answerSpot`.
- Rows 4.4, 5.4, 6.4, 7.4 (e2e) and 4.5, 5.5, 6.5, 7.5 [visual] are not mine. Keypad moved 80 px right: check in a browser that the keypad column still looks balanced in the notebook and clear of the ribbon; e2e keypad specs read the hook rects from `TASK_LAYOUT`. Not seen in a browser for p6: pill gradient is flat (as the notebook), speaker/room button press, the gear hint bubble still pointing at the gear. Hint line labels are 12.1 CSS px again after `5d901ff` (keypad moved right); the written column is 330 px wide (was 400), the tall drawings 200-220 px (were 240-264). To confirm in a browser. Page buttons: not seen in a browser; label and graphics sit inside the face container. Not verified in a browser: that the container-wrapped Graphics/Text draw at the same place, press feel, the tile highlight appearing at once, ActionButton "Dalej" not flickering when it hides in the press handler.
- `SelectTiles` and `CoverBoard` still use their own lips (out of phase 4's list).
- `ARTIFACT GAP`: none.


## 6. Autonomous decisions

- p12: `ROUND_SPEC` in `playwright.config.ts` extended (needed for the hook project; not the webServer entry). The counter test uses `passWelcomeAsChild(6, 9)` so the first answer is a tile tap inside the entrance. The purchase test buys the renovation stage with `?e2eStars=5`. Would change if the entrance span is shortened below the time of the first read.

- Paper: chose a flat face of the mid colour over several narrow bands (simplest; the kit tints differ by a few RGB units), `fillPaper` keeps its signature. Rejected: a gradient (Phaser 4 WebGL path fill gives wrong corners).
- Stitches: modelled on the kit strip (`top:-20; bottom:-20` of the padding box, mark 44-54 of each 100 px period) with a new token `phase`; the old geometry started at the strip's top edge.
- `ActionButton` releases only if it was pressed and is still shown, so "Dalej" hiding inside its own press stays hidden.
- Reduced motion: the face moves at once to the lip (still shows the pressed state) instead of tweening.
- Row 4.4 left unticked (needs the orchestrator's e2e). Commit messages in Polish; stopped after the phase; no questions asked (contract rule 1).
- Margin fix: content starts at `CONTENT_LEFT` 314 (margin line 288-290 plus a 24 px gap), derived from the notebook tokens. Chose to keep the hint number line right of the margin and relax its legibility floor to 10.5 CSS px instead of letting it cross the line; would change if the maintainer prefers 12 px (then the keypad column would have to move). Follow-up candidate: fewer labels on the 0..30 hint line.
- p5: age button keeps its pressed fill colour change besides the sink; the room buttons and "Wróć" inherit the page lip through `PageButton`. Commit messages in Polish; no questions asked.

- Hint-label fix: moved the keypad column 80 px right (1040 -> 1120) instead of shrinking `margin.gap` (only ~16 px gain) or crossing the margin line; hint rectangles end at 1110, 10 px before the keypad. Written column and tall drawings untouched (their fit tests are green and unchanged; they sit left of the keypad with lots of room). Would change if the maintainer wants the keypad flush at its old place: then labels need fewer ticks labelled or a smaller `margin.gap`.
- p6: the counter uses a `ChunkyFace` (never pressed) so phase 7 has a ready `face` container; kept the 96 px gear (touch target) rather than 104; the pressed pill colour stays a face variant (`0xfff0cc`, the old speaker value) inside `hudPill.ts`. Commit messages in Polish; no questions asked.

- p7: bounce target for select/drag/coins/clock is the OK face (as the plan); kept `ANIMATION` tokens from phase 1 unchanged. Wobble runs as one `tweens.chain` and is stopped by the next wobble, a stage change or "Wróć". Pop is not played when the flight is skipped (reduced motion). Row 7.4 left unticked (e2e by the orchestrator). Commit message in Polish; no questions asked.

- p8: input during the stagger is never blocked: zones are not part of the face and stay live from the first frame; a tap calls `ChunkyFace.press()`, which first settles the face at rest (alpha 1, y at rest) and only then presses, so no tap lands on an invisible tile. The keypad entry field is not staggered. Beads: removed the unused `dots.radius/gap/ringWidth` tokens; layout tests read `BEADS`. Commit message in Polish; no questions asked. Row 8.3 left unticked (e2e by the orchestrator).

- p9: stars are one Graphics each (origin-centred, scaled) rather than a shared row; the earned-star group pops after the row, text appears with it (alpha), burst after its pop. `starBurst.ts` has no tween so it is not on the tweening-file list; a separate wiring case checks the burst sits behind the reduced-motion branch. Burst depth is `ROOM_LAYOUT.depth.celebrate`. Row 9.2 ticked for the grep/guard part; the break's red is the orchestrator's e2e. Commit message in Polish; no questions asked.

- p10: option 1 of research (d): modify the zero, rename to "Martynka Next" (name IDs 1, 3, 4, 6, 25; 16/17 absent in the file), `OFL.txt` shipped beside the font with one added line; rejected a second digits font and a scaled O. Pinned fontTools 4.61.1 and fixed timestamp 2026-10-22 for byte-identical rebuilds. Rows 10.1-10.3 ticked; 10.4 left (e2e + browser proof by the orchestrator). Would change if Chromium rejects the file: use the fallback in section 5. Commit message in Polish; no questions asked.

- p11: `AGENTS.md` unchanged (grep found no repeated facts). Follow-up entries 1, 4, 13, 14 are my wording of deferred items the plan named loosely (digits/dice, sound against the pop, hint labels, backdrop staleness); the trigger text is the part to review. Commit message in Polish; no questions asked.
