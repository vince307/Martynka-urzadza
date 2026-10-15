# Handoff — `final-sound` (slice S-16b)

Written by the `/10x-plan-review` step of autonomous run `2026-10-15-fix-s16bcd`. The plan is reviewed (VERDICT: PROCEED, 0 critical, 6 warnings fixed in `plan.md`, 3 observations); no product code changed. The next agent must not get wrong: e2e request counting runs with `serviceWorkers: 'block'` / `page.on('request')` (the SW install precaches every sound, `music-loop` included), and a decode failure in Phaser 4.2.1 never fires `loaderror` — sound health and the music status come from `cache.audio.exists`.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 on top of `a1625be`: change identity, research, plan, `docs(final-sound): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 45 of 45 (`grep -c '^- \[ \]' plan.md`; the plan step's "49" was an arithmetic slip, F9) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/reviews/plan-review.md` | review report: Phaser 4.2.1 claims verified in source, answers to the planner's 3 questions, `Trigger: S-16b` follow-up check, PRD check, findings F1–F9, VERDICT line |
| `context/changes/final-sound/plan.md` | fixes applied: Phase 2 `roundCues` (`bonusEarned`, reducers `startRound/answer/nextSolutionStep/next`, `star` only on entering `done`), `dragCue` (mat total must grow); Phase 3 test (`FILE_ERRORED: 16`, `vi.stubGlobal('HTMLImageElement', …)`); Phase 7 music (`complete` + `cache.audio.exists`, `attachLoader` starts when `prefs.music`); Phase 9 (c) and Phase 10 (b)/seed (SW blocked, page-level requests, music request after reload); row 9.7 extended; 4 Known risks added |
| `context/changes/final-sound/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/final-sound/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-sound` |
| `grep -c '^Driver: ' plan.md` / `grep -c '^## Progress'` | 10 / 1 |
| Phaser source reads (`AudioFile.js` `onProcess`/`getAudioURL`, `File.js` `onProcessError`, `LoaderPlugin.js` `fileProcessComplete`, `WebAudioSoundManager.js` `unlock`, `BaseSoundManager.js` `update`, `BaseCache.js` `add`, `device/Audio.js`, `loader/const.js`) | plan claims hold; new facts: no `FILE_LOAD_ERROR` on decode failure, `FILE_ERRORED` = 16 |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source changed (baseline on main a1625be inherited, unverified) |

## 4. Next command

`/10x-tdd final-sound` (phase 1, `Driver: tdd`)

## 5. Open

- Known risks in `plan.md` `## Known risks`: Chromium without AAC (e2e proves OGG only), HTML5 Audio fallback trimming (skip non-`AudioBuffer`), `locked` clears one frame after `resume()`, `UIScene` shutdown detach, SW install competing with the boot load.
- e2e phases 9–10 use the request-file protocol (`e2e-request-p9.md`, `e2e-request-p10.md`, patches `e2e-break-p9a..d`, `p10a..c`); p9a–p9d are prepared by phases 6–7.
- Manual-only Progress rows (human checklist): 9.7 `[human]` iPad listening — unlock on first touch, effects with speech, loudness, music loop click, silent switch, plus the author's decisions (`purchase` on a free change, single `answer-retry`, `tap` + `round-bonus`); 10.6 `[human]` iPad offline sounds; 7.4 `[visual]` the "Dźwięki" section; `[reviewer]` rows 1.4, 2.4, 3.4, 4.4, 5.5, 6.3, 7.5, 8.3.
- DESIGN-GAPs: 114 to add (phase 7); 35 closes (phase 6).
- Follow-ups to write in phase 8 (`follow-ups/review-fixes.md`): VO3 carried forward, loop crossfade, music ducking, one-format precache / re-encode, `tap` on answer inputs, iPad silent switch, WebKit in Playwright.

## 6. Autonomous decisions

- No questions asked (contract rule 1). Every finding triaged in place: WARNINGs F1–F6 fixed in `plan.md` (each fix obvious and scoped), F7 recorded under Known risks, F8/F9 fixed. Would change: an implementer finding a fix contradicts code it touches — then record it in the phase handoff.
- F1 chose `serviceWorkers: 'block'` + page-level counting over filtering SW requests by URL. Why: matches `load-and-tab-guard.spec.ts`, and `page.route` cannot intercept SW-handled fetches anyway. Would change: a test that needs the SW (the seed keeps it, counting page-level only).
- F2 chose a test stub over a `typeof HTMLImageElement` guard in `cutLoad`. Why: product code stays as shipped in load-and-tab-guard. Would change: a lint rule against `vi.stubGlobal`.
- F6: music starts with the task screen after a reload (not on the welcome screen). Why: `UIScene` owns the loader and does not exist on the welcome screen; music is off by default. Would change: the author asking for music on the welcome screen.
- No driver changed: phases 1–3 `tdd`, 4–8 `impl`, 9–10 `e2e` (after the features they prove). `[human]` decisions against the PRD: none; FR-017 silenced by the parent's effects toggle is the author's roadmap decision.
