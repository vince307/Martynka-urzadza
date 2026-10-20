---
date: 2026-10-20T19:34:31+0200
researcher: Claude (autonomous run 2026-10-20-playtest-boot, research step)
git_commit: 03cd02a
branch: feat/audit-boot-hidden-tab
repository: Martynka-urzadza
topic: "audit-boot-hidden-tab: boot limit vs a hidden tab (H-1), error card code with skill id (I-1, C-1..C-3, I-3), no site-data advice after a refused replace (Z-8)"
tags: [research, boot, loader, phaser, visibility, error-card, autosave, replace, parent-panel]
status: complete
last_updated: 2026-10-20
last_updated_by: Claude (autonomous run, research step)
---

# Research: audit-boot-hidden-tab

**Date**: 2026-10-20T19:34:31+0200
**Researcher**: Claude (autonomous run 2026-10-20-playtest-boot)
**Git Commit**: 03cd02a
**Branch**: feat/audit-boot-hidden-tab
**Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` (no question asked; unattended run). Resolve the open unknowns of the three in-scope findings of
audit `context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md`:

1. **H-1** Does the Phaser 4.2.1 loader queue really stop while the tab is hidden; do in-flight XHRs time out while hidden
   (D-1's reversal condition); how `BootScene.preload` arms the limits and where hidden time fits as a pure rule; which
   parent-panel lines blame the internet; how an e2e can hide the tab and whether `?e2eArt=stall|stallall` make it observable.
2. **I-1** The error boundary -> error card path and the cheapest correct `Kod:` (error name, build, skill id from
   `generateTask` / C-1..C-3 / I-3); whether a generation-time pool/tick check consumes rng (D-4's reversal condition).
3. **Z-8** Every refusal branch of `Autosaver.replace`, `failureText`/`siteDataAdvice`, and whether `onBlocked` from inside
   an open import/reset dialog collides with its input session (D-5's reversal condition).

Lessons file: `context/foundation/lessons.md` does not exist (checked); none applied.

## Summary

- **H-1 confirmed in source.** In Phaser 4.2.1 a file moves from `list` to `inflight` only in `LoaderPlugin.start` (first
  batch) and in `LoaderPlugin.update` (subscribed to the scene `UPDATE` event); `nextFile` and `fileProcessComplete` never
  call `checkLoadQueue`. Batch size is `loaderMaxParallelDownloads`: 32, or 6 on Android (`Config`), not overridden by the
  repo. A hidden tab stops `requestAnimationFrame`, so no `UPDATE` fires and the rest of the queue waits. The cut timer in
  `BootScene.preload` runs on `window.setTimeout` and `performance.now()`, so it can cut the waiting files while hidden.
- **D-1 stands; its reversal condition is not met.** In-flight XHRs keep their native `xhr.timeout` (12 s, 1 retry) while
  hidden, but they also keep downloading, so a per-file timeout while hidden is real network time, not a stalled queue. The
  per-file limit needs no hidden term; only the two scene limits (slow line, total cut) must count visible time.
- **Pure rule fits `src/core/bootLimits.ts`.** A small hidden-time accumulator (hidden since / hidden total, fed with the
  injected clock) plus `bootLimitDue(schedule, now, hiddenMs)` / `bootLimitWait(at, now, hiddenMs)` keeps the scene thin;
  `tests/bootLimits.test.ts` currently pins the opposite ("a tab hidden for a minute is past the cut at once") and must be
  rewritten on purpose.
- **Panel lines that blame the internet:** `pl.settings.artCut`, `pl.settings.artCause.cut`, `pl.settings.artRestart`
  (and `artCause.network`). After the fix a cut can happen only when the visible time ran out; a background-specific line
  (DESIGN-GAP row 153) is needed only for a cut whose load also spent time hidden, per D-1.
- **E2E:** headless Chromium cannot hide a page; a faked `document.hidden`/`visibilityState` + `visibilitychange` does
  reach Phaser's `VisibilityHandler` and `BootScene`'s own listener, but does NOT stall the loader (rAF keeps running in a
  page that is really visible, and `TimeStep.pause` does not stop rAF). With `?e2eArt=stallall` the files hang anyway, so
  the fake is enough to observe the limit: no cut while "hidden", a cut after the remaining visible time, `hiddenMs` in
  `bootLoad`.
- **I-1:** the boundary callback in `src/main.ts` receives the Error (or a string / any rejection reason) and ignores it for
  the card; `mountErrorCard(parent, buildId, onRestart)` has no detail parameter. `errorName` returns `e.name` or `'Error'`.
  `generateTask` wraps only `generate(skill, rng)` and rethrows `new Error('Skill <id>: …')`, so the name becomes `Error`
  (I-3); `numberChoices`/`boundOf` run outside the `try` (C-3). `assertPool`/`lineTicks` are pure, use no rng, and need
  only `Task.visual`/`hintVisual` data (limits from `ART_LIMITS` and `balance.numberLine`), so a generation-time check
  changes no seeded draw: **D-4's reversal condition is not met**; the cheap set (I-3 + C-3 + C-2 + C-1) holds.
- **Z-8 correction to change.md / D-5:** only `NewerSave` can reach the `replace` catch. `writeVerdict` refuses with
  `OtherWriterSave`/`PreviousPageSave` only when `mode === 'normal'`; `replace` writes with `mode 'replace'`. A fitting
  existing string exists: `pl.saveTransfer.deviceNewer` (no DESIGN-GAP row 154 needed). Calling `refuseWrites` from
  `replace` has no input-session conflict (the suspender is reference-counted), but the refused card (`.overlay-save-refused`,
  z-index 10) renders UNDER the parent dialog (`.overlay-parent`, z-index 15) and the dialog's focus trap holds focus:
  the card becomes visible only after the dialog closes. That is D-5's own fallback ("the dialog shows the refusal line and
  the card waits until the dialog closes"), reached without extra code.

## Detailed Findings

### H-1: Phaser 4.2.1 loader and a hidden tab (observed in `node_modules/phaser`, version 4.2.1)

- `LoaderPlugin.start` (`src/loader/LoaderPlugin.js`): calls `this.checkLoadQueue()` once, then
  `this.systems.events.on(SceneEvents.UPDATE, this.update, this)`.
- `LoaderPlugin.update`: calls `checkLoadQueue` only while loading, `list.size > 0` and `inflight.size <
  maxParallelDownloads`. `loadComplete` and the shutdown/destroy paths remove the `UPDATE` listener.
- `LoaderPlugin.nextFile(file, success)`: deletes from `inflight`, updates progress, emits `FILE_LOAD` and `file.onProcess()`
  on success or `FILE_LOAD_ERROR` + `fileProcessComplete` on failure. It does not call `checkLoadQueue`.
  `fileProcessComplete` calls `loadComplete` when list, inflight and queue are empty; it does not start a file either.
  Exception (observed): `File.onError` retries the same file in place (`retryAttempts--; this.load()`).
- `Config` (`src/core/Config.js`): `loaderMaxParallelDownloads` defaults to 32, or 6 on Android; `grep maxParallel src`
  finds no override in the repo.
- Processing is callback-driven, not tick-driven: `ImageFile` via `Image.onload/onerror`, `AudioFile` via
  `decodeAudioData`; both end in `fileProcessComplete` -> possibly `loadComplete` -> `SceneManager.loadComplete` ->
  `BootScene.create`. So a load can finish while hidden if every file was already in flight (inferred: browsers do not tie
  image decode to rAF; audio decode in a suspended context not verified).
- Loop while hidden: `VisibilityHandler` (`src/core/VisibilityHandler.js`) checks `document.hidden` on `visibilitychange`
  and emits `HIDDEN`/`VISIBLE`; `Game.onHidden` does `this.loop.pause()` + emits `PAUSE`; `Game.onVisible` does
  `this.loop.resume()` + emits `RESUME` with `loop.pauseDuration`. `TimeStep.pause` only records `_pauseTime`; it does not
  stop rAF, and `Game.step` returns early only on `this.isPaused` (set by `Game.pause()`, not by `onHidden`). The loop
  stops in a real hidden tab because the browser stops calling rAF (inferred from browser behaviour; not measured on a
  device, same limit as the audit's § 8).
- `disableVisibilityChange` does not exist in Phaser 4's `Config` (grep), and `src/main.ts` sets no visibility option.
- In-flight XHR: `XHRLoader` sets `xhr.timeout = config.timeout`, `xhr.ontimeout = file.onError`. `BootScene.preload`'s
  `Loader.Events.ADD` listener copies `this.load.xhr.timeout` onto each `file.xhrSettings.timeout` (12 000 ms from
  `balance.loader.timeoutMs`, `maxRetries` 1). The native timer runs while hidden (inferred) and so does the download.
- Hand-over: `BootScene.create` starts the next scene through `this.time.delayedCall(0, …)` (scene clock), so after a
  load that finishes while hidden the welcome/task scene starts only on return. Harmless.

### H-1: how `BootScene` arms the limits now

- `BootScene.preload`: `this.startedAt = performance.now()`; `limits` = `balance.loader` (`slowAfterMs` 8000, `totalMs`
  50000) or `E2E_BOOT_LIMITS` (`slowAfterMs` 500, `totalMs` 3000) under `?e2eArt=stallall`; `checkBootLimits(limits)`;
  `schedule = bootLimitSchedule(limits, this.startedAt)`; local `arm(at, onDue)` = `window.setTimeout` that re-arms itself
  when `performance.now() < at`; slow timer calls `this.loading?.slow()` and sets `phase = 'slow'`; cut timer re-checks
  `bootLimitDue(schedule, performance.now()) !== 'cut'`, then `this.cut = pendingKeys(this.load)`, `cutLoad(this.load)`,
  `phase = 'over'`, `publish()`, and logs `Boot load cut after N ms`. Timers are cleared on `Loader.Events.COMPLETE` and
  scene `shutdown`.
- `src/core/bootLimits.ts`: pure `bootLimitSchedule(limits, now)`, `bootLimitDue(schedule, now)`,
  `bootLimitWait(at, now)`. `src/core/bootLoad.ts` `bootLoadPhase` is no longer called from `src/` (tests only).
- `BootScene.publish` writes `REGISTRY_KEYS.bootLoad` = `{ cut, cutByTable, creates, elapsedMs }`; `elapsedMs` is wall
  time. `src/data/layout.ts` documents the key as runtime only, not in `SAVE_KEYS`. The e2e hook's `bootLoadSnapshot`
  (`src/testing/e2eHook.ts`) reads the same four fields; a new `hiddenMs` must be added there too.
- **Where hidden time fits (recommendation).** A pure accumulator in `src/core/bootLimits.ts`, e.g. `{ hiddenSince: number
  | null; hiddenMs: number }` with `hide(now)`, `show(now)` and `hiddenAt(now)` (total including an open hidden span), and
  `bootLimitDue`/`bootLimitWait` taking the hidden total so the effective clock is `now - hiddenAt(now)`. While hidden the
  effective clock stands still, so the rule can never return `cut` during a hidden span; the scene clears its timers on
  hide (or lets a fired timer re-arm) and re-arms both on show with the remaining visible time. Seed from
  `document.hidden` at `preload` start (in practice the page is visible then, since `preload` runs from a loop step).
  Signal: either a `document` `visibilitychange` listener owned by `BootScene` (reads `document.hidden`, the same flag
  Phaser reads) or `this.game.events` `HIDDEN`/`VISIBLE` (exactly the loop's pause signal). Either is removed on
  `COMPLETE`/`shutdown`. The `src/main.ts` `visibilitychange` handler (saver flush, narrator cancel) stays untouched, so
  follow-up L-S3 does not fire.
- Existing test to rewrite: `tests/bootLimits.test.ts` "counts the wall clock: a tab hidden for a minute is past the cut
  at once" pins the current behaviour.

### H-1: parent-panel and loading lines

- `src/data/pl.ts`: `settings.artCut` ("… Przy lepszym internecie uruchom grę ponownie."), `settings.artCause.cut` (same
  sentence), `settings.artRestart` ("Uruchom grę ponownie, gdy internet będzie lepszy."), `settings.artCause.network`
  ("… Internet był zbyt wolny albo się rozłączył."). `loading.slow` ("Jeszcze chwilka, wczytuję obrazki.") does not blame
  the internet.
- `src/core/artHealth.ts` `artHealthLines`: emits `{ kind: 'cut', count }` when `cut > 0`; `mainCause` picks the cause;
  when the cause is `cut` and `cut > 0` the separate `cause` and `advice` lines are skipped (`cutSaysIt`); `restartHelps`
  is true for `cut` and `network`; a `code` line follows. Input `cut` comes from `UIScene.openSettings`
  (`bootLoad.cut.length`).
- `src/ui/dom/artHealthView.ts` maps `cut` -> `pl.settings.artCut`, `advice` -> `artRestart`/`artNoRestart`, `cause` ->
  `artCause[cause]`.
- So a background variant needs: a flag in `ArtHealthLinesInput` (e.g. `hidden: boolean` from `bootLoad.hiddenMs > 0`),
  a `cut` line variant (`{ kind: 'cut', count, background: true }` or a new kind), and one new string. No kit view or
  `pl.ts` key exists for it: DESIGN-GAP row 153 (next free row, confirmed: the table ends at 152 in
  `docs/design-gaps.md`). The `code` line can stay `cut`.
- Interpretation note for the plan: with visible-time limits a cut after a hidden span means the visible 50 s ran out,
  which is a slow connection; D-1 still names the background then (a load that spent time hidden is not cleanly blamable
  on the internet). This is an agent decision (D-1), not a fact.

### H-1: e2e

- Headless Chromium keeps every page `visible`; Playwright has no page-hide API (inferred from Playwright/Chromium
  behaviour; not run in this step). CDP `Page.setWebLifecycleState('frozen')` freezes all JS including timers, which is
  not a hidden tab.
- A fake: `Object.defineProperty(document, 'hidden', { get: () => flag, configurable: true })` and the same for
  `visibilityState`, then `document.dispatchEvent(new Event('visibilitychange'))` from `page.evaluate`. Phaser's
  `VisibilityHandler` reads `document.hidden`, so `Game.onHidden` runs; `BootScene`'s listener sees it; the `src/main.ts`
  handler also runs (`saver.flush('hidden')`, `narrator.cancel()`), which is harmless during boot.
- The fake does not stall the queue (rAF keeps running; `TimeStep.pause` does not stop it), so it proves the limit rule,
  not the Phaser stall. With `?e2eArt=stallall` (per-file limit off in `src/main.ts` `loader: { timeout: 0, maxRetries: 0
  }`, `E2E_BOOT_LIMITS` 500/3000 ms) and routes that never answer (`hold` in `tests/e2e/load-and-tab-guard.spec.ts`), only
  the total limit can end the load, so a spec can: hide before 3 s, stay hidden past 3 s, assert `screen === 'loading'`;
  show, assert the cut comes and `bootLoad.hiddenMs >= hidden span` and `elapsedMs >= 3000 + hidden span`; open the panel
  and assert the background line and no `artCut`. The hide must happen after the hook exists and before 3 s; the existing
  `#14 B-4` spec takes the same seam. `?e2eArt=stall` (2 s per-file limit) is not suitable: the per-file limit runs on its
  own native timer.

