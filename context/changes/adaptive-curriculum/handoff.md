# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-e2e adaptive-curriculum phase 9` (last phase). Phase 9 committed (`7d03dc7`). Rows 9.1-9.4 ticked. Rows 5.5, 6.5, 7.5, 8.4 are [reviewer], 7.6 [visual], 8.5-8.10 [human].

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, 2 `1c384c5`, 3 `ee93ff9`, 4 `dba1791`, 5 `0aedeff`, 6 `58bf417`, 7 `e584911`, 8 `b0dc1fe`, 9 `7d03dc7`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 5.5, 6.5, 7.5, 8.4 [reviewer], 7.6 [visual], 8.5-8.10 [human] |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/adaptive.spec.ts` | test for risk #13 (proposed): step unlock card after "Kolejna runda", survives "Do pokoju", "Dalej" clears `pendingUnlock` |
| `tests/e2e/support/hook.ts` | shared hook helpers (snapshot, targets, tapTarget, playRoundRight) |
| `tests/e2e/support/welcome.ts` | `passWelcomeAsParent(page, choice)`; `passWelcome` delegates, same behaviour |
| `playwright.config.ts` | only `ROUND_SPEC` gains `adaptive` (chromium-hook project) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (`npm test`) | 881 passed (57 files), unchanged by phase 9 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e (orchestrator run on the uncommitted tree) | spec 1 passed (41.9 s); suite 15 passed = baseline 14 + 1 |
| break 1 (`startNextRound` ignores `pendingUnlock`) | red: Expected screen "unlock", Received "task" (support/hook.ts:62 via adaptive.spec.ts:65); reverted |
| break 2 (card "Dalej" does not clear `pendingUnlock`) | red: adaptive.spec.ts:76 `pendingUnlock` toBeNull, Received 4; reverted |

Review against e2e-quality-rules: no waitForTimeout, polling on hook state, test named after risk #13, independent, assertions fail under both breaks. Canvas game, so taps go through hook targets instead of getByRole (the hook is the only DOM-less handle; same as the other round specs).

## 4. Next command

`/10x-impl-review adaptive-curriculum`

## 5. Open

- Rows 5.5, 6.5, 7.5, 8.4 [reviewer]; 7.6 [visual]; 8.5-8.10 [human] as the plan names them.
- Risk #13 is "proposed": the test-plan refresh and the calendar-floor calibration are in `follow-ups/review-fixes.md`.
- Old specs keep their own hook helper copies until migrated (follow-up noted in `support/hook.ts`).

## 6. Autonomous decisions

1. Skill questions decided in place: implement in this context, proposed commit message, stop after phase 8.
2. `buildRound` removed with its test (unit 882 -> 881); the plan allowed "- tests of the removed `buildRound`".
3. Deliberate break for 8.2 used `RULE_FILES` in the env file instead of a profile path, then restored.
4. Follow-ups written in Polish like the rest of `context/changes`; design-gap rows in English like the existing table.
5. AGENTS.md: dropped the "(sync, then bootstrap ...)" aside to stay under 400 words; it remains in CLAUDE.md.
6. Phase 9: Chromium unavailable in the agent session; the orchestrator's green and break runs were used as evidence (rows ticked citing them). Spec reviewed, not rewritten. Commit message uses the orchestrator-specified title.
