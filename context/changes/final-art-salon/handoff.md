# Handoff — `final-art-salon` (slice S-16a)

Written by the phase 10 (e2e) finish step: spec `tests/e2e/salon-art.spec.ts` committed after the orchestrator's browser runs (commit 9362f3f). All phases are done; next is the implementation review. The lint break planned in 9.4 (player-text literal) does not exist as a rule, see §6.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-8 `d5d6993`, `bab7ad7`, `200d188`, `b6b0b77`, `9f5a798`, `9364408`, `82240ec`, `d9f1fbe`; phase 9 `300ea43`; phase 10 `9362f3f`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` | phases 1-9 done except `[human]` 2.5 and `[visual]` 4.7, 5.3, 5.4, 6.4, 7.4, 8.3; 8.2 ticked from the orchestrator note; phase 10 done except `[human]` 10.4 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `docs/design-gaps.md` | rows 22, 32-35, 64 narrowed or closed; new rows 105-111 (loading screen, room stand-in and art health, whole before/shadow layers, miniature, no in-between backgrounds, task names, captions) |
| `context/changes/final-art-salon/follow-ups/review-fixes.md` | 21 `Trigger:` lines: every earlier `Trigger: S-16` re-triggered (atlas, thermometer frame, hint highlight, narrator units, O3, ` = ?`, SPATIAL, wallet, plain zero, `audio.noAudio` and purchase sound to S-16b) plus rollback risk, remap rule B, GPU memory, loading and book art, costs |
| `docs/art-inventory.md` | measured weight of the salon: 26 WebP files, 1 233 242 B |
| `CLAUDE.md` | S-16a paragraph in "Current state"; `validate-rule-files.sh` PASS |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | both pass |
| unit incl. deploy tests, sample E1-E6 | `npm test` 2939 (baseline 2939, delta 0: e2e only), deploy and ops OK, six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | orchestrator-observed: `salon-art.spec.ts` 4 passed; full suite 98 passed (--workers=4), baseline 94 + 4 |
| Breaks p10 (orchestrator) | break-1-stage-twice: 2 red (#16 one tap, #16 pictures missing); break-2-no-remap: 1 red (#2 old task list); break-3-missing-texture-throws: 1 red (#16 pictures missing); each reverted with `git apply -R` |
| Deliberate break 9.4 | the planned break (a Polish literal in `RoomScene`) stays green: ESLint has no player-text rule. Substitute: `import { get } from 'idb-keyval'` in `RoomScene` gave `no-restricted-imports` red; restored (file identical). Meta-check: proves the scene boundary rules bite, not that text is guarded |
| Break 8.2 | from the orchestrator note (progress handler without try/catch + throw: seed and first-launch #12 red, restored) |

## 4. Next command

`/10x-impl-review final-art-salon`

## 5. Open

- Visual: 4.7, 5.3, 5.4, 6.4, 7.4, 8.3. Human: 2.5 (remap rule B), 10.4 (iPad).
- Later: `/10x-impl-review`, archive (re-check `validate-rule-files.sh` after the move), ship.

## 6. Autonomous decisions

1. Break 9.4 replaced by a boundary break (see §3). Would change: the maintainer wants a lint rule for player-text literals in scenes (a new follow-up, not in this slice; the guard today is the teacher read and review).
2. Design-gaps wording for rows 105-111 is written from the code as it stands (names of tasks from `pl.room.tasks`, costs 5, 7, 9, 10, 12, 13, 15 = 71). Row 111 says pieces have no captions except on a stand-in. Would change: the visual gate shows otherwise.
3. Earlier `Trigger: S-16` items outside this slice got named conditions (or `S-16b`, `S-17`), none dropped. Would change: the maintainer prefers other triggers.
4. The `CLAUDE.md` paragraph names no path under `context/changes/`.
5. Phase 10: the orchestrator fixed spec test #2 (`tapTarget(page, 'taskButton')` instead of `roomSwitch`: short of stars the task button returns to the tasks). Playwright was run by the orchestrator only; this step ran the non-browser gate.
