<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Lektor poleceń i podsumowanie rundy z „Kolejna runda” i „Do pokoju”

- **Plan**: context/changes/narrator-round-summary/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after the fixes in 3f372ca)
- **Findings**: 0 critical, 3 warnings, 7 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F3, follow-up) |
| Success Criteria | PASS |

## Evidence (observed in this review, branch at 690847b, then 3f372ca)

| Gate | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (both commits) |
| unit (`npm test` + deploy scripts + `sample` E1–E6) | 690847b: 670 passed = main 596 + 74; 3f372ca: 671 = 596 + 75 (+1 unlock test); `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rl __martynkaE2E dist/` empty |
| `npx playwright test` (plain, this session, Chromium launched) | 690847b: 8 passed = main 4 + 4 (#11 +1, #narrator +3); 3f372ca: 8 passed; ports 4397/4398 free afterwards |
| `validate-rule-files.sh` | PASS (121 paths, 0 missing) |
| Deliberate break (no browser) | `roman.ts` and `compareNum.ts` restored to main (no `speak`): `tests/taskSpeech.test.ts` + `tests/spoken.test.ts` 8 red (`expected undefined to be defined`, `… pokazuje III … not to match /[IVXLCDM]+/`); restored, tree clean. Meta-check: phase 1's tests fail on the pre-slice generators, so the RED was real even though phase 1's agent wrote production code first and stashed it — the test-first order was bent, not the evidence. |
| New test for F1 | red before the change (`unlock()` returned `undefined`), green after |
| Hook integrity | `.claude/settings.json` 10 Oct, `.claude/hooks/*` 12 Oct 15:29 — all before the slice's first commit (`ad5535b`, 12 Oct 23:22); no `--no-verify` trace; no bypass |

Seams checked: `roundEnd` removed everywhere (S-04 contract change is planned, phase 6); `TaskSnapshot.counter` gone, specs read `counterText`; hook getters-only, frozen copies, no scene imports it, installed only under `if (__E2E_HOOK__)`; scenes and new widgets hold no Polish text and no balance numbers; `src/core/narration` has no browser globals (ESLint + `tests/lint-boundaries.test.ts`).

## Findings

### F1 — Speech unlock listeners dropped before a voice is known

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/main.ts `unlockSpeech`; src/ui/narrator.ts `createNarrator().unlock`
- **Detail**: `unlock()` is a no-op while no Polish voice is loaded (Chrome/Android load voices asynchronously), but `unlockSpeech` removed both DOM listeners on the first tap anyway, so a tap before `voiceschanged` meant no gesture unlock for the whole session (iOS/E1–E2 auto-read could stay silent).
- **Fix**: `unlock()` returns whether it fired; `unlockSpeech` removes the listeners only on `true`. Test `tests/narrator.test.ts` "reports a tap before the voices load as not unlocked".
- **Decision**: FIXED — 3f372ca

### F2 — DESIGN-GAP rows and code comments out of step; stale comments

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: docs/design-gaps.md rows 9, 10, 11, 13; src/data/layout.ts `SUMMARY_LAYOUT.bonus`, `ROOM_LAYOUT.resume`; src/ui/widgets/SummaryPanel.ts; src/scenes/UIScene.ts class doc; src/data/layout.ts `GAME_EVENTS.toRoom`; src/main.ts scene-list comment; src/scenes/TaskScene.ts class doc; AGENTS.md (404 words)
- **Detail**: rows named files without a comment (SummaryPanel for 9/11, PageButton for 10, voice.ts for 13); two comments had no row number ("DESIGN-GAP:", "DESIGN-GAP (e)"); comments said UIScene had only the speaker, `toRoom` came only from the summary, scenes were in boot order. `wake` listeners in `TaskScene.create`/`RoomScene.create` were never removed on `shutdown` (unlike `toRoom`). AGENTS.md body above 400 words.
- **Fix**: comments and rows aligned, stale comments rewritten, `wake` listeners removed on `shutdown`, AGENTS.md body 400 words.
- **Decision**: FIXED — 3f372ca

### F3 — HUD buttons duplicate frame, visibility and press logic

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/SpeakerButton.ts, src/ui/widgets/RoomSwitchButton.ts, src/ui/widgets/PageButton.ts
- **Detail**: the two HUD buttons repeat zone setup, `setVisible`, `target()` and the framed drawing (`RoomSwitchButton` reads `HUD_LAYOUT.speaker` colours); PageButton and RoomSwitchButton repeat the "press began on me" guard, SpeakerButton lacks it; `RoomSwitchButton.draw` has inline icon numbers.
- **Fix**: extract a shared HUD button (frame, press guard, visibility, target, icon callback). · Strength: one behaviour for all touch buttons. · Tradeoff: touches three widgets after the e2e evidence; not needed for correctness. · Confidence: MED — S-09 adds more room UI where the base pays off. · Blind spot: whether the art (S-16) replaces these placeholders anyway.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (Trigger: S-09 or the next change to a HUD button)

### F4 — Empty utterance as the gesture unlock may not count on WebKit

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/narrator.ts `unlock` → `speakNow('')`
- **Detail**: unverified; only a device shows it.
- **Fix**: short text at `volume = 0` if the iPad listening test finds auto-read silent.
- **Decision**: DEFERRED — follow-up (Trigger: plan row 10.9)

### F5 — Same-frame double `toRoom` could restart RoomScene

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/TaskScene.ts `create` → `toRoom`
- **Detail**: `scene.switch` is queued, so `isSleeping()` is false for a second emit in the same frame. Not reachable today: the HUD switch never shows with the summary, and PageButton needs a fresh press.
- **Fix**: a `switching` flag cleared on `wake`, if a second emitter appears.
- **Decision**: RECORDED

### F6 — Parallel `romanContexts` / `romanSpeakContexts` arrays

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/data/pl.ts `tasks.romanContexts`, `tasks.romanSpeakContexts`; src/core/tasks/generators/roman.ts
- **Detail**: tied by index; reordering one mismatches shown and spoken text (the unit invariant would catch a numeral leak, not a context mismatch).
- **Fix**: one array of `{ show, speak }` pairs.
- **Decision**: DEFERRED — follow-up (Trigger: the next change to `romanContexts`)

### F7 — Teacher read: ROMAN/CALENDAR first hint holds the result; Roman letters in hints not spelled

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/data/pl.ts `tasks.romanHint`, calendar hint; src/core/narration/spoken.ts `narrationOf`
- **Detail**: pre-existing (S-02/S-03) hint content gives the result in its first step; the narrator reads it on the second try with Roman letters as the synthesizer reads them. Nothing beyond the screen leaks. Other agent notes judged: digits in sentences fine (nouns already agree; listening row 10.9), colon after a word read as a full stop is a natural pause, „zapis rzymski” is correct Polish. Details in `reviews/teacher-read.md`.
- **Fix**: hint content change in its own slice.
- **Decision**: DEFERRED — follow-up (Trigger: S-17 or the next change to `romanHint`)

### F8 — Hook targets of the sleeping summary stay non-null in the room

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/testing/e2eHook.ts `targets`
- **Detail**: `nextRound`/`toRoom` report points while `screen === 'room'`; a future spec could tap a dead point. Test-only code.
- **Fix**: `null` when the room is active.
- **Decision**: DEFERRED — follow-up (Trigger: the next change to `src/testing/e2eHook.ts`)

### F9 — Plan deviations already documented

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/taskSpeech.test.ts; scripts/sample.ts; tests/e2e/narrator.spec.ts; plan rows 1.3, 12.1, 12.2
- **Detail**: five planned test files became one `tests/taskSpeech.test.ts` (handoff §6 decision 6); sample prints only `czyta:` (row 1.3 cites `mowa:`; `czyta:` is `spokenText(speak ?? prompt)` and covers it); the narrator spec has 3 tests instead of 2; the 12.2 break was moved from `UIScene` input to the `pointerdown` rule — it still proves the touch path through the HUD. Extra test-only commit `17a296e` fixed the S-04 #11 flake.
- **Fix**: none.
- **Decision**: ACCEPTED

### F10 — Commutativity equation read with "Oblicz."

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/core/narration/spoken.ts `spokenTask` (via `isExpression`)
- **Detail**: `11 + 3 = 3 + □` is read „Oblicz. jedenaście plus trzy równa się trzy plus okienko” — odd, harmless.
- **Fix**: folded into the existing "Oblicz" follow-up.
- **Decision**: DEFERRED — follow-up (Trigger: S-17 or the next change to `drawPrompt`)

MERGE: CLEAR — no critical findings; F1 and F2 fixed in 3f372ca with lint, typecheck, unit 671 (596 + 75), build (hook absent) and e2e 8/8 (4 + 4) re-run green in this session; remaining items are follow-ups with triggers and the visual and human rows.
