# Handoff — `final-sound` (slice S-16b)

Written by `/10x-e2e final-sound phase 9` of run 2026-10-15-fix-s16bcd. Phases 1-9 are done and committed; phase 10 (e2e: broken or hanging sound, sounds offline) is pending. Do not get wrong: sound specs must use `test.use({ serviceWorkers: 'block' })` and count requests with `page.on('request')` (the hook build is a production build; its service worker precaches every sound, music included); the settings panel has three On/Off groups with the same button labels, so scope "Włączone"/"Wyłączone" to a group by its name.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + p4 723fef8 + p5 ee4336b + p6 d073e7c + p7 dc3e930 + p8 2d8ef9f + p9 54b1ee4 + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (phase 10 still to run) |
| `## Progress` rows remaining | 9.7 [human]; 6.3, 7.5, 8.3 [reviewer]; 7.4 [visual]; phase 10 rows |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/final-sound.spec.ts` | 3 tests: #11 round cues (answer-retry, answer-right, star, round-bonus, no music-loop), #16 panel-open/variant-pick/purchase in order, #14 parent toggles + lazy music + reload + new context |
| `playwright.config.ts` | `final-sound` added to `ROUND_SPEC` |
| `context/changes/final-sound/e2e-break-p9d.patch` | new break patch (RoomScene.dispatch without `panelCue`); p9a-c already existed |
| `context/changes/final-sound/plan.md` | rows 9.1-9.6 ticked |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| npm test | 3029 passed (baseline 3029, +0) |
| sample E1-E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test ... --workers=4` | 107 passed (baseline 104, +3); the spec alone 3 passed |
| break p9a (`TaskScene.submit` without `playRoundCues`) | #11 red: `answer-retry` outcome undefined (the retry cue is requested in the same call as answer-right, so it fails first); restored. Meta-check: the hook log is written by the service at every `play`, so red proves the missing request in the event, not silence |
| break p9b (`applySettings` without `setPrefs`) | #14 red: no music request after "Zatwierdź" (`requests.length` 0); restored |
| break p9c (music in the boot queue) | #14 red at "zero requests before": `music-loop.m4a` already requested; restored. Meta-check: proves laziness, not audibility |
| break p9d (`RoomScene.dispatch` without `panelCue`) | #16 red: filtered cues `[]` instead of `panel-open, variant-pick, purchase`; restored (git checkout of the file) |
| ports 4397/4398 | no listeners after the runs |
| Chromium | launch fails intermittently (MachPortRendezvous), usually works on a repeat plain run; no sandbox bypass used |

## 4. Next command

`/10x-e2e final-sound phase 10`

## 5. Open

- Manual rows: 9.7 [human] (iPad listen), 10.6 [human]; 6.3, 7.5, 8.3 [reviewer]; 7.4 [visual].
- Spec limits: audibility and the unlocked context on iPad are not proved (outcome `played` means the service called Phaser, not that sound came out).

## 6. Autonomous decisions

- p9d patch created in this step (the plan named it, the file did not exist). Would change: the plan dropping (b).
- The stage purchase in #16 is made first (one tap, a `purchase` cue), then the order panel-open, variant-pick, purchase is asserted on the log after it, and `purchase` count is stage + 1. Would change: a stage that stops cueing.
- #11 makes a wrong first answer in round 1 (retry cue), so the bonus cue is asserted in a clean round 2 (`bonus` 2, exactly one `round-bonus`). Would change: a cheaper way to get a clean round.
