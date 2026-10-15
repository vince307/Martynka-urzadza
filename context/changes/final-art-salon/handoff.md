# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 8 step: a loading screen is drawn in `BootScene.preload` and the unlock card shows the `book` icon through `ArtImage` (commit d9f1fbe). The next agent must not get wrong: the deliberate break of row 8.2 was NOT observed (Chromium died on launch after the full e2e), so 8.2 stays open for the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-7 `d5d6993`, `bab7ad7`, `200d188`, `b6b0b77`, `9f5a798`, `9364408`, `82240ec`; phase 8 `d9f1fbe`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-7 done except `[human]` 2.5 and `[visual]` 4.7, 5.3, 5.4, 6.4, 7.4; phase 8: 8.1 ticked, 8.2 open (break), 8.3 `[visual]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/LoadingScreen.ts` | page-colour backdrop, title, progress bar drawn in code; `progress(0-1)`, `destroy()` |
| `src/scenes/BootScene.ts` | creates the screen first in `preload`, `load.on('progress')` redraws the bar inside try/catch (a drawing failure only warns), `create` destroys it |
| `src/data/layout.ts`, `src/data/pl.ts` | `LOADING_LAYOUT`; `pl.loading.title` |
| `src/ui/widgets/UnlockCard.ts` | book = `ArtImage` of `ART_KEYS.icon('book')` (stand-in box "książka" if missing); the drawn book is gone |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | both pass |
| unit incl. deploy tests, sample E1-E6 | `npm test` 2939 (branch baseline 2939, delta 0: scene/widget code), deploy and ops OK, six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | full suite observed: 94 passed (--workers=4), delta 0 |
| Deliberate break | not observed: `progress` callback without the try/catch plus a throw was applied, `seed`+`first-launch` run once showed `first-launch` age-8 failing, but Chromium was crashing on launch (MachPortRendezvous) in that and the later runs, so the red cannot be told from the sandbox failure. Break restored (BootScene identical to the committed file). Orchestrator: apply that edit (remove the try/catch in the `progress` handler, add `throw new Error('break')`), run `seed.spec.ts` + `first-launch.spec.ts`, expect red; meta-check: it proves the bar cannot block the start (error boundary), not how it looks |

## 4. Next command

`/10x-implement final-art-salon phase 9`

## 5. Open

- ORCHESTRATOR: the 8.2 break above; tick 8.2.
- Visual 8.3 (and 4.7, 5.3, 5.4, 6.4, 7.4): loading screen at 1440 and 1024 (throttle the network), "Nowa umiejętność!" card with the book.
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough.
- Phase 9 docs: design-gaps row 22 narrowed (book now from the icon set; kit art P2.6 still open), new row for the code-drawn loading screen (brief P2.2), plus stand-in room, room-art line, no in-between backgrounds P3.6. The `UnlockCard` and `LoadingScreen` comments already name the gaps.

## 6. Autonomous decisions

1. The title on the loading screen is drawn with the task font family, which is not loaded yet in `preload`; the browser fallback shows until create. Would change: the visual gate finds the fallback ugly (then draw it with an explicit system font).
2. A failure while drawing the bar is caught and logged, so loading continues; the screen itself is created without a guard (a plain rectangle, text and graphics). Would change: the orchestrator's break shows the guard is not what keeps the start alive.
3. The book on the unlock card is the existing counting icon `book` (256x256 WebP), not new art; the label of the stand-in is its noun.
