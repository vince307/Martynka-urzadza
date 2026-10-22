# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-implement` step of phase 11. Phase 11 is committed as `6b2c84b`: CLAUDE.md describes the change (font name fixed, `npm run font`, a Notebook polish block), `follow-ups/review-fixes.md` holds 14 open entries and 5 closed ones with `Trigger:` lines, the seam sweep found nothing to fix. The next agent starts phase 12 (e2e spec `tests/e2e/notebook-polish.spec.ts`).

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` |
| Commits | p1 `a659097`, p2 `b0a0c89`, p3 `626cf71`, p2 fix `35aba94`, p4 `26f5c23`, margin fix `89b265e`, p5 `ceaab1b`, hint-label fix `5d901ff`, p6 `edfbf29`, p7 `73e778f`, p8 `639a467`, p9 `374c909`, p10 `e26f8b3`, p11 `6b2c84b`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` unchanged by this step |
| `## Progress` rows remaining | 25 (`grep -c '^- \[ \]' plan.md`); rows 11.1-11.4 ticked with `6b2c84b`; 11.5 (e2e by the orchestrator), 11.6 [reviewer], 11.7 [visual], 11.8 [human] left; rows 10.1-10.3 ticked with `e26f8b3`; 10.4 (full gate green here, e2e and the `fontHealth === 'loaded'` proof by the orchestrator) and 10.5 [visual] left; rows 9.1, 9.2 ticked with `374c909`; 9.3 (full gate green here, e2e by the orchestrator) and 9.4 [visual] left; rows 8.1, 8.2 ticked with `639a467`; 8.3 (full gate green here, e2e by the orchestrator) and 8.4 [visual] left; rows 7.1-7.3 ticked with `73e778f`; 7.4 (e2e by the orchestrator) and 7.5 [visual] left; 4.4, 4.5, 5.4, 5.5, 6.4, 6.5 still left |
| Working tree | clean after the docs commit |

