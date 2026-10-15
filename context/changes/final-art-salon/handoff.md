# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 9 step: docs, design gaps, follow-ups with triggers and the S-16a paragraph in `CLAUDE.md` (commit 300ea43). The next agent must not get wrong: phase 10 is `Driver: e2e` and needs the request-file protocol if Chromium does not start; the lint break planned in 9.4 (player-text literal) does not exist as a rule, see §6.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-8 `d5d6993`, `bab7ad7`, `200d188`, `b6b0b77`, `9f5a798`, `9364408`, `82240ec`, `d9f1fbe`; phase 9 `300ea43`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-9 done except `[human]` 2.5 and `[visual]` 4.7, 5.3, 5.4, 6.4, 7.4, 8.3; 8.2 ticked from the orchestrator note; phase 10 open |
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
| unit incl. deploy tests, sample E1-E6 | `npm test` 2939 (branch baseline 2939, delta 0: docs only), deploy and ops OK, six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | full suite observed: 94 passed (--workers=4), delta 0 |
| Deliberate break 9.4 | the planned break (a Polish literal in `RoomScene`) stays green: ESLint has no player-text rule. Substitute: `import { get } from 'idb-keyval'` in `RoomScene` gave `no-restricted-imports` red; restored (file identical). Meta-check: proves the scene boundary rules bite, not that text is guarded |
| Break 8.2 | from the orchestrator note (progress handler without try/catch + throw: seed and first-launch #12 red, restored) |

## 4. Next command

`/10x-e2e final-art-salon phase 10`

## 5. Open

- Phase 10 (e2e, `tests/e2e/salon-art.spec.ts`): green run and the three patch breaks (orchestrator runs them if Chromium dies).
- Visual: 4.7, 5.3, 5.4, 6.4, 7.4, 8.3. Human: 2.5 (remap rule B), 10.4 (iPad).
- Later: `/10x-impl-review`, archive (re-check `validate-rule-files.sh` after the move), ship.

## 6. Autonomous decisions

1. Break 9.4 replaced by a boundary break (see §3). Would change: the maintainer wants a lint rule for player-text literals in scenes (a new follow-up, not in this slice; the guard today is the teacher read and review).
2. Design-gaps wording for rows 105-111 is written from the code as it stands (names of tasks from `pl.room.tasks`, costs 5, 7, 9, 10, 12, 13, 15 = 71). Row 111 says pieces have no captions except on a stand-in. Would change: the visual gate shows otherwise.
3. Earlier `Trigger: S-16` items outside this slice got named conditions (or `S-16b`, `S-17`), none dropped. Would change: the maintainer prefers other triggers.
4. The `CLAUDE.md` paragraph names no path under `context/changes/`.
