# Handoff — `narrator-round-summary` (slice S-05)

The `/10x-tdd` phase 4 step of autonomous run 2026-10-12-s04-s08 wrote this file. Phase 4 (summary model, switch visibility) is committed in `1f0b93e`; `summaryView` exists and nothing calls it yet. The next agent must not get this wrong: phase 5 wires the narrator and the HUD speaker; the summary screen itself is phase 6, and `switchVisible` is drawn only in phase 9.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | docs commits, p1, p2 (`2d43a08`), p3 (`7955b4e`), p4 (`1f0b93e`), this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; implementation continues) |
| `## Progress` rows remaining | 40 (`grep -c '^- \[ \]' plan.md`); rows 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.3 ticked; 1.5 and 2.5 `[reviewer]` open |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/summary.ts` | `summaryView`, types `SummaryView`, `SummaryContext` |
| `src/core/round/view.ts` | `switchVisible = !finished && phase === 'done'` |
| `tests/summary.test.ts` (5), `tests/roundView.test.ts` (+2) | oracles from PRD FR-007 (5 + 2 bonus, second try keeps star, retype none) and FR-010/FR-011; rounds played through the reducer |
| `context/changes/narrator-round-summary/plan.md` | rows 4.1–4.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `summaryView` returned null; old `switchVisible: false`) | first `AssertionError: expected null to match object { earned: 7, bonus: 2, …(1) }`; roundView: `expected false to be true` |
| GREEN | summary 5/5, roundView 13/13 |
| Deliberate break | (a) `switchVisible` true in every phase except solution: 4 red; (b) `stars` counts any outcome (retype as star): 1 red (`expected { earned: 4, … } to match object`); (c) `>=` to `>` in the highlight: 1 red. All restored. Meta-check: rounds are built with `answer`/`next`/`nextSolutionStep`, no hand-made state |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 666 passed (branch baseline 659, +7) |
| deploy and ops scripts, `npm run sample -- E1` … `E6` | OK, OK, all exit 0 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | 4 passed (baseline 4, +0); first run had one flaky failure, rerun green |

## 4. Next command

/10x-implement narrator-round-summary phase 5

## 5. Open

Phase 4 notes: `summaryView(state, { starsTotal, nextRoomTaskCost })` returns null until `finished`; the caller decides whether `starsTotal` already includes the round (phase 6 passes the total after the round). `switchVisible` is true only in phase `done` before the round ends (the UI draws it in phase 9; `UIScene` ignores it until then).

Narrator behaviour for phase 5 wiring: `speak` cancels, then speaks after `cancelGapMs` (a second call within the gap replaces the first); `unlock()` speaks one empty utterance once and only when a voice exists; `visibilitychange` -> `cancel()` is NOT in the module (phase 5 wires it); the voices poll runs by `setInterval` and stops at the timeout or the first voice, a later `voiceschanged` still enables it. `defaultAutoRead` takes the stages list as an argument (`balance.narrator.autoReadStages`); no `Phaser` or global access at import.

Manual-only Progress rows (checklist for the maintainer):
- [ ] 10.5 `[human]` auto-read only as a session default by stage (FR-009)
- [ ] 10.6 `[human]` „Do pokoju” not highlighted until S-09 (FR-010)
- [ ] 10.7 `[human]` the room returns to the screen the child left (kit `preview.js` `roomReturn`), against `change.md` decision 3
- [ ] 10.8 `[human]` the first task after a cold start is never read aloud automatically
- [ ] 10.9 `[human]` iPad and Android listening check (PRD OQ 7)

Review rows: `[reviewer]` 1.5, 2.5, 6.5, 7.4, 10.4; `[visual]` 5.4, 6.6, 7.5, 9.4. Teacher-read observations from phase 2 (digits in sentences, hint Roman numerals, NUMBER_WORDS F9) still stand for the reviewer. Known risks F8, F9 unchanged. Deferred follow-ups: `pl.title` (S-06), solution-step dots.

## 6. Autonomous decisions

1. **`starsTotal` semantics left to the caller.** The plan gives `roomHighlighted = cost !== null && starsTotal >= cost`; which total (before or after adding the round) phase 6 passes is its decision, noted in the type comment.
   - Would change: the reviewer wants the total computed inside the model.
2. **`switchVisible` also true after a retype (`done`, no star)** because FR-011 says "between tasks", not "after a star".
3. **Gate prompts.** Commit message and between-phase prompts decided in place; stopped after phase 4. Playwright run outside the sandbox; one flaky first run (snapshot read before the scene was ready, spec `task-round.spec.ts` test 3), second run 4 passed. No mixed-phase redirect.
4. **Earlier decisions (phases 1–3)** remain in force; see the git history of this file.