### I-1: boundary -> error card

- `installErrorBoundary(win, onFatal)` (`src/ui/dom/errorBoundary.ts`) passes `event.error ?? event.message` for `error`
  events and `event.reason` for rejections; the `ErrorSignal` built inside is used only for `isFatalSignal`
  (`src/core/errorSignal.ts`).
- The callback in `src/main.ts` calls `mountErrorCard(document.body, __BUILD_ID__, () => window.location.reload())`,
  suspends input, sleeps the loop and calls `booted.saver?.block('fatal', errorName(error))`; it does not pass `error` to
  the card.
- `mountErrorCard` (`src/ui/dom/errorCard.ts`): title, body, restart button, muted `pl.errorCard.build(buildId)` ("Wersja
  <id>"); idempotent via module `mounted`.
- `errorName` (`src/core/save.ts`): `e.name` when a non-empty string, else `'Error'` (a string or `null` gives `'Error'`).
- `pl.saveFailed.detail(reason, build)` = `Kod: <reason> · Wersja <build>` (DESIGN-GAP 51), already used by the refused
  card and the unreadable-save card.
- Cheapest correct code: a pure helper in core (beside `errorName`) returning `name` or `name/skillId` when the error
  carries a string `skillId`; `mountErrorCard` takes the reason and draws `pl.saveFailed.detail(reason, buildId)` in place
  of `pl.errorCard.build` (D-3). `tests/e2e/error-boundary.spec.ts` asserts `getByText(pl.errorCard.build(build))`, a
  substring match by default, which `Kod: Error · Wersja <id>` still contains (inferred from Playwright's `getByText`
  default; the spec should be tightened to the new line anyway). The forced failure `?e2eFail=…` throws `new
  Error(E2E_FORCED_FAILURE)`, so its code would read `Error`.

### I-1: skill id (C-1, C-2, C-3, I-3)

- `generateTask` (`src/core/tasks/generateTask.ts`): a missing generator throws outside the `try` (message already names
  the skill); the `try` wraps only `generate(skill, rng)` and rethrows `Object.assign(new Error(\`Skill ${skill.id}:
  ${why}\`), { cause })` (name `Error`, I-3); `boundOf` and `numberChoices` run after the `try` (C-3). `numberChoices`
  consumes rng; moving it inside the same `try` keeps the rng order, so seeds are unchanged.
- No `src/` code reads the `Skill …` message or `.cause`. `tests/solvableInMode.test.ts` ("generateTask names the skill in
  a generator failure") checks `toBeInstanceOf(Error)`, the message containing the skill id and `.cause` being an Error;
  it does not check the name. `tests/generateTask.test.ts` checks `toThrow(/NO_SUCH_TYPE/)`.
- Runtime callers of `generateTask`: `buildAdaptiveRound` (`src/core/curriculum.ts`, with the art retries),
  `buildWarmup` path (`src/core/round/warmup.ts`), `src/core/minigames/word.ts`, the `?e2eSkills` path in
  `TaskScene.freshRound`. None catches a generator error, so a throw at round build reaches the boundary.
- `assertPool(count, limit, what)` and `lineTicks(line)` (`src/core/tasks/visual.ts`) are pure, throw `RangeError`, use no
  rng. Callers: `IconGroups` (`sum(groups)`, `ART_LIMITS.icons`), `IconRow` (`ART_LIMITS.rowIcons`), `Jugs`
  (`ART_LIMITS.jugs`), `MoneyTable` (`ART_LIMITS.moneyItems`), `NumberLine` (`lineTicks`). Every input comes from
  `Task.visual`/`hintVisual`; limits are data (`src/data/measures.ts`, `balance.numberLine`). `validateVisual` already
  checks the same limits but runs only through `validateTask` (tests and `scripts/sample.ts`), never at runtime.
  So one helper (e.g. `assertDrawable(visual)` over `visual` and `hintVisual`) can be called inside the `try` of
  `generateTask` without changing any seeded draw.
- C-1: `pictureLayout`'s `skillId` is used only by `forSkill(skillId)` to append " (skill <id>)" to the `tallOf` error;
  the prompt-fitting call in `TaskScene.drawPrompt` omits it. A one-argument fix.

### Z-8: `Autosaver.replace` branches (`src/core/autosave.ts`)

All return `ReplaceResult` `{ ok: false, error }`; none throws:

1. `replacing || replaced` -> `Busy` (log only).
2. `replaceGate(...) === 'Blocked'` -> `Blocked` (log only). Gate blocks on `blockedBy` `fatal|newer|otherTab`, on
   `unreadable` with `future` (or keeps-old-save without force), on `unavailable` unless not a timeout, forced and
   `unavailableStarts >= forceAfterStarts`.
3. `!validateSave(state)` -> `InvalidSave`.
4. Gate asked again after `await inflight` -> `Blocked`.
5. `catch` around the limited `store.write(state, 'replace')` and the copy: `failures++`, `consecutiveFailures++`,
   `lastError = errorName(e)`, `lastFailure = { stage: 'replace', error }`; then
   - `NEWER_SAVE`: `blockedBy ??= 'newer'`, return `NewerSave`; no `refuseWrites`, no `onBlocked`;
   - `'timeout'`: `dirty = true`, re-arm, return `timeout`;
   - other: re-arm if dirty, return the name.

- `writeVerdict` (`src/core/save.ts`): `NEWER_SAVE` for a newer stored version in both modes; `OTHER_WRITER_SAVE` /
  `PREVIOUS_PAGE_SAVE` only `if (mode === 'normal' && generation > page.base && writer !== page.writer)`. `guardedPut`
  (`src/storage/idb.ts`) rejects with `name: verdict.error`. So **only `NewerSave` can reach the `replace` catch**; the
  other two exist only in the normal write's catch (`attempt`), which calls `refuseWrites`.
- `refuseWrites(reason, error)`: first reason wins, cancels the timer, calls `options.onBlocked?.(reason, error)` once.
  `src/main.ts` wires `onBlocked` with a once-per-page-load flag to `mountSaveRefusedCard(document.body, reload,
  inputSuspender, pl.saveFailed.detail(error, __BUILD_ID__))`.
- `failureText(result, forced, plain)` (`src/ui/dom/saveSummaryView.ts`): timeout -> `pl.saveTransfer.replaceUnconfirmed`;
  not forced, no result or ok -> `plain`; forced: `Busy`/`Blocked`/`InvalidSave` -> `plain`, anything else ->
  `pl.saveTransfer.siteDataAdvice`. Callers: `saveImportDialog.ts` (`applyFailed`) and `saveResetDialog.ts`
  (`resetFailed`); after a failure the dialog stays open, shows the text, hides the confirm button and relabels cancel to
  `pl.saveTransfer.close`.
- Existing text that fits a refused replace: `pl.saveTransfer.deviceNewer` ("Nowsza wersja gry zapisała już postępy na tym
  urządzeniu, więc ta karta ich nie zastąpi. Uruchom grę ponownie."), already shown by `blockedText('newer')` when a dialog
  opens with `blockedBy 'newer'`. Alternatives: `settings.saveOff.newer`, `saveTransfer.replaceUnconfirmed` (wrong meaning:
  no confirmation). No new copy needed, so no DESIGN-GAP row 154.
- `deviceSaveView` (`src/core/saveFile.ts`) is computed when a dialog opens; with `blockedBy` set it gives `kind: 'blocked'`,
  `forceable: false` for `newer`/`otherTab`. The open dialog does not change; the next opening shows `deviceNewer` without
  "Zastąp mimo to"; "Zapis gry" shows `saveOff.newer`.
- Input session: `createInputSuspender` (`src/core/inputSuspend.ts`) is reference-counted with idempotent releases;
  `mountSaveRefusedCard` opens its own `openInputSession`; the dialog's hold is the settings session from
  `UIScene.openImport`/`openReset`. Both nest; input returns only when both release. No collision.
- DOM: `.overlay-save-refused` z-index 10, `.overlay-parent` z-index 15, `.overlay-error` 18 (`src/style.css`). The card
  mounted from `replace` lies under the dialog, and the `openDialog` Tab trap (`src/ui/dom/dialog.ts`) pulls focus back
  into the dialog; the card shows after the dialog closes. Focus after the close may need a re-focus of the card's
  button (plan detail).

## Code References

- `node_modules/phaser/src/loader/LoaderPlugin.js` — `start`, `update`, `checkLoadQueue`, `nextFile`, `fileProcessComplete`, `loadComplete`
- `node_modules/phaser/src/core/VisibilityHandler.js` — `onChange` (`document.hidden` -> `HIDDEN`/`VISIBLE`)
- `node_modules/phaser/src/core/Game.js` — `onHidden`, `onVisible`, `step` (`isPaused`)
- `node_modules/phaser/src/core/TimeStep.js` — `pause`, `resume` (`pauseDuration`)
- `node_modules/phaser/src/core/Config.js` — `loaderMaxParallelDownloads`
- `node_modules/phaser/src/loader/XHRLoader.js` — `xhr.timeout`, `ontimeout`
- `src/scenes/BootScene.ts` — `preload` (`startedAt`, `arm`, `clearTimers`, ADD listener), `publish`, `create`
- `src/core/bootLimits.ts` — `bootLimitSchedule`, `bootLimitDue`, `bootLimitWait`
- `src/scenes/loaderCut.ts` — `cutLoad`, `pendingKeys`; `tests/phaserLoaderPin.test.ts` (pins 4.2.1 internals, not the UPDATE-only advance)
- `src/core/artHealth.ts` — `artHealthLines`, `restartHelps`, `ArtHealthLine`; `src/ui/dom/artHealthView.ts`; `src/scenes/UIScene.ts` `openSettings`
- `src/testing/e2eHook.ts` — `E2E_BOOT_LIMITS`, `bootLoadSnapshot`; `src/main.ts` loader seams; `tests/e2e/load-and-tab-guard.spec.ts` `hold`
- `src/main.ts` — `installErrorBoundary` callback, `onBlocked` wiring, `visibilitychange` handler
- `src/ui/dom/errorCard.ts` — `mountErrorCard`; `src/ui/dom/errorBoundary.ts` — `installErrorBoundary`; `src/core/save.ts` — `errorName`, `writeVerdict`, `NEWER_SAVE`
- `src/core/tasks/generateTask.ts` — `generateTask`; `src/core/tasks/visual.ts` — `assertPool`, `lineTicks`; `src/core/round/pictureLayout.ts` — `forSkill`; `src/scenes/TaskScene.ts` — `drawPrompt`
- `src/core/autosave.ts` — `Autosaver.replace`, `refuseWrites`, `replaceGate`; `src/ui/dom/saveSummaryView.ts` — `failureText`; `src/core/inputSuspend.ts`; `src/style.css` overlay z-indexes

## Architecture Insights

- Limits live as pure rules in `src/core` with the clock injected (B-3 pattern); the scene only arms timers. The hidden
  accumulator follows the same pattern and is testable with a fake clock.
- Codes shown to parents go through one formatter, `pl.saveFailed.detail`, with `<name>/<detail>` precedent
  (`corrupt/<field>` from save-truth).
- Runtime-only records (`bootLoad`) sit outside `SAVE_KEYS`; save format v4 is untouched by all three fixes.

## Historical Context (from prior changes)

Follow-ups whose trigger names this area, re-checked against the code (status as of `03cd02a`):

| id (archive) | status | evidence |
|---|---|---|
| A-3, A-4, A-5 (`2026-10-15-load-and-tab-guard`) | closed | `loadErrorLine`, `artCauses`/`BootScene.withCauses`, `artHealthLines` |
| A-6 per-file limit by size (also health-lines § 7) | open, not in scope | `balance.loader` has only `timeoutMs`/`totalMs` |
| A-10 progress handler warns on every event | open, not in scope | `onProgress` in `BootScene.preload` has no once-flag |
| A-11 load time and `totalFailed` in the record | partial; H-1 adds `hiddenMs` only | `publish` writes `elapsedMs`, `cutByTable` |
| impl-review F3 slow timer asks `bootLoadPhase` | closed | scene uses `bootLimitSchedule`/`bootLimitDue`; `bootLoadPhase` unused in `src/` |
| F4 `startedAt` on the scene clock (`2026-10-16-final-art-p2`) | closed | `startedAt = performance.now()` |
| G-2, B-4, B-5, P-2..P-6 (`2026-10-16-stale-tab-and-health`) | closed | `recordFallback`; `artHealthLines` `cut`; `loadErrorLine`/`tableOf`; `precacheCovers`, `entryVerdict`, `failLine`, ADD `try`, `stallall` marker |
| G-3 thumbnail per room | open, not in scope | `RoomDoneCard` uses `UI_ART_KEYS.salonAfter` |
| F3 progress listener, F4 salon line hidden (`2026-10-15-final-art-salon`) | closed | `load.off('progress')` on COMPLETE; `artHealthLines` skips only the unknown table |
| L-6 (`2026-10-15-salon-load-health`) | closed | `createArtHealthView` `data-state` |
| L-8 DOM test of `createArtHealthView` | partial, not in scope | only `tests/artHealthLines.test.ts` |
| ASL-02, 03, 04, 06, 07 (`2026-10-14-save-reason-and-recovery`) | closed | folder/code lines, row 66, `withoutArtBlocked`, `fontHealth`, `wrongSizes` |
| ASL-05, ASL-08 | open, not in scope | `ArtImage` scale fallback; `UnlockCard` no art check |
| ASL-09 | partial, not in scope | `visualArtIds` re-draw |
| S12-02 replace time limit | closed | `withTimeLimit` in `replace` |
| S12-03 `stateOf` ignores replace | open (low), not in scope | `src/core/saveHealth.ts` `stateOf` |
| S12-11 replace failures count as autosave failures | partial, not in scope (Z-8 changes text and `blockedBy` only) | `replace` catch still `failures++` |
| S12-07, S12-08, S12-12 (`2026-10-14-minigame-daily-puzzle`) | closed | `downloadStarted`, `unreadable-file`, `requestPersistence` warn |
| S12-13 dialog handlers outside `session.run`; two "Zacznij od nowa" buttons | partial, not fired (D-3 keeps `pl.errorCard` copy) | dialogs catch `apply` rejections |
| TXT-06 skill id under `Kod:` (`2026-10-16-child-flow-guards`) | open, **in scope** (closed by I-1's skill id) | `mountErrorCard` shows only the build |
| FontFace load limit (health-lines § 10), B-6 cold-start measurement | open / partial, not in scope | font bounded only by `totalMs`; `bootQueue` fixed, 50 s not re-measured |
| L-S3 `visibilitychange` in `main.ts` | not fired if the hidden listener stays in `BootScene` | `src/main.ts` handler |

## Related Research

- `context/archive/2026-10-17-health-lines-and-smoke/` (B-3 wall clock, `bootLimits.ts`), `context/archive/2026-10-15-load-and-tab-guard/` (A-1/A-2 total limit, `loaderCut.ts`), `context/archive/2026-10-16-save-truth/` (`replaceGate`, `Kod:` precedent).

## Open Questions

- Real-device behaviour (Android Chrome, iPad Safari) of the queue stall and of native XHR timeouts while hidden is
  inferred from source and browser rules, not measured (same limit as the audit § 8). The fix does not depend on it: it
  only stops the scene limits from counting hidden time.
- Whether a cut after a hidden span should name the background (D-1) or the internet (the visible 50 s did run out) is a
  product wording choice; D-1 picks the background line, DESIGN-GAP 153, text needs a teacher read.
- Card focus after the import/reset dialog closes over a refused card: plan detail, verify in the visual gate.
