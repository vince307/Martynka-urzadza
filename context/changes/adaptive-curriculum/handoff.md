# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-implement adaptive-curriculum phase 8`. Phase 8 committed (`b0dc1fe`). Row 7.3 ticked (orchestrator e2e 14/14 on `e584911`). Rows 5.5, 6.5, 7.5, 8.4 are [reviewer], 7.6 [visual], 8.5-8.10 [human].

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, 2 `1c384c5`, 3 `ee93ff9`, 4 `dba1791`, 5 `0aedeff`, 6 `58bf417`, 7 `e584911`, 8 `b0dc1fe`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.5, 6.5, 7.5, 7.6, 8.4 [reviewer]/[visual], 8.5-8.10 [human], phase 9 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/pick.ts`, `tests/pick.test.ts` | `buildRound` removed (unused since phase 5) with its 1 test; header comment updated |
| `src/scenes/TaskScene.ts` | stale "until phase 7" comment in `finishRound` replaced |
| `docs/design-gaps.md` | rows 22 (book art, S-16), 23 (card narration), 24 (card after "Do pokoju") |
| `context/changes/adaptive-curriculum/follow-ups/review-fixes.md` | new: risk #13 and #12 wording, `chromium-hook`/4397 in test-stack, ` = ?` (S-16), S-11 save of the full learner and floor, "earlier learner save", S-08 history field, S-17 calibration and floor formula; each with `Trigger:` |
| `CLAUDE.md`, `AGENTS.md` | Current state paragraph for the adaptive curriculum; AGENTS.md structure line (body 395 words) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (`npm test`) | baseline 882 - 1 (`buildRound` test) = 881 passed; deploy tests OK x2; `sample` E1-E6 `Naruszenia: 0` x6 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS (4 files); break: a missing `NOPE.md` added to `RULE_FILES` in `autonomous-run.env` -> `FAIL` (missing: 1); env restored (no diff) |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate; expect 14 passed (+0) |

Seam sweep findings: `playable` is defined once (`pick.ts`) and imported; `pickSkills`/`firstPlayableSteps` are still used by the warm-up; `freshRound` has no stale comment; `REGISTRY_KEYS.learner` comment is current; balance keys all referenced. Only `buildRound` and the `finishRound` comment were stale.

## 4. Next command

`/10x-e2e adaptive-curriculum phase 9`

## 5. Open

- Rows 5.5, 6.5, 7.5, 8.4 [reviewer]; 7.6 [visual]; 8.5-8.10 [human] as the plan names them (cold start resets mastery; rule D calendar floor, E3 October steps 1, 2, 6 and the ~1 month lead on E3 October / E6 February; majority = `>= ceil(0.5 n)`; unlock during easing; easing = weights 20/50/30; no automatic stage advance).
- Phase 9 (e2e #13) needs `?e2eMonth=8`, parent path E4, see plan; Chromium cannot launch in agent sessions, so expect `e2e-request-s07-p9.md`.
- The proposed test-plan risk #13 and the calendar-floor calibration are in the follow-ups file.

## 6. Autonomous decisions

1. Skill questions decided in place: implement in this context, proposed commit message, stop after phase 8.
2. `buildRound` removed with its test (unit 882 -> 881); the plan allowed "- tests of the removed `buildRound`".
3. Deliberate break for 8.2 used `RULE_FILES` in the env file (the validator reads rule files from there) instead of a profile path, then restored.
4. Follow-ups written in Polish like the rest of `context/changes`; design-gap rows in English like the existing table.
5. AGENTS.md: dropped the "(sync, then bootstrap ...)" aside to stay under 400 words; it remains in CLAUDE.md.
