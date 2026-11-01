# Handoff — `hangar-module` (slice S-30)

Written by the `/10x-impl-review hangar-module` step of run 2026-10-31-space-base. The full plan (phases 1-4) is reviewed, two findings were fixed in `c5df38d` and `78d7f1d` (test and fixture only, nothing drawn changed), and change.md is `impl_reviewed`. The next agent must not miss that `tests/fixtures/save-v6-bridge-done.json` changed in this step and is frozen from the merge on.

## 1. State

| | |
|---|---|
| Branch | `feat/hangar-module`, cut from `main` at `a4a0aee` |
| Commits | 19 on the branch after this step's docs commit: phases `041e279`, `de5ab57`, `862dca7`, `baa785b`; review fixes `c5df38d`, `78d7f1d`; the rest docs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5: 1.8, 3.10 [reviewer] (CI at ship); 3.7, 3.8, 3.9 [human] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/hangar-module/reviews/impl-review.md` | the review report: F1 critical fixed, F2 warning fixed, O1-O3; ends with the MERGE line |
| `tests/e2e/hangar-module.spec.ts` | F1: the #2 pixel oracle compares with the airlock colour (97,132,140) and cream (`AIRLOCK`, `CREAM`, `farFrom`), before the cell states; header comment corrected |
| `tests/fixtures/save-v6-bridge-done.json` | F2: `rooms.bridge.chosen` uses the real Mostek slot ids (telescope, shelf, rug, plants) |
| `tests/fixtureLoadPath.test.ts` | F2: the "save-v6-bridge-done meets the Hangar" case asserts `roomStateProblems` is empty |
| `context/changes/hangar-module/follow-ups/review-fixes.md` | new item 5 (the e2e cannot see the after picture; held by the unit snapshot) |
| `context/changes/hangar-module/plan.md` | row 1.7 ticked with the teacher-read note |
| `context/changes/hangar-module/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | exit 0 |
| `npm test` | Tests 4194 passed = baseline 4185 + 9 (the F2 assertion sits in an existing case: +0) |
| deploy/ops shell tests, `sample` E1-E6 | exit 0, `Naruszenia: 0` |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e full `--workers=3` (after both fixes, Codex job loading the machine) | 184 passed + 5 load timeouts (fox-guide #11, money-pay #11, save-transfer #2 #10, stale-tab ×2); `--last-failed --workers=1` 5 passed → 189 = baseline 187 + 2; ports 4397/4398 free after |
| Break: Hangar row removed from `HOUSES['base-1']` | 5 unit cases red (tdd phase 2 RED evidence holds); restored |
| Break: `ROOM_SCENE_FILES.hangar.after` → `hangar-before` | `tests/roomArt.test.ts` 2 red (snapshot, orphans); restored. Meta-check: the e2e cannot see this, the unit snapshot written from the pack does |
| Break: Hangar row `place: 2`, e2e #2 | old cream-only oracle: pixel line passed, failed only at cell states (proof F1 was real); new oracle: red at the pixel poll; restored; `hangar-module` + `base-cross-section` specs 5 passed |
| Break: old fixture vs new assertion | `unknown-slot` red; fixed fixture green |
| boundary | `git diff a4a0aee -- src/core/save.ts src/core/migrations` empty; `src/scenes src/core src/ui src/main.ts src/testing` unchanged; hooks untouched (mtimes before the branch base) |

## 4. Next command

`/10x-archive hangar-module`

## 5. Open

- [reviewer] (CI at ship) 1.8: Deploy job `deploy`, step `Smoke check (deploy)`, `ok   precache covers room pictures — 100 of 100 room pictures precached`; 3.10: Deploy job `build`, `Tests  4191 passed | 3 skipped` (4182 + 9) and `e2e hook: absent (`.
- [human] 3.7 accept the Hangar costs 6-21 = 100; 3.8 accept the Hangar wording (gap 201) and the Hangar as the last module (gap 196); 3.9 real tablet offline: the Hangar pictures draw.
- Follow-ups: `context/changes/hangar-module/follow-ups/review-fixes.md` items 1-5 (5 new: `ROOM_SCENE_FILES` after picture held by `tests/roomArt.test.ts` only).
- O2: the longest task label "Ustaw skrzynie z częściami" (`pl.room.tasks.stackCrates`) is shrunk by `labelScale` and was not in a screenshot frame; a visual check at the ship's manual pass is enough.

## 6. Autonomous decisions

- F1 classed CRITICAL (a spec assertion that cannot detect the rule it names) and fixed in the spec, not in data: chosen to compare with the measured airlock colour and keep the cream check; rejected: a hook texture-key check (`HouseSnapshot` has no per-cell art key and `src/testing` must not change in this slice). Would change: a hook field naming each cell's drawn mode.
- The after-picture break (phase 4 break 4) judged out of the e2e risk, not a gap: the unit snapshot catches it (re-executed). Rejected: an e2e check on the done Hangar miniature (before and after are the same at the window point; another point would need a new measured oracle for a rule already held). Would change: drawing the background from something other than `ROOM_SCENE_FILES` (follow-up 5 trigger).
- F2 fixed now rather than recorded: the fixture becomes frozen at the merge, a later fix would be an edit of a frozen fixture. Would change: nothing.
- `room-art-hangar.json` accepted as the second added fixture: it is a `ROOM_ART` snapshot like the three existing ones, not a save fixture.
- §4 stays `/10x-archive`: the fixes change no drawn pixel (test and fixture only), so the phase-3 visual gate stands.
