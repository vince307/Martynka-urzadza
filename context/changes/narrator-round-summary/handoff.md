# Handoff — `narrator-round-summary` (slice S-05)

The `/10x-tdd` phase 3 step of autonomous run 2026-10-12-s04-s08 wrote this file. Phase 3 (voice choice, narrator module) is committed in `7955b4e`; `pickPolishVoice`, `defaultAutoRead` and `createNarrator` exist and nothing calls them yet. The next agent must not get this wrong: phase 4 is core-only (`summaryView`, `switchVisible`); the narrator is wired into the game only in phase 5.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | docs commits, p1, p2 (`2d43a08`), `7955b4e` (p3), this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; implementation continues) |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`); rows 1.1–1.4, 2.1–2.4, 3.1–3.4 ticked; 1.5 and 2.5 `[reviewer]` open |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/narration/voice.ts` | `isPolishLang`, `pickPolishVoice` (Polish by `pl` prefix after `_`/`-`, local voice first), `defaultAutoRead(stageId, stages)` |
| `src/ui/narrator.ts` | `createNarrator(synth or undefined, makeUtterance, timers, options)` returns `Narrator { available, onAvailability, speak, unlock, cancel }`; types `SynthLike`, `UtteranceLike`, `VoiceLike`, `NarratorTimers`, `NarratorOptions` |
| `src/data/balance.ts` | `narrator: { rate, voicePollMs, voiceTimeoutMs, cancelGapMs, autoReadStages }` |
| `eslint.config.mjs` | `speechSynthesis`, `SpeechSynthesisUtterance` added to `no-restricted-globals` of `src/core/**` |
| `tests/narratorVoice.test.ts` (9), `tests/narrator.test.ts` (13), `tests/lint-boundaries.test.ts` (+1) | fake synth and fake timers; no real voices |
| `context/changes/narrator-round-summary/plan.md` | rows 3.1–3.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs: `isPolishLang` false, `pickPolishVoice` null, `defaultAutoRead` false; narrator inert) | voice: 6 of 9 failed, first `pl-PL: expected false to be true`; narrator: 10 of 13 failed, first `expected false to be true` (Android `pl_PL` list available at once) |
| GREEN | 9/9 and 13/13, lint-boundaries 5/5 |
| Deliberate break | (a) `utterance.voice = voice` removed: 1 red (`expected null to be { name: 'Polish', lang: 'pl_PL' ...}`); (b) `_` dropped from the lang regex: 11 red; (c) speech globals removed from the ESLint ban: lint-boundaries red (`expected [] to include 'no-restricted-globals'`). All restored. Meta-check: the fake reproduces Android (`pl_PL`, list ready) and Chromium (empty list until `voiceschanged` or poll) |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 659 passed (branch baseline 636, +23) |
| deploy and ops scripts, `npm run sample -- E1` … `E6` | OK, OK, all exit 0 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | 4 passed (baseline 4, +0), run outside the sandbox |

## 4. Next command

/10x-tdd narrator-round-summary phase 4

## 5. Open

Narrator behaviour for phase 5 wiring: `speak` cancels, then speaks after `cancelGapMs` (a second call within the gap replaces the first); `unlock()` speaks one empty utterance once and only when a voice exists; `visibilitychange` -> `cancel()` is NOT in the module (phase 5 wires it); the voices poll runs by `setInterval` and stops at the timeout or the first voice, a later `voiceschanged` still enables it. `defaultAutoRead` takes the stages list as an argument (`balance.narrator.autoReadStages`); no `Phaser` or global access at import.

Manual-only Progress rows (checklist for the maintainer):
- [ ] 10.5 `[human]` auto-read only as a session default by stage (FR-009)
- [ ] 10.6 `[human]` „Do pokoju” not highlighted until S-09 (FR-010)
- [ ] 10.7 `[human]` the room returns to the screen the child left (kit `preview.js` `roomReturn`), against `change.md` decision 3
- [ ] 10.8 `[human]` the first task after a cold start is never read aloud automatically
- [ ] 10.9 `[human]` iPad and Android listening check (PRD OQ 7)

Review rows: `[reviewer]` 1.5, 2.5, 6.5, 7.4, 10.4; `[visual]` 5.4, 6.6, 7.5, 9.4. Teacher-read observations from phase 2 (digits in sentences, hint Roman numerals, NUMBER_WORDS F9) still stand for the reviewer. Known risks F8, F9 unchanged. Deferred follow-ups: `pl.title` (S-06), solution-step dots.

## 6. Autonomous decisions

1. **Timers and utterance injected, `visibilitychange` left to the wiring.** `createNarrator` takes `NarratorTimers` (set/clear Timeout/Interval) so fake timers drive it; the plan's `visibilitychange` -> `cancel()` is a DOM listener, wired in phase 5.
   - Would change: the reviewer wants the module to own the listener.
2. **Polling by interval ticks, not a second timeout.** The voices poll counts `voicePollMs` ticks up to `voiceTimeoutMs`, so after the timeout no timer is left (test checks `getTimerCount() === 0`).
3. **`isPolishLang` exported** from `voice.ts` next to `pickPolishVoice` (tested directly); matches `pl`, `pl-*`, `pl_*`, any case, so `en-PL` and `plx` are rejected.
4. **`unlock` needs a known Polish voice** (otherwise no-op and does not consume the one-shot), because speaking an empty utterance needs the engine to have a voice at all.
5. **Gate prompts.** Commit message and between-phase prompts decided in place; stopped after phase 3. Playwright run outside the sandbox (contract excludedCommands). No mixed-phase redirect: the whole phase was testable.
