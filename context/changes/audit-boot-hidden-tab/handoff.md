# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

The `/10x-research` step of run 2026-10-20-playtest-boot wrote `research.md`. All of change.md's unknowns are resolved from the Phaser 4.2.1 source and the repo, and no product code was touched. The next agent must not plan Z-8 around `OtherWriterSave`/`PreviousPageSave` in `replace`: only `NewerSave` can reach that catch (`writeVerdict` is `mode === 'normal'` only), so D-5 narrows to that one refusal. The scope stays H-1, I-1 (with C-1, C-2, C-3, I-3) and Z-8, and the save format stays v4.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | 2 (`docs(audit-boot-hidden-tab): change identity (autonomous run)`, `docs(audit-boot-hidden-tab): research`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-boot-hidden-tab/research.md` | Research covering the Phaser loader and a hidden tab, how `BootScene` arms its limits, the hidden-time rule in `src/core/bootLimits.ts`, the panel lines, the e2e approach, the boundary to error card path and the skill id, the `replace` branches and `failureText`, plus the follow-up status table |
| `context/changes/audit-boot-hidden-tab/change.md` | status `new` changed to `preparing` (only the metadata guard touched it) |
| `context/changes/audit-boot-hidden-tab/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-boot-hidden-tab` |
| source reads (`node_modules/phaser` 4.2.1) | `LoaderPlugin.start`/`update` are the only callers of `checkLoadQueue`; `nextFile`/`fileProcessComplete` start no file; `VisibilityHandler` reads `document.hidden`; `Game.onHidden` → `loop.pause()` (does not stop rAF); `loaderMaxParallelDownloads` 32 / Android 6; `Config` has no `disableVisibilityChange` |
| repo greps | `writeVerdict` other-writer refusal only for `mode === 'normal'`; z-index `.overlay-save-refused` 10 < `.overlay-parent` 15; `tests/bootLimits.test.ts` pins "a tab hidden for a minute is past the cut at once"; `docs/design-gaps.md` ends at row 152 |
| lint, typecheck, tests, build, e2e | not run: research step, no product code changed (the step prompt bans builds, e2e and servers) |

## 4. Next command

`/10x-plan audit-boot-hidden-tab`

## 5. Open

- **H-1 plan inputs:** add a pure hidden-time accumulator in `src/core/bootLimits.ts`, and have `bootLimitDue`/`bootLimitWait` take the hidden total. `BootScene.preload` owns a `visibilitychange` listener (or `game.events` `HIDDEN`/`VISIBLE`), removed on `COMPLETE`/`shutdown`, and both timers re-arm on show. Add `hiddenMs` to `BootScene.publish`, `bootLoadSnapshot` (`src/testing/e2eHook.ts`) and the `REGISTRY_KEYS.bootLoad` comment in `src/data/layout.ts`. Rewrite the wall-clock case in `tests/bootLimits.test.ts` on purpose. The per-file XHR limit needs no change.
- **H-1 e2e:** use `?e2eArt=stallall` with hanging routes, plus a fake `document.hidden`/`visibilityState` and a dispatched `visibilitychange`. It proves the rule but not the real Phaser stall, because headless Chromium keeps rAF running. Real-device behaviour is inferred, not measured.
- **DESIGN-GAP 153** (a new row in `docs/design-gaps.md`): the "Obrazki" cut line for a load that spent time hidden. This needs a flag in `ArtHealthLinesInput` (`src/core/artHealth.ts`), a variant of the `cut` line, a key in `src/data/pl.ts` and a teacher read. Row 154 is **not** needed, because `pl.saveTransfer.deviceNewer` fits Z-8.
- **I-1 plan inputs:**
  - a pure `errorCode` helper beside `errorName` in `src/core/save.ts` (name or `name/skillId`);
  - `mountErrorCard` takes a reason and draws `pl.saveFailed.detail` in place of `pl.errorCard.build`;
  - `generateTask` keeps `cause.name`, sets `skillId`, and moves the tile step and a visual pool/tick check (`assertPool`/`lineTicks`, no rng) inside the `try`;
  - `TaskScene.drawPrompt` passes `task.skillId`;
  - tighten `tests/e2e/error-boundary.spec.ts` to the `Kod:` line.
- **Z-8 plan inputs:**
  - `failureText` maps `NewerSave` to `pl.saveTransfer.deviceNewer`;
  - `replace` calls `refuseWrites('newer', NEWER_SAVE)`;
  - the refused card mounts under the dialog (z-index) and shows after the dialog closes, which is D-5's own fallback. Re-focusing its button after the close is a plan detail.
- **Follow-ups** (status table in `research.md` § Historical Context): TXT-06 is in scope. A-6, A-10, G-3, L-8, ASL-05, ASL-08, ASL-09, S12-03, S12-11, S12-13, the FontFace limit and B-6 are still open or partial and deferred. The plan restates them in `follow-ups/review-fixes.md`.
- No `[human]` rows.

## 6. Autonomous decisions

- R-1 **Question scope derived from `change.md`** (unknowns, D-1..D-5 reversal conditions, follow-ups), not asked. Would change: a maintainer question that widens scope.
- R-2 **D-1 kept.** In-flight XHRs do keep their native timeout while hidden, but they also keep downloading, so no hidden term is added to the per-file limit. Rejected: extending the hidden term to `balance.loader.timeoutMs`. Would change: a device measurement showing hidden-tab downloads stall while their XHR timer runs.
- R-3 **D-4 kept (cheap set).** `assertPool`/`lineTicks` are pure, use no rng and need only `Task.visual` data, and moving `numberChoices` into the `try` keeps the rng order. Would change: the plan finding a seeded-draw diff in `tests/contentInvariants.test.ts` or the generator tests.
- R-4 **D-5 narrowed.** Only `NewerSave` reaches `replace`, so the other two refusals need no change. The card-under-dialog result is accepted as D-5's fallback, and the dialog shows `deviceNewer` inline. Rejected: raising the card's z-index above the dialog, which would cover a dialog that still holds focus. Would change: a visual gate showing the card never appears after the dialog closes.
- R-5 **E2E via a fake visibility state** rather than a real hidden page. Headless Chromium cannot hide a page, and CDP freezing stops all JS. Would change: a Playwright API for page visibility.
- R-6 **Workers:** 3 read-only agents (Phaser source, Z-8/I-1 paths, follow-up status). Their claims were spot-checked in source: `checkLoadQueue` callers, `writeVerdict`, z-indexes, `generateTask`.
