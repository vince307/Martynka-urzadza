# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-impl-review` step of run 2026-10-31-house-cross-section. The slice is `impl_reviewed` with `MERGE: CLEAR`: no CRITICAL, two WARNINGs fixed in `6431dde`, four observations recorded. The next agent must not tick the `(CI at ship)` rows 2.7 and 5.11 before the ship step reads the named CI/Deploy log lines.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | docs, p1 `158004b`, p2 `c470f94`, p3 `518f581`, p4 `b46f63f`, p5 `5d59882`, p6 `4112bd0`, epilogue `e18e4f5`, review fix `6431dde`, + this review/handoff commit |
| pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 7 (`grep -c '^- \[ \]' plan.md`): 2.7 and 5.11 `[reviewer] (CI at ship)`, 5.6 `[visual]`, 5.7-5.10 `[human]` |
| working tree | clean after the review commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-cross-section/reviews/impl-review.md` | review report (F1-F6, suites, breaks, product checks), ends with the MERGE line |
| `src/ui/widgets/roomCapture.ts` | `captureRoomMiniature`: unused `recreate` parameter removed, comment names the real restore path (F2) |
| `tests/roomVisitWiring.test.ts` | "the house button is hidden while blocked …" also guards `blocked = open \|\| this.card` and `this.card = true` in the last-purchase branch (F1) |
| `context/changes/house-cross-section/follow-ups/review-fixes.md` | item 11 corrected; items 19-21 added |
| `context/changes/house-cross-section/change.md` | status `impl_reviewed` |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (also after the fix) |
| `npm test` | `Tests 4089 passed (4089)` = baseline 4057 + 32 (houseCells +21, houseArt +6, houseSceneWiring +6, layout +1, roomVisitWiring +3, roomVisit −5); unchanged after the fix |
| deploy + ops shell tests, `sample` E1-E6 | OK, OK, exit 0 x6 |
| `npm run build -- --outDir <scratch>` | `e2e hook: absent (2 chunks checked)`; `sw.js` lists the 3 `assets/house/*.webp`; no `e2eArt` in `_app/*.js` |
| `npx playwright test --list \| tail -1` | `Total: 179 tests in 47 files` = 174 + 5 |
| full e2e `--workers=2` (load ~30-34) | 175 passed, 4 failed (47.8 min); 175 + 4 = 179. Failed, all outside this slice: `adaptive.spec.ts` #13 "Nowa umiejętność!", `fox-guide.spec.ts` "#11 no fox on the unlock card", `stale-tab.spec.ts` "#2 B-1 a second window …" and "#2 B-1 without BroadcastChannel …" |
| `--last-failed --workers=1` | 4 passed (4.4 min) |
| break: `houseWakeVisit` returns the current room | `tests/houseCells.test.ts` 1 failed / 20 passed; restored |
| break: `blocked = open` (card dropped) | `tests/roomVisitWiring.test.ts` house-button case red; restored |
| break (e2e, handoff A): wake keeps `?? this.visiting` AND `onSleep` reset removed | FR-039 test alone red (`Expected: "kitchen"`, `Received: "salon"`); restored. Meta-check: the spec protects the wake+sleep pair, which is the FR-039 contract |
| save format | `SAVE_VERSION` 5; no diff in `src/core/save.ts`, `src/core/migrations`, `tests/fixtures` |
| hooks | `.claude/settings.json`, `.claude/hooks/*` unchanged since 2026-10-12; no bypass |

Note: the e2e break left `dist/` and `dist-e2e/` built from the broken source; both are rebuilt by Playwright's `webServer` on the next run (no server is left running).

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- `[visual]` 5.6: the eight house frames (plan row 5.6) into `reviews/visual-review.md`.
- `[human]` 5.7 roller blind as "sylwetki" and the kitchen shown closed (P5); 5.8 copy "Dom"/"Wróć do pokoju" and the corner button; 5.9 green salon board in a cream cell (gap 178); 5.10 real tablet offline.
- `[reviewer] (CI at ship)` 2.7: Deploy workflow, job `deploy`, step `Smoke check (deploy)` prints `ok +precache covers house pictures — 3 of 3 house pictures precached`. 5.11: workflow `CI`, job `check`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Follow-ups (`follow-ups/review-fixes.md`): 19 decode failure of a house picture logs nothing (`HouseScene.loadArt`), 20 stand-in shell numbers in `HouseView.standInShell`, 21 no browser test for the "Dom" button under the celebration card (`RoomScene.redraw`, source guard only).

## 6. Autonomous decisions

- Drift and quality reads done in this session instead of two subagents: the code diff is about 700 lines and was read whole. Would change: a diff too large for one read.
- F1 (follow-up 11 claimed a test that does not exist) fixed with a source guard, not a new e2e test: the behaviour is right in code and a browser case needs a full `finishSalon` run under load. Would change: a regression in the card path, or a cheap way to reach the card in e2e.
- F2 `recreate` removed instead of wiring it to `RESTORE_WEBGL`: `HouseView.clear()` already removes the textures before every render. Would change: `HouseView` keeping textures across renders.
- Build checked in a scratch `--outDir` so the running e2e servers kept their `dist/`. Would change: nothing; `npm run check:build` belongs to CI.
- MERGE: CLEAR. Would change: a red `check` at ship, or the visual gate finding a spill or a missing miniature.
