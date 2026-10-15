# Handoff — `final-sound` (slice S-16b)

Written by the `/10x-plan` step of autonomous run `2026-10-15-fix-s16bcd`. The plan is written (10 phases: 1–3 `tdd`, 4–8 `impl`, 9–10 `e2e`), no product code changed. The next agent must not get wrong: the sound setting lives in `localStorage` (`martynka:sound`, `src/storage/soundPrefs.ts`), never in the save (`SAVE_VERSION` 3, fixtures byte-identical); Phaser's `load.audio` never falls back to the second URL, so the order is `[m4a, ogg]`; every Phaser-internal mechanism (decode, lazy music loader, audio in `cutLoad`) has a named browser proof in phases 9–10, and unit tests on numbers are not that proof.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 3 on top of `a1625be`: change identity, research, `docs(final-sound): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`, 2026-10-16) |
| `## Progress` rows remaining | 49 of 49 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only `context/changes/final-sound/` and `context/foundation/roadmap.md` written) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/plan.md` | full plan: 10 phases with `Driver:` lines, Critical Implementation Details, 18 autonomous decisions, `## Progress` (49 rows) |
| `context/changes/final-sound/plan-brief.md` | two-page brief: key decisions, phases at a glance, risks |
| `context/changes/final-sound/change.md` | status `preparing` → `planned` (metadata only) |
| `context/foundation/roadmap.md` | S-16b status `proposed` → `planning` (At a glance row and item body), frontmatter `updated` 2026-10-16 |
| `context/changes/final-sound/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-sound` |
| Success Criteria ↔ Progress (awk count per phase) | 1:1 in every phase (4,4,4,4,5,3,5,3,7,6 = 49) |
| `grep -c '^Driver: ' plan.md` | 10 (one per phase) |
| `metadata-guard.mjs inspect` / `mark-planned` | ok, `changed: true` |
| Symbols cited in the plan | checked in this step on `887849a`: `cutLoad`, `QUIET_REJECTIONS`, `isFatalSignal`, `signalOfRejection`, `BootScene.preload/create`, `REGISTRY_KEYS`, `SAVE_KEYS`, `openSettingsPanel`, `UIScene.applySettings`, `TaskScene.submit/advance/startNextRound/autoReadUnlock/syncStars/feedDrag`, `RoomScene.dispatch/showCard`, `RoundPhase`, `PanelState`, `TrayDragState.carrying`, `E2E_HOOK_MARKERS`, `ROUND_SPEC`, pack `audio-manifest.json` durations |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source changed (baseline on main a1625be inherited, unverified) |

## 4. Next command

`/10x-plan-review final-sound`

## 5. Open

- Plan-review should check: the `RoundState` field that marks the no-mistake bonus (plan names it generically, `src/core/round.ts`); whether `vi.mock('phaser')` suffices to unit-test `src/scenes/loaderCut.ts` in node (phase 3); `UIScene` lifetime for the music loader (`TaskScene` `scene.launch`, kept through the room `scene.switch`).
- e2e phases 9–10 use the request-file protocol (`e2e-request-p9.md`, `e2e-request-p10.md`, patches `e2e-break-p9a..d`, `p10a..c`); patches p9a–p9d are prepared by phases 6–7.
- Manual-only Progress rows (human checklist): 9.7 `[human]` iPad listening test — first-touch unlock, effects mixed with speech without cutting it, loudness, music loop click, silent switch; 10.6 `[human]` iPad offline sounds; 7.4 `[visual]` the "Dźwięki" section; `[reviewer]` rows 1.4, 2.4, 3.4, 4.4, 5.5, 6.3, 7.5, 8.3.
- DESIGN-GAPs: 114 to add (sound section, phase 7); 35 closes (phase 6).
- Follow-ups to write in phase 8 (`follow-ups/review-fixes.md`): VO3 carried forward, loop crossfade, music ducking, one-format precache / re-encode, `tap` on answer inputs, iPad silent switch, WebKit in Playwright.
- Known risk: Playwright's Chromium may lack AAC — then e2e proves the OGG path and only the iPad proves M4A (row 9.7).

## 6. Autonomous decisions

- No questions asked (contract rule 1); complexity HIGH, every open question from `research.md` decided in the plan's `## Autonomous decisions` (18 rows, each with the reversal condition). Summary:
- Format `[m4a, ogg]`, no own fallback. Rejected: `[ogg, m4a]` + re-queue on decode failure. Why: Phaser never falls back; AAC decodes on every iPad. Would change: a target device without AAC or an M4A decode failure seen in e2e/iPad.
- Pref in `localStorage` via `src/storage/soundPrefs.ts`. Rejected: second IndexedDB key (async read needing its own time limit). Would change: evidence that an iPad home-screen PWA loses `localStorage` differently from IndexedDB.
- Music lazy (UIScene loader, 30 s limit), effects at boot. Would change: music on by default.
- `answer-retry` on the first miss only; `purchase` for every "Wybieram" (FR-017); `tap` only on navigation buttons; `coin` for coins/blocks, not the clock. Would change: the author's listening / S-17 playtest.
- `EncodingError` + `NotSupportedError` quiet; `DOMException` name read. Would change: other game code throwing those names as real failures.
- No `?e2eSound` seam: specs break files with `page.route`. Would change: a case `route` cannot reproduce.
- `[human]` decisions against the PRD: none. `[human]` iPad listening test recorded as Progress 9.7 (and 10.6 offline).
- Step prompt fixed the roadmap edit to be committed with the plan (the skill itself would leave it uncommitted). Would change: nothing, the run fixes it.
