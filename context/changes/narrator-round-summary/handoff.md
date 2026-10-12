# Handoff — `narrator-round-summary` (slice S-05)

The `/10x-implement` phase 5 step of autonomous run 2026-10-12-s04-s08 wrote this file. Phase 5 (HUD speaker, narrator wiring) is committed in `b83cd7b`. The next agent must not get this wrong: the summary screen is phase 6; `summaryView` is still unused and `switchVisible` is drawn only in phase 9.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | docs commits, p1, p2 (`2d43a08`), p3 (`7955b4e`), p4 (`1f0b93e`), p5 (`b83cd7b`), this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; implementation continues) |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`); rows 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.3, 5.1–5.3 ticked; 5.4 `[visual]` open; 1.5 and 2.5 `[reviewer]` open |
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
| `tests/layout.test.ts` | new case for `HUD_LAYOUT.speaker`/`HUD_TOUCH_TARGETS` (touch target, inside screen, clear of the counter) |
| Deliberate break | speaker width 104 to 90 in `HUD_LAYOUT`: red `speaker width: expected 90 to be greater than or equal to 96`; restored, 9/9 green. Meta-check: the test reads the same constant `SpeakerButton` draws from |
| `npm run lint`, `npm run typecheck`, `npm run build` | OK (`e2e hook: absent`) |
| `npm test` | 667 passed (branch baseline 666, +1) |
| `npx playwright test` (one plain command) | 4 passed (baseline 4, +0) |

## 4. Next command

/10x-implement narrator-round-summary phase 6

## 5. Open

Phase 5 notes: `main.ts` creates the one narrator, puts it in the registry via the Phaser `preBoot` callback, unlocks it once on the first `pointerup`/`touchend` of `#game-container`, and calls `cancel()` on `visibilitychange` to hidden. `TaskScene` publishes `REGISTRY_KEYS.narration` (from `narrationOf`) on every render and auto-reads only on a tap on "Dalej" when `defaultAutoRead(stage)` is true (E3 is not, so tests never speak). `UIScene` enables input (only the speaker zone is interactive, no background zone) and shows `SpeakerButton` when `narrator.available` and narration is non-null. `summaryView(state, { starsTotal, nextRoomTaskCost })` still returns null until `finished`; phase 6 decides which total it passes.

Manual-only Progress rows (checklist for the maintainer):
- [ ] 10.5 `[human]` auto-read only as a session default by stage (FR-009)
- [ ] 10.6 `[human]` „Do pokoju” not highlighted until S-09 (FR-010)
- [ ] 10.7 `[human]` the room returns to the screen the child left (kit `preview.js` `roomReturn`), against `change.md` decision 3
- [ ] 10.8 `[human]` the first task after a cold start is never read aloud automatically
- [ ] 10.9 `[human]` iPad and Android listening check (PRD OQ 7)

Review rows: `[reviewer]` 1.5, 2.5, 6.5, 7.4, 10.4; `[visual]` 5.4, 6.6, 7.5, 9.4. Teacher-read observations from phase 2 (digits in sentences, hint Roman numerals, NUMBER_WORDS F9) still stand for the reviewer. Known risks F8, F9 unchanged. Deferred follow-ups: `pl.title` (S-06), solution-step dots.

## 6. Autonomous decisions

1. **Re-dispatch of phase 5.** The first agent left the work uncommitted because it ran Playwright in a shape outside the sandbox exception; this agent reviewed the tree against the plan body (all items present, including `visibilitychange` and the one-time unlock), re-ran the whole gate and committed. No code changes were needed.
2. **Registry via `preBoot`.** The narrator is set in `callbacks.preBoot` so it exists before any scene starts; the plan's "before the scenes start".
3. **Auto-read only after "Dalej"**, never from `create`, since a cold start has no gesture (manual row 10.8).
4. **`starsTotal` and `switchVisible` decisions of phase 4** remain in force. Gate prompts decided in place; stopped after phase 5.
