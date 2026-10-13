---
date: 2026-10-13T06:06:13Z
researcher: Claude (autonomous run 2026-10-13-fix-observability, research step)
git_commit: f7925250312da85cb2f386621e262d1e6d6913de
branch: feat/observability-c1-c2
repository: Martynka-urzadza
topic: "observability-c1-c2: error boundary (C-1), input release after a throwing dialog callback (C-2, L-8, F6), no-voice state in settings (H-6), mastery without the -1 penalty (H-7)"
tags: [research, error-boundary, phaser4, input-suspend, dialogs, narrator, mastery, e2e-hook]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run, research step)
---

# Research: observability-c1-c2

**Date**: 2026-10-13T06:06:13Z · **Git Commit**: `f792525` · **Branch**: `feat/observability-c1-c2` · **Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` (audit-claim table, autonomous decisions 1–7, handoff §5 open items) and the step prompt:

1. Where Phaser 4.2.1 catches or swallows errors in its loop, scene lifecycle, input and loader; what a `window` `error` /
   `unhandledrejection` handler can and cannot see; which events are benign and must not show the card.
2. How to test the DOM card and the C-2 release when vitest has no DOM environment.
3. Every holder of the input suspender and the exact order close → callback → release today.
4. H-7: every test and data value that encodes the −1 rule; how removing it changes unlock speed (quantified).
5. H-6: how the settings panel can know a Polish voice is absent (narrator API).

Inputs read: `change.md`, `handoff.md`, the audit `context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md`
(via change.md's claim table), `context/foundation/prd.md`, `docs/design-gaps.md`, the code below. `lessons.md` does not
exist in `context/foundation/` (checked), so no lesson applies. Two read-only workers covered Q1 and Q3/Q2-infra; their
decisive anchors were re-checked by hand (marked "verified").

## Summary

- **C-1 (Q1).** Phaser 4.2.1 has no `try/catch` around the loop, scene lifecycle, event emitter, timers, tweens or input
  dispatch. An exception thrown from app code reaches the window as uncaught, through one of three carriers:
  (a) the RAF step: `RequestAnimationFrame.step` calls `_this.callback(time)` **before** `window.requestAnimationFrame(step)`
  (verified), so the loop stops for good, which is the frozen screen; (b) a DOM event: pointer input is dispatched
  synchronously inside the DOM listener (`MouseManager.onMouseDown` / `TouchManager.onTouchStart` → `InputManager` →
  `InputPlugin.update`), so a throw there reaches `error` but the loop keeps running with half-updated state; (c) **a promise**:
  `FontFile.onProcess` calls `onProcessComplete()` inside `font.load().then(…)` and again in `.catch(…)` (verified). Boot
  loads only the font, so `BootScene.create` and whatever it starts synchronously run inside that `.then`; a throw
  is caught by Phaser's `.catch` (logged as "Font failed to load"), which re-runs completion, and a second throw escapes
  as an **`unhandledrejection`**, never as `error` (inferred from the code, not traced at runtime). So the boundary needs
  **both** listeners. The app itself has no unhandled promises (`registerServiceWorker` and the install prompt both `.catch`).
- **Benign events.** Resource load errors do not bubble, so they never reach a bubble-phase window listener. That is the
  reason not to use `capture`. Messages with `ErrorEvent.error === null` ("ResizeObserver loop…", "Script error.", empty)
  come from extensions or cross-origin scripts; Phaser 4 does not use ResizeObserver. `SpeechSynthesisUtterance` errors
  stay on the utterance (not in the DOM tree) and the narrator swallows synth throws in `safely`. Phaser's WebAudio
  manager has a few unhandled `resume()`/`suspend()`/`close()` promises that reject only on a closed context. A **pure
  classifier in `src/core/`** (plain-object input, no globals) decides "show the card or not" and is unit-tested.
- **C-2 (Q3).** There are exactly three holders: `src/main.ts` (`mountInstallHint`), `WelcomeScene`, `UIScene`. The `src/ui/dom/*`
  dialogs never touch the suspender. In every dialog path the order is `handle.close()` → callback → work → release, and
  the release runs on the success path only. Five throw points leave the hold set. One fix pattern covers all of them:
  release in `finally` and rethrow. The S-06 follow-up "`mountInstallHint` lets a tap through" is **already closed**, and so is
  the S-05 hook follow-up (`targets` report `null` in the room).
- **Testing (Q2).** `vitest.config.mts` runs in `node` and `package.json` has no jsdom or happy-dom. Decision logic
  therefore goes in vitest: the classifier, `createInputSuspender` with a throwing `onRelease`, an `e2eFail` parser, and
  optionally a pure hold helper. The rendered card and real throw paths go in e2e through a test-only `?e2eFail=` flag read
  like `?e2eMonth`. **The build guard today checks only `__martynkaE2E`**, so the trigger needs its own marker.
- **H-7 (Q4).** The rule lives in five places, two of which change.md missed: the warm-up test in `tests/curriculumEnd.test.ts`
  asserts 4 → 3, and `tests/mastery.test.ts` pins `balance.mastery` to `RULES`. On a simple model the unlock gets much
  faster for a child with 60–80 % first-try accuracy and barely changes at 90 %+ (table below).
- **H-6 (Q5).** `Narrator.available` and `Narrator.onAvailability(cb) → unsubscribe` already exist. `onAvailability` calls back
  immediately and again on change (`voiceschanged` plus polling until `voiceTimeoutMs`). The panel should subscribe while
  open and unsubscribe on close. E2E covers both states with the existing `silenceSpeech` (no voices) and the fake voice
  list in `narrator.spec.ts`.
- **PRD.** The PRD says nothing about runtime errors. Two rules bear on the card's copy: "Postęp nigdy nie ginie" (stan po
  restarcie) and the business rule "nie da się przegrać ani niczego stracić". Until S-11 a reload loses the session, so
  the card must not promise that progress is kept.

## Detailed Findings

### 1. Phaser 4.2.1 error flow (C-1)

Inspected: `node_modules/phaser/src/` `dom/RequestAnimationFrame.js` (`step`, `stepTimeout`), `core/TimeStep.js` (`step`),
`core/Game.js` (`step`, `headlessStep`), `scene/SceneManager.js` (`update`, `processQueue`, `start`, `switch`, `wake`,
`loadComplete`), `input/InputManager.js`, `input/mouse/MouseManager.js`, `input/touch/TouchManager.js`,
`loader/LoaderPlugin.js`, `loader/File.js`, `loader/filetypes/FontFile.js`, `loader/filetypes/AudioFile.js`,
`sound/webaudio/WebAudioSoundManager.js`, `scale/ScaleManager.js`, `renderer/webgl/WebGLRenderer.js`, eventemitter3, and a
repo-wide grep for `try {` / `catch (` / `.then(`.

- **No catching in the runtime.** Within the grep, every `try` sits in feature detection or parsing (`device/*`,
  `IsPlainObject`, `ParseXML`, JSON/SVG/HTMLTexture `onProcess`) or in the `window.top.addEventListener` fallback in
  `MouseManager.startListeners` / `TouchManager.startListeners`. None wraps app callbacks. `TimeStep.step` → `Game.step`
  → `SceneManager.update` → `Systems.step`, eventemitter3 `emit`, `Clock`/`TimerEvent` and tween callbacks are unguarded.
- **RAF ordering (verified).** `RequestAnimationFrame.step` runs `_this.callback(time)` and then
  `window.requestAnimationFrame(step)`, so an exception kills the loop. `stepTimeout` schedules first ("Make the next request
  before the callback"), but the app does not force `setTimeout` (`src/main.ts` `createGame` has no `forceSetTimeOut`; grep).
- **Input runs in the DOM event.** `MouseManager.onMouseDown` / `TouchManager.onTouchStart` →
  `InputManager.onMouseDown`/`onTouchStart` → `updateInputPlugins` → each scene's `sys.input.update`, which emits
  `pointerdown`/`pointerup` and game-object events synchronously. A throw escapes the DOM listener, the remaining scenes of
  that dispatch are skipped, and the RAF loop goes on. `SceneManager.start`/`switch`/`wake`/`sleep` act immediately unless
  `isProcessing` (then `queueOp`). So `TaskScene` `wake` handlers started from a button `pointerup` (for example
  `RoomScene` → `scene.switch`) run in the DOM event too.
- **Loader.** `File.onError` → `LoaderPlugin.nextFile(file, false)` emits `loaderror` and throws nothing. Completion
  (`fileProcessComplete` → `loadComplete` → `SceneManager.loadComplete` → `create`) runs inside whatever callback finished
  the last file. For this app that is `FontFile.onProcess`'s `font.load().then(…)` (verified: `.then` calls
  `_this.onProcessComplete()`, `.catch` calls `console.warn('Font failed to load', source)` and `onProcessComplete()` again).
  Inference, not runtime-traced: a throw in `BootScene.create`, or in a `WelcomeScene.create`/`TaskScene.create` it starts
  synchronously, is first swallowed and mislabelled by that `.catch`. Completion then runs a second time, and a second throw
  rejects the chained promise with no handler → `unhandledrejection`. The plan should test a boot-time failure for
  `unhandledrejection` specifically.
- **WebGL context loss** is handled by events (`WebGLRenderer` context-lost handler), not throws.
- **Promises Phaser leaves unhandled.** `WebAudioSoundManager`: `context.resume()` in the constructor path, `onFocus`,
  `onGameVisible`; `suspend()` in `onBlur`/`onGameVisible`; `close().then(…)` in `destroy`. They reject only on a closed
  context. `unlock` handles its rejection. `decodeAudioData` returns a rejecting promise on bad data (browser behaviour),
  but the app loads no audio. `ScaleManager.startFullscreen` ignores its promise and the app uses no fullscreen. The game
  config has no `audio.noAudio` (`src/main.ts` `createGame`, grep), so the WebAudio manager exists. Setting
  `audio: { noAudio: true }` until sound arrives would remove these sources. That is an option for the plan, not a requirement.
- **App sources (all of `src/`, grep).** No `async`/`await`, `new Promise` or bare `.then`. `src/pwa/registerServiceWorker.ts`
  `registerServiceWorker` → `.catch(() => undefined)`; `src/pwa/installHint.ts` → `prompt?.prompt().catch(() => undefined)`.
  `src/ui/narrator.ts`: every synth call goes through `safely` (try/catch, "silent by design"), and
  `utterance.onerror = release` runs on an EventTarget outside the DOM tree, so nothing reaches `window`. `src/main.ts`
  listeners (`unlockSpeech` on `pointerup`/`touchend`, `visibilitychange` → `narrator.cancel()`, `contextmenu`) are synchronous.

**What a window handler sees.** `error` (bubble phase): uncaught throws from carriers (a) and (b), plus timer callbacks.
`unhandledrejection`: carrier (c) and Phaser's audio promises. Neither sees: errors swallowed by Phaser's font `.catch` (first
throw), by `narrator.safely`, or by the two app `.catch(() => undefined)` calls, nor resource load errors (non-bubbling).

**Classifier shape (recommendation).** A pure function in `src/core/` (for example `src/core/errorSignal.ts`) over a plain
object, so ESLint's core boundary holds. `main.ts` maps the DOM event to it:

```ts
interface ErrorSignal { kind: 'error' | 'rejection'; message: string; hasError: boolean; name?: string; sameOrigin: boolean }
// fatal unless: kind 'error' && !hasError && (message starts with 'ResizeObserver loop' || message === 'Script error.' || message === '')
//            or !sameOrigin (extension / foreign script; main.ts computes it from ErrorEvent.filename vs location.origin)
```

Treating rejections named `AbortError`/`NotAllowedError` as benign is defensible, because media, speech and fullscreen use
those names. The app has none such today, so the plan may leave that rule out and record it. Messages vary by browser, so
match on a prefix.

**Loop stop.** After the card shows, the loop may or may not be alive (carrier (b) keeps it). Change.md decision 1 (card on
every fatal signal, reload only) stands. Optionally `game.loop.sleep()` when the card opens, so a half-updated scene stops
reacting. That is the plan's call.

### 2. Input suspender holders and order (C-2, L-8, F6)

Inspected: `src/core/inputSuspend.ts`, `src/main.ts`, `src/scenes/WelcomeScene.ts`, `src/scenes/UIScene.ts`,
`src/ui/dom/{dialog,overlay,parentGate,stagePanel,settingsPanel}.ts`, `src/pwa/installHint.ts`. A grep of `src/` for
`inputSuspender`, `suspend(`, `releaseInput`, `resumeInput` and `closeDialog` finds three holders.

**`createInputSuspender` (`src/core/inputSuspend.ts`).** It keeps a reference count. `suspend()` adds 1, sets `target.enabled = false` and
returns a release. The release is idempotent per handle (a `released` flag). It subtracts 1; at 0 it runs `onRelease?.()` **then**
`target.enabled = true`. **L-8:** if `onRelease` throws, the count is 0 and the handle spent, so `enabled` stays `false` with no way back.
The fix: `try { onRelease?.() } finally { target.enabled = true }`, keeping the pointer reset of S-08 F1 (`onRelease` in `main.ts`
`preBoot` runs `pointers.forEach(p => p.reset())`). `tests/inputSuspend.test.ts` fakes `target` as `{ enabled: true }` and has
7 cases. None has a throwing `onRelease`, and one pins "`onRelease` runs before `enabled` is set back", an order the fix keeps.

**`openDialog` (`src/ui/dom/dialog.ts`).** `close()` is idempotent (`closed` flag). It removes the document `keydown` listener and
the overlay and restores focus. Every `open*` returns `handle.close`. `parentGate` `submit`/`cancel`, `stagePanel` confirm/cancel and
`settingsPanel` confirm/cancel all call `handle.close()` **before** the callback (verified for `openSettingsPanel`: `handle.close(); onConfirm({ stage: chosenStage, autoRead: chosenReading })`).
A throwing callback therefore leaves a clean DOM but the hold in place.

| Holder | Order today | Throw points after `suspend()` | State left by a throw |
|---|---|---|---|
| `mountInstallHint` (`src/pwa/installHint.ts`), given `() => suspender.suspend()` by `src/main.ts` | build overlay → `release = suspend?.()` → append; `dismiss` = `overlay.remove()` → `release?.()` → `onPromptAvailable = null` (may run twice: button and `appinstalled`; harmless) | none in app code | — (**S-06 follow-up "lets a tap through": closed by S-08**) |
| `WelcomeScene.openParent` → gate → `openStagePanel` → `start` | guard `if (this.chosen \|\| this.closeDialog) return` → `sessionMonth()` (before suspend) → `releaseInput = suspender.suspend()` (**suspender cast without an `undefined` guard: F6**) → `closeDialog = openParentGate(…)`; pass: `handle.close()` → `onPass` → `closeDialog = openStagePanel(…)`; confirm: `handle.close()` → `placeByParent(…)` → `onConfirm` = `start(learner)` → `startLearning(…)` → `chosen = true`, `closeDialog = undefined`, `resumeInput()` → registry → `scene.start` | `openStagePanel` DOM build, `placeByParent`, `startLearning` | the dialog is gone; `releaseInput` set; `closeDialog` holds the old closed function, so the `openParent` guard refuses; the welcome screen is dead (canvas disabled, "Rodzic" blocked) until scene shutdown (`once('shutdown')` → `closeDialog?.()`, `resumeInput()`) |
| `UIScene.openSettings` → gate → `openSettingsPanel` → `applySettings` | guard `if (!learner \|\| !suspender \|\| this.releaseInput) return` → `narrator?.cancel()` → `releaseInput = suspender.suspend()` → `hold = IDLE` → `closeDialog = openParentGate(…)`; pass: `handle.close()` → `onPass` → `getStage` → (`closeSettings()` if no stage) → `closeDialog = openSettingsPanel({ progress: progressView(…) … })`; confirm: `handle.close()` → `applySettings` → `changeStageByParent` → `registry.set(settings)` → `closeSettings()` (`closeDialog = undefined`, `releaseInput?.()`, `releaseInput = undefined`) → `registry.set(learner)` → `game.events.emit(GAME_EVENTS.parentStage)` → `TaskScene` `onParentStage` | `getStage`, `progressView`, `openSettingsPanel` DOM build, `changeStageByParent` | the gear is dead (`this.releaseInput` guard) and game input stays off; only `UIScene` shutdown recovers. A throw in `TaskScene` `onParentStage` comes **after** the release, so it is a pure C-1 case |

**One helper or `finally` per holder?** All three scene paths share one shape: suspend, a chain of 1–2 dialogs, then release
and clear the fields on cancel, confirm or failure. They differ in the guard field (`closeDialog` vs `releaseInput`), in the
extra work at open (`narrator.cancel()`, `hold = IDLE`), and in the install hint, which is not an `openDialog`. The throws
happen inside the dom module's `submit`/`confirm`, after `handle.close()`. So the release must wrap the **callback**, at the
scene, not `openDialog`. Two workable shapes:

- **(a)** `try { … } finally { release }` in `UIScene.applySettings`, `UIScene` `onPass` (the `openSettingsPanel` build) and
  `WelcomeScene` `onPass`/`start`, rethrowing after the release.
- **(b)** A small pure session helper, for example `holdSession(suspender) → { run(fn), end() }`. `run` does
  `try { fn() } catch (e) { end(); throw e }` and `end` is idempotent (release plus forget). It is testable in vitest without
  a DOM.

Both keep "release exactly once" (the per-handle `released` flag already makes a double release harmless). Both rethrow,
so the boundary (§1) shows the card.

**Consequence for e2e.** Because the rethrow shows the card, and the card suspends input and never releases (change.md
decision 2), the restored input is **not observable** in the rendered page after a C-2 throw. `snapshot.inputEnabled`
reads `game.input.enabled`, which the card's own hold keeps `false`. So the release itself must be proven in vitest
(`createInputSuspender` with a throwing `onRelease`, plus helper (b) if chosen). The e2e proves the user-visible outcome:
after a forced throw in the parent-settings callback the card is visible, rather than a dialog-less frozen screen.

### 3. Testing approach (Q2)

- **vitest:** `vitest.config.mts` sets only `include: tests/**/*.test.ts`, so the environment is the default `node`.
  `package.json` has no `jsdom`/`happy-dom`. Adding a DOM environment is possible but not needed. Pure targets: the
  classifier (§1), L-8 in `createInputSuspender`, helper (b), an `e2eFail` parser (like `tests/e2eMonth.test.ts`), H-7
  (`recordRound`), and an H-6 view-model if the "show the no-voice line" decision is made pure (for example
  `readingNote(available: boolean) → string | null`, an optional nicety).
- **e2e infrastructure** (`playwright.config.ts`): project `chromium` (production build, port 4398; seed only) and
  project `chromium-hook` (`dist-e2e`, `E2E_HOOK=1`, preview on 4397). The regex
  `ROUND_SPEC = (task-round|narrator|first-launch|adaptive|parent-settings).spec.ts` routes specs, so **a new spec file must
  be added to that regex** or it runs against production without the hook. Helpers: `tests/e2e/support/hook.ts`
  (`snapshot`, `targets`, `tapScene`, `holdTouch`, `screenIs`, `tapTarget`, `playRoundRight`, `silenceSpeech`) and
  `welcome.ts` (`openWelcome(page, month?)`, `passWelcome`, `passWelcomeAsChild`, `openGate`, `typeIntoGate`).
- **Existing build-only pattern:** `src/main.ts` reads `(__E2E_HOOK__ ? e2eMonth(location.search) : null) ?? new Date().getMonth()`.
  `__E2E_HOOK__` is a `define` in `vite/config.shared.mjs` (`JSON.stringify(process.env.E2E_HOOK === '1')`, declared in
  `src/vite-env.d.ts`). In production terser drops the branch and the import is tree-shaken. A grep of the current `dist/_app/*.js`
  by the worker found neither `e2eMonth` nor `__martynkaE2E`. **But `vite/e2eHookGuard.mjs` `checkE2EHook` greps for a single
  marker, `E2E_HOOK_MARKER = '__martynkaE2E'`.** Nothing proves `e2eMonth` (or a new trigger) is absent, since that rests
  on DCE alone. The contract requires proof: give the trigger a unique marker string, for example the thrown message
  `'e2e-forced-failure'`, and extend `checkE2EHook` to a marker list (production: none present; e2e build: all present),
  with `tests/e2eHookGuard.test.ts` cases.
- **Trigger design (recommendation).** `?e2eFail=step|boot|parent` parsed by a pure `e2eFail(search)` next to `e2eMonth`,
  read in `main.ts` only under `__E2E_HOOK__`, and passed through `preBoot` into a registry key (as `month` is). The
  throw sites sit behind `if (__E2E_HOOK__ && …)` so DCE removes them:
  - `step`: a throw in a scene `update` once. This is carrier (a), the loop dies.
  - `boot`: a throw in `BootScene.create`. This is carrier (c), the `unhandledrejection` path.
  - `parent`: a throw in `UIScene.applySettings` after the dialog closes. This is C-2 plus carrier (b).

  The DOM-listener carrier can also be exercised with no product code:
  `page.evaluate(() => setTimeout(() => { throw new Error('x') }))` fires a real window `error`. It cannot reproduce (a),
  (c) or C-2. Rejected: a `fail()` function on `window.__martynkaE2E`, because the hook is documented as read-only.
  Never `page.clock` (contract).
- **Benign-event e2e:** `page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications' })))`
  checks that no card appears. It is cheap and needs no product code.

### 4. H-7: the −1 rule, every encoding, and the unlock-speed shift

Grep of `src/` and `tests/` for `loss`, plus a grep of `src/`, `tests/` and the docs for mastery-related assertions:

| Where | What encodes −1 | Change |
|---|---|---|
| `src/core/mastery.ts` `MasteryRules.loss`, `recordRound` else-branch `Math.max(0, mastery − rules.loss)` | the rule | miss: `streak = 0` only |
| `src/data/balance.ts` `balance.mastery` `loss: 1` and comment "a miss = -1" | the data | drop the field and fix the comment (change.md decision 4) |
| `tests/mastery.test.ts`: header comment ("a miss on the first try = -1"), `RULES` with `loss: 1`, tests "lowers mastery by one and resets the streak after a second-try answer" (3 → 2), "lowers mastery after a retype as well" (2 → 1), "does not go below 0 or above 5" (its `['second','retype']` half expects `mastery.S` to be 0 from an empty learner; if the miss branch stops writing `mastery[skillId]`, the value is `undefined` and `toBe(0)` fails, so either write the unchanged value or assert `?? 0`), and **`balance.mastery` "holds the rule values of the PRD" (`toEqual(RULES)`) — fails until `RULES` and `balance` change together** | tests | invert to "unchanged, streak 0"; add the "mastery never decreases" property |
| `tests/curriculumEnd.test.ts` `MASTERY` (`loss: 1`) and **"a warm-up records mastery only…" asserting `mastery[ids[0]]` 4 → 3 ("the mastery did change")** | test, **missed by change.md** | the warm-up still records (history and streak) but mastery stays 4; the assertion needs a different observable, for example a history entry or a reset streak |
| `context/foundation/prd.md` FR-013, `docs/ZADANIA.md` § 1 "Adaptacja trudności" | docs | as listed in change.md |
| `tests/e2e/*` | `adaptive.spec.ts` unlocks by playing right on the first try (`playRoundRight`); `first-launch.spec.ts` plays first-try misses in the warm-up but asserts only outcomes and stars; grep for `mastery` in `tests/e2e/` is empty | none |

Other mastery consumers, inspected for impact: `src/core/curriculum.ts` `unlockReady` (counts `>= unlockAt`, fine);
`src/core/progress.ts` `progressView` ranks "playable skills with at least one first-try miss" by mastery ascending, then
misses descending, then newest miss. Without −1 the ranking still works, but a miss no longer lowers the shown
"opanowanie k z 5". The tiebreaks (miss count, recency) carry the "weak" signal, and `tests/progress.test.ts` builds
mastery directly, so it does not depend on −1. `tests/placement.test.ts` only carries mastery through.

**Unlock speed, quantified** (computed for this research; script not committed).

The model: each first try is correct independently with probability p. +1 after 3 first-try successes in a row, then the
streak resets. Old rule: a miss means −1 and streak 0. New rule: a miss means streak 0. Mastery is capped at 5. Unlock
needs ⌈n/2⌉ skills of the current step at mastery 4. A round has 5 tasks, each from the current step with probability 0.6
(`balance.curriculum.weights`), with the skill chosen uniformly (`src/core/round/pick.ts` `pickRoundSkills` → `rng.pick`).
Easing is ignored. It would slow the old rule further at low p, because weak rounds cut the current share to 20 %.

Expected first-try attempts of one skill from 0 to 4 (exact, by value iteration; the new rule matches the closed form 4·(1−p³)/((1−p)p³)):

| p | old (−1) | new (no −1) | old / new |
|---|---|---|---|
| 0.6 | 808 | 36 | 22× |
| 0.7 | 154 | 25.5 | 6.0× |
| 0.8 | 45.5 | 19.1 | 2.4× |
| 0.9 | 20.2 | 14.9 | 1.4× |
| 1.0 | 12 | 12 | 1× |

Rounds until the step unlocks (Monte Carlo, 4000 runs per cell, cap 5000 rounds; mean / median / 90th percentile):

| step | p | old (−1) | new (no −1) |
|---|---|---|---|
| 2 skills (unlock 1 of 2) | 0.6 | 335 / 234 / 770 | 19 / 18 / 28 |
| | 0.7 | 61 / 44 / 130 | 14 / 13 / 19 |
| | 0.8 | 20 / 16 / 35 | 11 / 10 / 14 |
| | 0.9 | 10 / 10 / 15 | 9 / 8 / 11 |
| 3 skills (unlock 2 of 3) | 0.6 | ≥ cap in most runs (mean 4592) | 35 / 34 / 48 |
| | 0.7 | 535 / 367 / 1222 | 25 / 24 / 33 |
| | 0.8 | 53 / 44 / 97 | 19 / 18 / 25 |
| | 0.9 | 20 / 19 / 29 | 15 / 15 / 18 |

Reading: under the old rule a child at 60–70 % first-try accuracy practically never unlocks a 3-skill step. This matches the
audit's "drift down below p ≈ 0.79". Under the new rule the same child unlocks in about 25–35 rounds. At 90 % the change is
small (about 1–5 rounds). The new rule can unlock a step for a child who still misses 30–40 % of first tries, which is a
calibration question for S-17 (`unlockAt`, `streakForGain`, `unlockShare`). Record it as a follow-up with
`Trigger: S-17`, not as a reason to keep −1 (maintainer decision, contract).

### 5. H-6: knowing the voice is absent

- `src/ui/narrator.ts` `Narrator`: `readonly available: boolean` (`voice !== null`) and
  `onAvailability(callback) → unsubscribe` ("Calls back now and whenever availability changes"). `createNarrator` refreshes
  the voice on creation, on `voiceschanged`, and by polling every `voicePollMs` until `voiceTimeoutMs` when no voice was
  found at first. Availability **can change while the panel is open**, so subscribing beats a one-off read.
  `pickPolishVoice` (`src/core/narration/voice.ts`) picks a `pl` voice, local first.
- `UIScene` already keeps `this.narrator` and subscribes the speaker through `this.narrator?.onAvailability(refreshSpeaker)`
  in `create`, the same pattern. `SettingsPanelOptions` today: `stage`, `autoRead`, `autoReadDefault`, `progress`,
  `onConfirm`, `onCancel`, `parent`, with no voice field. The narrowest addition is an option like
  `watchVoice?: (cb: (available: boolean) => void) => () => void` (pass `narrator.onAvailability`), subscribed on open and
  unsubscribed in every close path (confirm, cancel, Escape, the scene-shutdown `closeDialog?.()`). Alternatively a plain
  `voiceAvailable: boolean` (simpler, stale if the voice appears late). `refresh` already redraws the reading block, so the
  line can toggle there.
- PRD FR-009: "bez polskiego głosu przycisk jest ukryty" covers the HUD button and says nothing about the setting. PRD
  Open question 7 ("Ryzyko: lektor") expects a missing voice on Android tablets. The PRD is silent on what the settings
  panel should show. Recommendation: keep change.md decision 6 (the switch stays active, plus a line).
- **E2E:** `silenceSpeech` (`tests/e2e/support/hook.ts`) gives `getVoices: () => []`, so the line is visible.
  `parent-settings.spec.ts` already calls it, so its existing assertions will now see the extra line (check for exact-text
  or count assertions over the reading block). `narrator.spec.ts` injects a fake voice list (`getVoices: () => voiceList`),
  which is reusable for the "Polish voice present → no line" case.

### 6. Card design (DESIGN-GAP)

The kit has no error view (change.md, design binding). Reusable pieces: `src/ui/dom/overlay.ts` `createOverlay(className, children)`,
`createText`, `createButton`; `src/style.css` `.overlay` (fixed, `inset: 0`, flex column, background `#FFF5DF`, colour
`#245C59`, `font-size: clamp(24px, 4vw, 48px)`, `z-index: 10`), `.overlay-actions`, `.overlay-muted` (fits the small
`__BUILD_ID__`), `.overlay-install` (the closest full-screen card with a button, z 10), `.overlay-parent` (z 15, holds the
parent dialogs), `.overlay-rotate` (z 20, portrait only). The card should sit **above 15** (it covers a parent dialog that
was open when the throw hit) and **below 20** (portrait still asks to rotate), for example z 18. It should be built with
`createOverlay` and not `openDialog`: no Escape (the card is terminal) and no focus trap needed beyond the one button.
Overlays deliberately do not stop propagation (Phaser audio unlock, `overlay.ts`). Since the card suspends Phaser input,
that is fine. Add DESIGN-GAP rows 29 (error card) and 30 (no-voice line) after row 28 in `docs/design-gaps.md`.

## Code References

- `node_modules/phaser/src/dom/RequestAnimationFrame.js` `step` / `stepTimeout`: callback before or after the reschedule
- `node_modules/phaser/src/loader/filetypes/FontFile.js` `onProcess`: `font.load().then(onProcessComplete).catch(warn + onProcessComplete)`
- `node_modules/phaser/src/input/touch/TouchManager.js` `onTouchStart` → `src/input/InputManager.js` `updateInputPlugins`: synchronous input dispatch
- `node_modules/phaser/src/sound/webaudio/WebAudioSoundManager.js` `onFocus`/`onBlur`/`onGameVisible`/`destroy`: unhandled promises
- `src/core/inputSuspend.ts` `createInputSuspender`: L-8 (`onRelease` before `enabled = true`, no `finally`)
- `src/scenes/UIScene.ts` `openSettings`, `applySettings`, `closeSettings`; `src/scenes/WelcomeScene.ts` `openParent`, `start`
- `src/ui/dom/{parentGate,stagePanel,settingsPanel}.ts`: `handle.close()` before the callback; `src/ui/dom/dialog.ts` `openDialog`
- `src/pwa/installHint.ts` `mountInstallHint`; `src/main.ts` `preBoot`, `createGame`, `e2eMonth` read
- `src/testing/e2eHook.ts` `installE2EHook` (`targets`: `inRoom() ? null : …`, already in place); `vite/e2eHookGuard.mjs` `checkE2EHook`, `E2E_HOOK_MARKER`
- `playwright.config.ts` `ROUND_SPEC`; `tests/e2e/support/hook.ts` `silenceSpeech`; `tests/e2e/narrator.spec.ts` fake `getVoices`
- `src/core/mastery.ts` `recordRound`, `MasteryRules`; `src/data/balance.ts` `mastery`; `tests/mastery.test.ts`; `tests/curriculumEnd.test.ts` `MASTERY` and the warm-up test
- `src/core/progress.ts` `progressView`; `src/core/round/pick.ts` `pickRoundSkills`
- `src/ui/narrator.ts` `Narrator.available`, `onAvailability`, `createNarrator` (`refresh`, poll); `src/ui/dom/settingsPanel.ts` `SettingsPanelOptions`, `refresh`

## Architecture Insights

- Phaser offers no error hook, so the window is the only boundary. It needs two listeners because boot runs inside a
  promise.
- The suspender is the single input switch. Holders own their release, the dialogs own only their DOM. That split is right:
  keep the release at the holder, made exception-safe, and do not move it into `openDialog`.
- Test-only behaviour follows one pattern: a pure parser plus an `__E2E_HOOK__`-gated read plus DCE. Today its proof covers
  one marker, and this change should generalise the guard.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md`: F6 (`WelcomeScene.openParent` guard).
  The guard is still missing, as shown in §2, so it stays in scope. F5 (long-press state) is out of scope per change.md.
  Still valid: the card is terminal.
- `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`: "`mountInstallHint` lets a tap through".
  **Contradicted by the repo now:** `main.ts` passes `() => suspender.suspend()` and `mountInstallHint` holds and releases.
  Closed.
- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`: e2e hook room targets. **Contradicted
  by the repo now:** `installE2EHook` `targets` already returns `null` for `nextRound`/`toRoom`/`unlockNext` in the room.
  Closed. It was conditionally in scope in change.md and is no longer needed.
- `context/archive/2026-10-13-adaptive-curriculum/*`: describes −1 historically. These are archives, left unedited.

## Related Research

- `context/archive/2026-10-13-parent-settings-progress/research.md` (suspender, settings panel), `context/archive/2026-10-13-adaptive-curriculum/research.md` (mastery rule).

## Open Questions (for /10x-plan to decide; none blocks)

1. Helper (b) versus `finally` per holder (§2). Both satisfy the contract.
2. Whether to `game.loop.sleep()` when the card shows, and whether to set `audio: { noAudio: true }` now (§1).
3. Whether the classifier treats `AbortError`/`NotAllowedError` rejections as benign (§1). No app source produces them today.
4. The exact Polish copy for the card (it must not promise that progress is kept before S-11) and for the no-voice line.
   Both need a `[reviewer]` teacher read.
5. The H-6 option shape: `watchVoice` subscription (recommended) or a static boolean (§5).