## 2. Artifacts

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
| `npm run lint` / `typecheck` | OK |
| `npm test` | baseline 3736 + 11 (p1) + 0 (p2) + 4 (p3) + 0 (fix) + 3 (p4) = 3754 passed; deploy scripts OK; `sample` E1-E6 exit 0 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| fix check | `notebookGeometry` test now expects 8 marks `[244 ... 944]` and every mark inside `face`; `fillPaper` has no band (no seam by construction) |
| deliberate break 1 | `LIPS.answer.offset` 8 -> 40: lip-overlap case in `layout.test.ts` red; restored, green |
| deliberate break 2 | `prefersReducedMotion()` replaced by `false` in `chunky.ts`: "checks the preference before the tween" red; restored, green |
| meta-check | the overlap case reads the real `TASK_LAYOUT`/`LIPS`; the wiring case is a source regex, so it proves the check is present, not the runtime behaviour |
| p5 | unit 3754 -> margin fix +3 (3757) -> p5 +2 (3759) = baseline 3736 + 23; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p5 deliberate break | `LIPS.page.offset` 8 -> 60: both new lip cases red; restored. Moving the `PageButton` press into `pointerup`: no unit red (as the plan predicts); the fire moment is proven only by e2e (`first-launch`, `task-round`, `adaptive`) at the orchestrator |
| margin fix break | `promptBeside` back to x 620 / maxWidth 800: the "right of the margin line" case red; restored. Meta: the case checks the layout tokens, not the Phaser wrap in the scene |
| p6 | unit 3759 -> hint fix +0 (3759) -> p6 +1 (3760) = baseline 3736 + 24; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p6 deliberate break | `HUD_PILL.height` 104 -> 140: the new HUD pill case red; restored. Meta: it went red on the `height === HUD_PILL.height` assertion (HUD_LAYOUT heights are literals, so no overlap appeared); the overlap part reads the real `TASK_LAYOUT.dots`, `BEADS`, `HUD_LAYOUT` rects and is not proven by this break |
| p6 grep | `grep -n tweens SettingsIcon.ts` empty; `dialogSessions.test.ts` green unchanged |
| p7 | unit 3760 -> 3769 = baseline 3736 + 33; lint, typecheck, deploy scripts, `sample` E1-E6, build OK; `grep shakeMs|shakeDistance|shakeSegments|cameras.main.scrollX src` empty |
| p7 deliberate break | (a) `setValue` moved from `onStars` into the `starLanded` handler: 2 cases red; (b) `starLanded` emitted before the flight: the `flyStar` case red; both restored. Meta: regexes slice the `onStars`/`onStarLanded`/`flyStar` bodies, so a stray occurrence elsewhere does not satisfy them; they prove source order, not the rendered motion or the `counterText` specs (orchestrator e2e) |
| p8 | unit 3769 -> 3772 = baseline 3736 + 36; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p8 deliberate break | (a) `prefersReducedMotion()` branch in `ProgressDots` replaced by `true`: 2 wiring cases red; (b) the `entering` settle in `press()` replaced by `false`: the stagger/press case red; both restored (`git checkout`), green. Meta: source-order regexes, they prove the branch and the settle exist, not the runtime; the tap-during-entrance proof is the orchestrator's e2e (round specs tap tiles at once) |
| p9 | unit 3772 -> 3774 = baseline 3736 + 38; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p9 deliberate break | summary "Kolejna runda" shown through a delayed call after the pops: unit suite stays green (no unit guard on timing, as the plan predicts); expected red at the orchestrator: `task-round`/`adaptive` specs that tap `nextRound` at once. Restored. Meta: the real proof of tappable-at-once is e2e only |
| Playwright | not run: Chromium cannot start in the sandbox; the orchestrator runs e2e (expected baseline + 0; `task-round`, `drawn-tasks`, `money-pay`, `clock-set` tap the same zones) |
| p10 | unit 3774 -> 3780 = baseline 3736 + 44; lint, typecheck, deploy scripts, `sample` E1-E6, build OK (`e2e hook: absent`); `dist/sw.js` lists `fonts/MartynkaNext.ttf` and not the old file; `grep AtkinsonHyperlegibleNext src tests scripts vite` lists `scripts/make-font.py` (input) and `tests/fontZero.test.ts` (the original to compare with) |
| p10 reproducibility | `npm run font` twice, `cmp` of the two outputs IDENTICAL (sha1 `42ff8ec7c87a873fd6381514c3e19d54d212309c`); fontTools 4.61.1 pinned in the script (refuses other versions) |
| p10 render | PIL render at 120 px: plain oval 0, narrower than O, 1/7 and ąę unchanged (not a browser check) |
| p10 deliberate break | `fontZero.test.ts` pointed at the original in `designs/`: 3 cases red (2-contour, names, copyright/Modified), 3 green; restored (the env seam removed), 6 green. Meta: contour count is read from `glyf`/`loca` bytes and the test asserts the original has 3, so the red is real and independent of the script |
| p10 Playwright | not run: Chromium cannot start in the agent sandbox; the orchestrator runs e2e (expected baseline + 0) and the plain zero / `fontHealth === 'loaded'` check in a browser (OTS acceptance of the modified file is NOT proven here) |

| p11 | `npm run lint`, `typecheck`, `npm test` (3780 passed = baseline 3736 + 44, +0 in p11), deploy scripts, `sample` E1-E6, `build` (`e2e hook: absent`) OK; rows 11.1-11.4 checks pass (`validate-rule-files.sh` PASS, gaps 155-164 present, no gradient code outside `kitDraw.ts`, one `generateTexture` in `starBurst.ts`, protected files unchanged vs main) |
| p11 deliberate break | none: docs-only phase, the plan asks for none |
| Playwright | not run (sandbox); 11.5 is the orchestrator's |

## 4. Next command

`/10x-e2e notebook-polish phase 12`

## 5. Open

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
