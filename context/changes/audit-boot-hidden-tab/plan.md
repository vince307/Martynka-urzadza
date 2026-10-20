# Boot limit counts only visible time, "Ups!" card with a code, no site-data advice after NewerSave — Implementation Plan

## Overview

Slice 2 of autonomous run `2026-10-20-playtest-boot` (non-roadmap fix, source: observability audit
`context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md`, findings H-1, I-1 with the skill-id part
of C-1/C-2/C-3/I-3, and Z-8). The maintainer's decisions are fixed in `context/runs/2026-10-20-playtest-boot/scope.md` § 2
and copied in `change.md` as PA-1..PA-5; this plan implements them and does not re-decide them:

- **H-1** — the boot load limits (`balance.loader.slowAfterMs` / `totalMs`) count only the time the tab is visible, so a
  hidden tab never cuts the stalled Phaser queue; `REGISTRY_KEYS.bootLoad` records `hiddenMs`; the "Obrazki" section
  never blames the internet for a cut of a load that spent time in the background.
- **I-1** — the "Ups!" error card shows `Kod: <name>[/<skillId>] · Wersja <build>`; a failure while drawing a task
  (generator, tile choices, picture pool/ticks) carries the skill id and the cause's name.
- **Z-8** — a replace refused with `NewerSave` never shows `siteDataAdvice`; it shows `pl.saveTransfer.deviceNewer` and
  blocks writes through the same path as an ordinary refused write (refusal card once).

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave`, `saveProblem` and every
frozen fixture `tests/fixtures/save-v*.json` untouched). How each piece avoids a format change:

| piece | what it stores | why v4 is enough |
|---|---|---|
| H-1 | `hiddenMs` in the runtime registry key `REGISTRY_KEYS.bootLoad` (documented in `src/data/layout.ts` as "not in SAVE_KEYS") | never written by the autosaver; only `SAVE_KEYS` are |
| I-1 | nothing; the code is computed from the thrown error at the boundary; `saver.block('fatal', …)` keeps its argument | the card is DOM only; `blockedBy` is runtime |
| Z-8 | nothing new; runtime `blockedBy 'newer'` (already set today) and the `onBlocked` card | `blockedBy` is never saved (`AutosaveStatus`) |

**A phase that finds it must change what is saved, or the meaning of a saved field, stops with `STATUS: BLOCKED`**
(scope.md hard limit: a v5 need stops the ship at an open PR).

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and re-checked on this branch at
`28212e3`:

- **H-1**: `src/core/bootLimits.ts` has the pure `bootLimitSchedule(limits, now)`, `bootLimitDue(schedule, now)`,
  `bootLimitWait(at, now)`; its header says "A paused game loop does not pause it". `BootScene.preload` sets
  `startedAt = performance.now()`, arms two `window.setTimeout` timers through a local `arm(at, onDue)` (re-arms itself
  when it fires early), the cut callback re-checks `bootLimitDue(schedule, performance.now()) !== 'cut'`, records
  `pendingKeys`, calls `cutLoad`, `publish()` and logs `Boot load cut after N ms`. `clearTimers` runs on
  `Loader.Events.COMPLETE` and scene `shutdown`. `publish` writes `{ cut, cutByTable, creates, elapsedMs }`.
  Phaser 4.2.1 moves files to `inflight` only in `LoaderPlugin.start`/`update` (scene `UPDATE`), which stops with rAF in a
  hidden tab; in-flight XHRs keep downloading and keep their native timeout (research: per-file limit needs no change).
  `tests/bootLimits.test.ts` "counts the wall clock: a tab hidden for a minute is past the cut at once" pins today's
  behaviour and is rewritten on purpose.
- **H-1 panel**: `artHealthLines` (`src/core/artHealth.ts`) emits `{ kind: 'cut', count }` when `cut > 0` and skips the
  separate cause/advice lines when the main cause is `cut` (`cutSaysIt`); `createArtHealthView`
  (`src/ui/dom/artHealthView.ts`) maps it to `pl.settings.artCut` ("… Przy lepszym internecie uruchom grę ponownie.");
  `UIScene.openSettings` passes `cut: bootLoad.cut.length`. The e2e hook's `bootLoadSnapshot` (`src/testing/e2eHook.ts`)
  and the type in `tests/e2e/support/hook.ts` read the four fields.
- **I-1**: `installErrorBoundary` passes `event.error ?? event.message` / `event.reason`; the callback in `src/main.ts`
  calls `mountErrorCard(document.body, __BUILD_ID__, reload)` and `saver.block('fatal', errorName(error))`.
  `mountErrorCard` draws `pl.errorCard.build(buildId)` ("Wersja <id>"). `errorName` (`src/core/save.ts`) returns `e.name`
  or `'Error'`. `generateTask` (`src/core/tasks/generateTask.ts`) wraps only `generate(skill, rng)` and rethrows
  `Object.assign(new Error('Skill <id>: …'), { cause })` (name `Error`, I-3); `boundOf`/`numberChoices` run after the
  `try` (C-3); `assertPool`/`lineTicks` (`src/core/tasks/visual.ts`, pure, no rng) run only inside widget `render`
  (`IconGroups`, `IconRow`, `Jugs`, `MoneyTable`, `NumberLine`; C-2); `TaskScene.drawPrompt` calls `pictureLayout`
  without `task.skillId` (C-1).
- **Z-8**: `Autosaver.replace` catch: `NEWER_SAVE` → `blockedBy ??= 'newer'`, return, no `refuseWrites`, no `onBlocked`.
  Only `NewerSave` can reach it (`writeVerdict` refuses other writers only in `mode 'normal'`). `failureText`
  (`src/ui/dom/saveSummaryView.ts`): forced and not `Busy|Blocked|InvalidSave` → `pl.saveTransfer.siteDataAdvice`
  (which tells the parent to delete site data — that deletes the newer save). `pl.saveTransfer.deviceNewer` already
  exists and fits; no new copy, no DESIGN-GAP 154. The refusal card (`.overlay-save-refused`, z-index 10) mounts under
  the parent dialog (`.overlay-parent`, 15) and is seen after the dialog closes; the input suspender is
  reference-counted, so the nested sessions do not collide.
- `docs/design-gaps.md` ends at row 152. `context/foundation/lessons.md` does not exist (checked; nothing to apply).
- **Baseline** (contract): `main` 48c2c7e, unit 3683, e2e 141. Every phase measures its own branch baseline before its
  first edit and writes `baseline + delta`.

## Desired End State

- A tablet that hides the game while it loads (app switch, screen lock) and comes back after any time continues the
  same load; the slow line and the cut come only after `slowAfterMs` / `totalMs` of VISIBLE time; `bootLoad.hiddenMs`
  says how long it was hidden; the console cut line names the hidden time.
- If a load that spent time in the background is still cut, "Obrazki" shows a calm background line that says a restart
  helps and never mentions the internet; a load that was never hidden shows today's lines unchanged.
- The "Ups!" card shows title, body, button and one muted line `Kod: <code> · Wersja <build>`, where `<code>` is the
  error's name, or `<name>/<skillId>` for a failure while drawing a task (e.g. `RangeError/E3.9.mult_groups`).
- A forced or plain import/reset refused with `NewerSave` shows `deviceNewer` in the dialog, never `siteDataAdvice`;
  writes are blocked as `newer`, and the existing refusal card (with `Kod: NewerSave`) is there when the dialog closes.
- Verify: unit tests per phase (red first), the full local gate, e2e `+ 0` in code phases, then `+ 1`, `+ 0` (tightened
  spec), `+ 1` in the e2e phases 8–10.

### Key Discoveries:

- In a hidden tab the effective clock `now - hiddenMs(now)` stands still, so a rule built on it can never return `cut`
  during a hidden span; the scene only has to stop its timers on hide and re-arm on show (research § H-1).
- `numberChoices` consumes rng after the generator; moving it inside the same `try` keeps the rng order, so no seeded
  task changes. `assertPool`/`lineTicks` consume no rng. `tests/contentInvariants.test.ts` and the generator tests are
  the oracle that the seeds did not move (their `git diff --stat` stays empty).
- Headless Chromium cannot hide a page; a faked `document.hidden`/`visibilityState` plus a dispatched
  `visibilitychange` reaches `BootScene`'s listener, and with `?e2eArt=stallall` (files hang, per-file limit off,
  `E2E_BOOT_LIMITS` 500/3000 ms) only the total limit can end the load — enough to observe the rule (not the real Phaser
  stall, which is inferred from source).

## What We're NOT Doing

- No save-format change, no new saved field, no change to `MIGRATIONS` or any fixture.
- No hidden term in the per-file limit (`balance.loader.timeoutMs`, XHR timeout) — research R-2; no cap on hidden time
  (D-2); no new `balance` number.
- No change to the `src/main.ts` `visibilitychange` handler (saver flush, narrator cancel): the hidden listener is owned
  by `BootScene` (follow-up L-S3 does not fire).
- No change to `pl.loading.slow` (does not blame the internet), `pl.errorCard.title/body/restart` (S12-13 not fired),
  `replaceGate`, the forced-replace copy (§ 26 `putBackupOnce`), `writeVerdict` or the stale-window generation check.
- No try/catch around widget `render`s; widgets keep `assertPool`/`lineTicks` as a backstop.
- Every other finding of the audit (H-6 "(timeout or network)" log label and the rest of MEDIUM/LOW) and every deferred
  follow-up listed in research § Historical Context stays deferred (PA-4) and is restated in the follow-ups file.
- No roadmap status edit (non-roadmap change).

## Implementation Approach

Pure rules in `src/core` first with failing tests (visible-time limit, background cut line, error code and skill-id
error, refused-replace path and its text), then the thin wiring (`BootScene`, `UIScene`, `errorCard`, `main.ts`,
`TaskScene`), then docs and the seam sweep, then one e2e phase per browser-visible risk. Strings in `pl.ts`, no new
numbers; the one new player-visible line gets DESIGN-GAP row 153. Each phase is green alone.

## Critical Implementation Details

- **Visible-time lifecycle (phase 2).** Seed the hidden span from `document.hidden` at `preload` start; a page that
  starts hidden arms NO timer at `preload` (the first show arms them). On hide: record the span start, clear both
  timers. On show: act only when a hidden span actually closed (a `visibilitychange` to visible without a prior hide —
  a duplicate event, the e2e fake, a browser quirk — changes nothing); then `clearTimers()` FIRST and re-arm the slow
  timer only while `phase === 'loading'` and the cut timer only while `phase !== 'over'`, each with
  `bootLimitWait(at, now, hiddenMs)`, so at most one timer per limit is ever pending (plan review F2). Every due-check
  (`arm`'s early-fire re-check and the cut guard) uses the hidden-aware rule. The listener is removed in the same two
  places `clearTimers` runs (`COMPLETE`, `shutdown`); a show after the load ended must arm nothing.
- **Refused replace order (phase 6).** In the `replace` catch keep the counters and `lastFailure` as they are, then for
  `NEWER_SAVE` call `refuseWrites('newer', NEWER_SAVE)` (first reason wins, cancels the timer, calls `onBlocked` once)
  instead of the bare `blockedBy ??= 'newer'`; return the same `{ ok: false, error: 'NewerSave' }`.

## Phase 1: Boot limits count only visible time (H-1 core)

Driver: tdd
Driver why: the hidden-time accumulator and the hidden-aware due/wait rule are absent pure functions with exact numeric oracles — failing tests lead.

### Overview

`src/core/bootLimits.ts` learns hidden time; the existing test that pins the wall clock is rewritten on purpose.

### Changes Required:

#### 1. Hidden span and hidden-aware rule

**File**: `src/core/bootLimits.ts`

**Intent**: a small immutable hidden-time record (span start or none, accumulated total) with `startHidden`/
`endHidden`/`hiddenMsAt(record, now)`, idempotent (a second hide or show changes nothing), and `bootLimitDue`/
`bootLimitWait` taking the hidden total so the effective clock is `now - hiddenMs`. Rewrite the header comment: wall
clock minus hidden time (audit H-1).

**Contract**: `bootLimitDue(schedule, now, hiddenMs = 0)`, `bootLimitWait(at, now, hiddenMs = 0)` (default keeps
callers compiling); the record type and its three functions exported; NaN/negative clocks stay "not due"; no Phaser, no
`document` (ESLint boundary).

#### 2. Tests

**File**: `tests/bootLimits.test.ts`

**Contract**: replace "counts the wall clock: a tab hidden for a minute is past the cut at once" with its opposite:
limits 8000/50000 from 0, hidden 10 000 → 70 000: at 70 000 the rule says `slow`, not `cut`; cut from 110 000;
`bootLimitWait(cutAt, 70 000, 60 000)` = 40 000. Plus: a span still open counts up to `now`; hide twice / show twice is
idempotent; hidden time can never make a due moment earlier; a page never hidden behaves exactly as before (existing
cases unchanged).

### Success Criteria:

#### Automated Verification:

- New and rewritten tests red before the change (assertion, not import error: export stubs first), green after; unit `<branch baseline> + N`
- Deliberate break: ignore `hiddenMs` in `bootLimitDue` → the hidden-minute case red; reset the span start on a second hide → the idempotence case red; each restored; meta-check: the rewritten case must fail on today's code (it is the old assertion inverted), otherwise it proves nothing
- `grep -rn "bootLimitDue\|bootLimitWait" src` lists only `bootLimits.ts` and `BootScene.ts`
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: BootScene pauses its limits while the tab is hidden and records the hidden time (H-1)

Driver: impl
Driver why: scene glue (a document listener and timer re-arming around the phase-1 rule) plus a registry field — browser-only behaviour, proven by phase 8's e2e.

### Overview

`BootScene.preload` feeds `visibilitychange` into the phase-1 record; `bootLoad` and the hook carry `hiddenMs`.

### Changes Required:

#### 1. Scene wiring

**File**: `src/scenes/BootScene.ts`

**Intent**: per Critical Implementation Details: own `visibilitychange` listener (reads `document.hidden`), clear timers
on hide, re-arm on show, hidden-aware checks everywhere the wall clock is asked; `publish` adds `hiddenMs`
(rounded); the cut warning reads `Boot load cut after N ms (hidden H ms): …`; the comment above the timers explains
visible time (H-1, Phaser queue advances only on `UPDATE`).

**Contract**: `REGISTRY_KEYS.bootLoad` value `{ cut, cutByTable, creates, elapsedMs, hiddenMs }` (`elapsedMs` stays
wall time); listener added once per `preload`, removed on `Loader.Events.COMPLETE` and `shutdown`.

#### 2. Registry doc and hook

**Files**: `src/data/layout.ts` (`REGISTRY_KEYS.bootLoad` comment), `src/testing/e2eHook.ts` (`bootLoadSnapshot`),
`tests/e2e/support/hook.ts` (snapshot type)

**Intent**: document and expose `hiddenMs`; still "runtime only, not in SAVE_KEYS".

**Contract**: hook build only for the snapshot; `SAVE_KEYS` unchanged.

### Success Criteria:

#### Automated Verification:

- `grep -n "visibilitychange" src/scenes/BootScene.ts` shows one `addEventListener` and its `removeEventListener`; `git diff --stat main -- src/main.ts` shows no change to the `visibilitychange` handler (L-S3 not fired)
- `grep -n "bootLoad" src/data/layout.ts` shows `hiddenMs` and "not in SAVE_KEYS"; `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty
- Deliberate break: no automated unit test can see the scene listener (canvas boot, real timers); record that the proof is phase 8's e2e (its break: the scene passes `hiddenMs` 0 to the rule, i.e. no subtraction → red; dropping only the clear-on-hide is NOT a valid break, the hidden-aware guard re-arms and stays green by design, A-2) plus the [reviewer] row below
- Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (the `#15 A-1/A-2` and `#14 B-4` stallall specs in `load-and-tab-guard.spec.ts` stay green: never hidden, same timing)

#### Manual Verification:

- [reviewer] Reading `BootScene.preload` against the lifecycle: seed from `document.hidden`; hide clears both timers; show re-arms only by phase; no arm after `COMPLETE`/`shutdown`; the cut guard asks the hidden-aware rule
- [human] On a real tablet (iPad Safari or Android Chrome, production build): start the game on a slow link, switch to another app for over a minute during the loading screen, come back: loading continues, no stand-in pictures; settings "Obrazki" shows no cut line

---

## Phase 3: "Obrazki" names the background, not the internet (H-1 panel)

Driver: tdd
Driver why: the background variant of the cut line is an absent branch of the pure `artHealthLines` rule — a failing test leads; string and view mapping follow.

### Overview

A cut of a load that spent time hidden gets its own calm line (DESIGN-GAP 153).

### Changes Required:

#### 1. Rule

**File**: `src/core/artHealth.ts`

**Intent**: `ArtHealthLinesInput` gains `background: boolean` (the load spent time hidden); with `cut > 0` and
`background` the cut line is `{ kind: 'cut', count, background: true }`; everything else unchanged (the `cutSaysIt`
skip still applies, so no `artRestart` advice line follows a background cut).

**Contract**: `ArtHealthLine` cut variant `{ kind: 'cut'; count: number; background?: true }` (or a `background:
boolean` field — implementer picks the one that keeps existing `toEqual` cases unchanged); `background` optional in the
input, default `false`.

#### 2. Copy, view, caller

**Files**: `src/data/pl.ts` (`settings.artCutBackground`), `src/ui/dom/artHealthView.ts`, `src/scenes/UIScene.ts`
(`openSettings`: `background: (bootLoad.hiddenMs ?? 0) > 0`)

**Intent**: one calm sentence, e.g. "Część obrazków nie zdążyła się wczytać, bo gra była w tle podczas uruchamiania.
Uruchom grę ponownie." (final wording by the implementer + teacher read; must say a restart helps and must not say
"internet").

**Contract**: new key only; `artCut`, `artCause.*`, `artRestart` unchanged.

#### 3. Design gap

**File**: `docs/design-gaps.md`

**Intent**: row **153** "The kit has no line for pictures cut while the game was in the background at start" (text,
place: the cut line of "Obrazki").

#### 4. Tests

**Files**: `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts`

**Contract**: `cut: 3, background: true` → the background cut line and no cause/advice line; `cut: 3, background:
false` → today's lines (existing cases unchanged); `background: true, cut: 0` → no cut line; `pl.settings.artCutBackground`
does not match `/internet/i` and mentions a restart.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-2 count> + N`; existing `artHealthLines` cases unchanged
- Deliberate break: ignore `background` in `artHealthLines` → the background case red; put "internet" in the new string → the text test red; each restored; meta-check: the view mapping has no unit test (L-8 deferred) — the [visual] row is its proof
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#14 B-4` "a cut start says some pictures did not finish" still sees `artCut`: never hidden)

#### Manual Verification:

- [reviewer] Teacher read of `settings.artCutBackground` (spelling, comma before "bo", calm, no blame on the internet)
- [visual] Settings "Obrazki" at 1440 and 1024 wide, states: cut without a hidden span (today's `artCut`), cut after a hidden span (`artCutBackground`) — reached in the hook build with `?e2eArt=stallall` and the visibility fake of phase 8

---

## Phase 4: An error code with the skill id (I-1 core, C-2, C-3, I-3)

Driver: tdd
Driver why: `errorCode` and the skill-carrying error of `generateTask` are absent pure behaviour with exact oracles — failing tests lead.

### Overview

Core can turn any thrown value into a short code; a task that fails while being drawn throws with its skill id and
the cause's name, and the picture limits are checked at generation.

### Changes Required:

#### 1. Code helper

**File**: `src/core/save.ts` (beside `errorName`)

**Intent**: `errorCode(e)` = `errorName(e)`, plus `/<skillId>` when `e` carries a non-empty string `skillId`.

**Contract**: `errorCode(e: unknown): string`; never throws (a string, `null`, a frozen object all give a code).

#### 2. Skill-carrying failure

**Files**: `src/core/tasks/generateTask.ts`, `src/core/tasks/visual.ts`

**Intent**: one `try` covers the generator, the tile choices (`boundOf`/`numberChoices`, same rng order) and a new
pure `assertDrawable(task)` (in `visual.ts`: `assertPool`/`lineTicks` over `visual` and `hintVisual`, the same limits
the widgets use, no rng); the rethrown error keeps the message `Skill <id>: …` and `cause`, takes the cause's `name`
(or `Error`) and carries `skillId`.

**Contract**: thrown value `Error & { skillId: string; cause: unknown }` with `name` = cause name; the "No generator"
throw also carries `skillId`; widgets keep their asserts.

#### 3. Tests

**Files**: `tests/errorCode.test.ts` (new) or `tests/save*.test.ts`, `tests/generateTask.test.ts`,
`tests/solvableInMode.test.ts` (existing case kept)

**Contract**: `errorCode(new RangeError('x'))` = `RangeError`; with `skillId: 'E3.9.a'` = `RangeError/E3.9.a`; `'boom'`,
`null` → `Error`. A registered test generator that throws `RangeError` → the thrown error has `name` `RangeError`,
`skillId`, message with the id; a generator returning a `visual` over the icon limit → throws with `skillId` from
`generateTask` (not later); a tiles skill whose tile range cannot hold the answer → throws with `skillId`.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-3 count> + N`
- Seeds unchanged: `git diff main -- tests/generateTask.test.ts tests/contentInvariants.test.ts tests/solvableInMode.test.ts | grep '^-[^-]'` empty (only additions), and those suites are green; the rng-order oracle is the existing case "does not consume rng differently from the generator: the task text matches the bare generator" in `tests/generateTask.test.ts`
- Deliberate break: call `numberChoices` before the generator (rng order changed) → the "does not consume rng differently" case of `tests/generateTask.test.ts` red (proves the oracle sees rng order); drop `assertDrawable` from the `try` → the icon-limit case red; drop the name copy → the `RangeError` name case red; each restored
- `npm run sample -- E1` … `E6` exit 0 (unchanged content)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

---

## Phase 5: The "Ups!" card shows the code (I-1, C-1)

Driver: impl
Driver why: DOM card parameter and boundary glue around the phase-4 helper, plus a one-argument scene fix — proven by phase 9's e2e and screenshots.

### Overview

The card's build line becomes `pl.saveFailed.detail(code, build)`; the prompt-fitting layout call names the skill.

### Changes Required:

#### 1. Card

**File**: `src/ui/dom/errorCard.ts`

**Intent**: `mountErrorCard` takes the code and draws `pl.saveFailed.detail(code, buildId)` in the muted line in place
of `pl.errorCard.build(buildId)`; doc comment names DESIGN-GAP 29 and 51; idempotent as today (the first code wins).

**Contract**: `mountErrorCard(parent, buildId, code, onRestart)` (or an options object); no other caller.

#### 2. Boundary and prompt

**Files**: `src/main.ts` (boundary callback: `errorCode(error)` to the card; `saver.block('fatal', errorName(error))`
unchanged), `src/scenes/TaskScene.ts` (`drawPrompt`: pass `task.skillId` to `pictureLayout`)

**Intent**: the card shows the code of the error that triggered it; a `tallOf` failure in the prompt path names the
skill (C-1).

**Contract**: `pl.errorCard.build` stays only if still used elsewhere (grep; remove it in phase 7 if unused).

### Success Criteria:

#### Automated Verification:

- `grep -n "mountErrorCard" src` shows the one caller passing `errorCode(error)`; `grep -n "pictureLayout(" src/scenes/TaskScene.ts` shows `task.skillId` in every call
- Deliberate break: no unit test renders the card (node environment); the proof is phase 9's tightened spec (break: pass `''` as code → red) plus the [visual] row
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`error-boundary.spec.ts` uses a substring match on `Wersja <id>`, which the new line still contains)

#### Manual Verification:

- [visual] The "Ups!" card at 1440 and 1024 wide, states: `?e2eFail=step` (`Kod: Error · Wersja <id>`), `?e2eFail=boot`; the line is muted, one line at 1024, the button keeps focus

---

## Phase 6: A refused replace never advises deleting site data (Z-8)

Driver: tdd
Driver why: the refused-replace branch of `Autosaver.replace` and the `failureText` mapping are pure behaviour with direct oracles in existing unit suites — failing tests lead.

### Overview

`NewerSave` from `replace` blocks writes like an ordinary refusal and the dialogs show `deviceNewer`.

### Changes Required:

#### 1. Autosaver

**File**: `src/core/autosave.ts` `replace`

**Intent**: per Critical Implementation Details: `refuseWrites('newer', NEWER_SAVE)` for `NEWER_SAVE`, so `onBlocked`
fires once and the debounce timer stops.

**Contract**: `ReplaceResult` unchanged; `onBlocked` signature unchanged; S12-11 counters unchanged.

#### 2. Dialog text

**File**: `src/ui/dom/saveSummaryView.ts` `failureText`

**Intent**: a `NewerSave` result maps to `pl.saveTransfer.deviceNewer` whether or not the replace was forced, before the
forced branch; `siteDataAdvice` stays only for other forced failures.

**Contract**: signature unchanged; callers `saveImportDialog.ts`, `saveResetDialog.ts` unchanged.

#### 3. Tests

**Files**: `tests/autosave.test.ts`, `tests/saveSummaryView.test.ts`

**Contract**: a store whose `write(…, 'replace')` rejects with name `NewerSave` → `replace` returns `NewerSave`,
`status().blockedBy` = `newer`, `onBlocked` called once with (`'newer'`, `'NewerSave'`), a later `replace` → `Blocked`,
a later change schedules no write; `failureText({ ok: false, error: 'NewerSave' }, true, plain)` and `(…, false, plain)`
→ `deviceNewer`; any forced failure → never `deviceNewer` unless `NewerSave`; `timeout` → `replaceUnconfirmed` (kept).

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-5 count> + N`
- Deliberate break: keep `blockedBy ??= 'newer'` without `refuseWrites` → the `onBlocked` case red; remove the `NewerSave` branch in `failureText` → both text cases red; each restored; meta-check: the forced case must go red on today's code with `siteDataAdvice` (check the received value), proving the test sees the harmful text
- `git diff --stat main -- src/core/save.ts src/storage` shows no change to `writeVerdict`/`guardedPut`
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`save-transfer-blocked.spec.ts`, `stale-tab.spec.ts` green)

#### Manual Verification:

- [visual] Import and reset dialogs at 1440 and 1024 wide after a replace refused with `NewerSave`: the dialog shows `deviceNewer`, no "usuń dane"; after "Zamknij" the refusal card with `Kod: NewerSave · Wersja <id>` is visible and its button can be tapped (reached with the phase-10 steps)

---

## Phase 7: Docs, follow-ups and seam sweep

Driver: impl
Driver why: rule-file text, design-gap rows, the follow-ups file and a sweep of phases 1–6 — docs and glue, proven by the gate.

### Overview

The rule files and the design gaps say what the code now does; deferred audit findings get triggers; leftovers go.

### Changes Required:

#### 1. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` if it repeats the same facts — grep first)

**Intent**: fix the sentences this change makes untrue: the boot loader "runs its limits on the wall clock" → visible
wall-clock time (hidden time not counted, `hiddenMs` in `REGISTRY_KEYS.bootLoad` beside `cutByTable` and `elapsedMs`);
the error boundary card now shows `Kod:` (`errorCode`); add one sentence for this change (`src/core/bootLimits.ts`
hidden span, "Obrazki" background line `artCutBackground` / gap 153, `generateTask` skill-carrying errors and
`assertDrawable`, refused replace → `refuseWrites` and `deviceNewer`; save format stays v4).

#### 2. Design gaps

**File**: `docs/design-gaps.md`

**Intent**: rows 29 and 51 mention that the error card now carries the `Kod:` line; row 71 (site-data advice) says it
never follows a `NewerSave`.

#### 3. Follow-ups

**File**: `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item this change touched, each with a `Trigger:` line: audit H-6 and the other
MEDIUM/LOW rows of the 2026-10-17 report (Trigger: next change to `BootScene.preload` log lines / the named file);
A-6, B-6 (Android measurement / a report of a cut boot — now diagnosable through `hiddenMs`); A-10; L-8 DOM test of
`createArtHealthView`; ASL-05, ASL-08, ASL-09; G-3; S12-03, S12-11 (replace failures still count as autosave
failures), S12-13; FontFace limit; refusal-card focus after a dialog closes (Trigger: visual gate shows focus lost);
real-device hidden-tab measurement (Trigger: the phase-2 [human] row fails); TXT-06 marked closed by this change;
the stale-tab-and-health "isolation-only red of `load-and-tab-guard`" item (fired by phase 8: closed if phase 8 ran the
spec alone green, else restated with its evidence).

#### 4. Seam sweep

**Files**: anything phases 1–6 touched

**Intent**: no second copy of hidden-time maths outside `bootLimits.ts`; no comment left saying the boot limits run on
the plain wall clock or that "a paused game loop does not pause it"; `pl.errorCard.build` removed if unused;
`errorName`/`errorCode` the only error-to-string helpers (no new copies; the `isRecord` copies stay at three); unused
exports removed.

### Success Criteria:

#### Automated Verification:

- `grep -rn "wall clock" src/core/bootLimits.ts src/scenes/BootScene.ts CLAUDE.md` shows only text that names the hidden time
- `grep -c "^Trigger:" context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` ≥ 10
- `grep -rn "errorCard.build" src` empty, or the remaining use named in the phase commit
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] The CLAUDE.md sentences match the code (symbols exist: `grep` each one); save format v4 stated

---

## Phase 8: A hidden tab does not cut the boot load — e2e (#15)

Driver: e2e
Driver why: risk #15 (a stalled start leaves the child on stand-ins or a dead screen) exists only across the real loader, window timers and the visibility event — built in phases 1–3, contract `E2E=on`.

### Overview

One spec in `tests/e2e/load-and-tab-guard.spec.ts` (hook build, port 4397) proves the visible-time limit and the panel
line.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/load-and-tab-guard.spec.ts` (`#15 H-1` title)

**Contract**: `?e2eArt=stallall` with routes that never answer (the existing `hold` helper); after the hook exists and
before 3 s: fake `document.hidden = true` / `visibilityState = 'hidden'` (`Object.defineProperty`, configurable) and
dispatch `visibilitychange`; stay hidden for more than 3 s of wall time (poll, never a fixed sleep longer than the
check needs) → `screen` still `loading`, `bootLoad` null; show (fake back, dispatch) → the cut comes, `bootLoad.hiddenMs`
≥ the hidden span, `elapsedMs` ≥ 3000 + span; open settings → "Obrazki" shows `artCutBackground`, not `artCut`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate break: the scene passes `hiddenMs` 0 to `bootLimitDue`/`bootLimitWait` (the subtraction removed) → the "still loading while hidden" assertion red — this breaks the RULE, not the fake; pass `background: false` in `UIScene` → the line assertion red), green after; restored
- `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` green run ALONE (fires the stale-tab-and-health follow-up "Isolation-only red of the `load-and-tab-guard` e2e (#2, P-5)": if that red reappears, fix it in this phase or record evidence and restate it in `follow-ups/review-fixes.md`); full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Phase 9: The "Ups!" card shows `Kod:` — e2e (#15)

Driver: e2e
Driver why: risk #15 (a thrown exception must end on the calm card) — the code line is DOM drawn by the boundary in the browser, built in phase 5, contract `E2E=on`.

### Overview

The existing error-boundary specs assert the exact new line.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/error-boundary.spec.ts`

**Contract**: in "#15 … an exception in a frame shows the restart card": assert the exact text
`pl.saveFailed.detail('Error', build)` (the forced failure throws a plain `Error`), and that `pl.errorCard.build(build)`
alone is not the line; same for the boot case.

### Success Criteria:

#### Automated Verification:

- Deliberate break: pass `errorName` of a fixed `'X'` or `''` as the code in `main.ts` → the tightened assertion red; restored
- `npx playwright test tests/e2e/error-boundary.spec.ts` green; full e2e (orchestrator) `<branch e2e baseline> + 0` over phase 8 (assertions tightened, no new test)
- Full local gate green

---

## Phase 10: A refused replace shows "deviceNewer" and the refusal card — e2e (#2)

Driver: e2e
Driver why: risk #2 (progress gone: the old advice would delete the newer save) runs through the import/reset dialogs, the autosaver and the refusal card in the browser — built in phase 6, contract `E2E=on`.

### Overview

One spec in `tests/e2e/save-transfer-blocked.spec.ts` (hook build) proves the dialog text and the card.

### Changes Required:

#### 1. Spec (and a seam only if needed)

**Files**: `tests/e2e/save-transfer-blocked.spec.ts` (`#2 Z-8` title); `src/testing/e2eHook.ts` only if needed

**Contract**: fresh context, `?e2eSave=newer` (the store keeps the first write and refuses later ones with
`NewerSave`): pass the welcome, open settings → "Zacznij od nowa" → confirm → the dialog shows `deviceNewer` and not
`siteDataAdvice`; `save.blockedBy` `newer`; close → the refusal card is visible with `Kod: NewerSave`. If an ordinary
write is always refused before the dialog can replace (so the dialog opens already `blocked`), add the seam value
`newer-replace` that refuses only `mode 'replace'` — inside the existing `e2eSave` marker of `vite/e2eHookGuard.mjs`
(absent from `dist/`, the build guard proves it). Plan review: the existing seam most likely suffices — `#2 P-5` in
`load-and-tab-guard.spec.ts` shows the first write at start succeeds and stores `SAVE_VERSION + 1`, so a reset opened
before any further state change reaches `store.write(…, 'replace')` and gets `NewerSave`; answer no task before the
reset.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate break: remove the `NewerSave` branch of `failureText` → the dialog text assertion red; keep the bare `blockedBy ??=` in `replace` → the card assertion red), green after; restored
- `npx playwright test tests/e2e/save-transfer-blocked.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1` over phase 9
- `npm run build` prints `e2e hook: absent (` (no seam leaked)
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- Hidden-time record and hidden-aware due/wait (exact numbers, idempotence, never earlier).
- `artHealthLines` background cut line; text without "internet".
- `errorCode`; `generateTask` skill-carrying errors (generator, tiles, picture limits), seeds unchanged.
- `Autosaver.replace` refused with `NewerSave` → `refuseWrites` once; `failureText` mapping.

### Integration Tests:

- e2e #15 H-1 (hidden tab, visible-time cut, background line), #15 card `Kod:`, #2 Z-8 (dialog text, refusal card).

### Manual Testing Steps:

1. Tablet, slow link: hide the game during loading for a minute, come back: loading continues, no stand-ins.
2. `?e2eFail=step` (hook build): the card shows `Kod: Error · Wersja <id>`.
3. `?e2eSave=newer`: reset from settings → `deviceNewer`; after closing, the refusal card.

## Performance Considerations

One listener and two timers during boot; nothing per frame.

## Migration Notes

None: save format v4 unchanged (table in Overview).

## Known risks

- The real Phaser stall in a hidden tab and the behaviour of in-flight XHRs on iPad/Android are inferred from source,
  not measured; the e2e proves the rule with a faked visibility state. The phase-2 [human] row is the real-device check.
- A cut after a hidden span means the VISIBLE 50 s ran out (slow link); D-1 names the background then. A parent on a
  slow link who also switched apps reads "w tle" rather than "internet" — accepted (A-3).
- The refusal card lies under the open dialog until it closes (research); its button focus after the close is a
  [visual] check, follow-up if lost.
- (plan review F4) `Autosaver.replace` calling `refuseWrites` goes slightly beyond scope Z-8's literal text (no
  site-data advice): kept because today the bare `blockedBy ??= 'newer'` makes the later `refuseWrites` see a non-first
  reason, so `onBlocked` never fires and the child plays on with writes silently blocked. One line in the same catch.
- (plan review F5) `assertDrawable` must stay a thin wrapper over `assertPool`/`lineTicks` with `ART_LIMITS` (the pool
  limits only); it must NOT call the broader `validateVisual` at runtime (that would turn content-only problems the
  widgets tolerate into round-build throws).

## Autonomous decisions

- **A-1 Both scene limits count visible time; the per-file limit does not** (change.md D-1, research R-2). Rejected:
  `disableVisibilityChange` (not in Phaser 4 `Config`; would keep audio and timers running), a hidden term in
  `timeoutMs`. Would change: a device measurement showing in-flight downloads stall while their XHR timer runs.
- **A-2 Timers cleared on hide, re-armed on show** (not left running and re-checking). Rejected: a polling re-arm while
  hidden. Why: browsers throttle hidden timers anyway; clear/re-arm has one obvious state. Would change: a missed
  `visibilitychange` on some browser (then a re-check on every timer fire is the fallback — the hidden-aware guard
  already gives it).
- **A-3 Background line whenever the cut load spent any time hidden** (`hiddenMs > 0`), DESIGN-GAP 153. Rejected: a
  threshold; naming the internet after a long visible stall. Why: PA-1 "the panel must not blame the internet in that
  case", one flag, no new number. Would change: the maintainer preferring the internet line when visible time alone
  ran out.
- **A-4 Code = `name` or `name/skillId` on the card's existing muted line via `pl.saveFailed.detail`** (D-3, D-4 cheap
  set C-1..C-3 + I-3). Rejected: the full message; widget try/catch. Would change: the maintainer wanting no code on a
  child-facing card.
- **A-5 `NewerSave` maps to `deviceNewer` also for a non-forced replace.** Rejected: only forced (scope literal "a
  forced replace refused"). Why: the plain text says nothing true either; the same refusal deserves the same words;
  the forced case is the one the scope names and is covered. Would change: the maintainer wanting the plain line.
- **A-6 Z-8 narrowed to `NewerSave`** (research R-4): `OtherWriterSave`/`PreviousPageSave` cannot reach `replace`.
  Would change: `writeVerdict` refusing other writers in `mode 'replace'`.
- **A-7 No raise of the refusal card above the dialog** (research R-4): the dialog already shows `deviceNewer`; the card
  is seen after the close. Would change: the [visual] row showing the card never appears or is unreachable.
- **A-8 Three e2e phases after the sweep, one per risk** (#15 H-1, #15 card, #2 Z-8); a seam `newer-replace` only if
  `?e2eSave=newer` cannot reach the refused replace. Would change: the phase-10 agent finding the existing seam enough.
- **A-9 No `[human]` row for a PRD conflict**: no decision here goes against the PRD's literal text (the PRD names no
  boot limit, error-card code or site-data advice). The one `[human]` row (2.6) is a real-device check only a person
  with a tablet can do.

## References

- Research: `context/changes/audit-boot-hidden-tab/research.md`
- Change identity and PA-1..PA-5, D-1..D-5: `context/changes/audit-boot-hidden-tab/change.md`
- Scope: `context/runs/2026-10-20-playtest-boot/scope.md` § 2
- Audit: `context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md` (H-1, I-1, C-1..C-3, I-3, Z-8)
- Format example: `context/archive/2026-10-20-playtest-fixes-f01-f03/plan.md`
- Test-plan risks #2, #15: `context/foundation/test-plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Boot limits count only visible time (H-1 core)

#### Automated

- [x] 1.1 New and rewritten tests red before the change (assertion, not import error: export stubs first), green after; unit `<branch baseline> + N` — e6a0b43
- [x] 1.2 Deliberate break: ignore `hiddenMs` in `bootLimitDue` → the hidden-minute case red; reset the span start on a second hide → the idempotence case red; each restored; meta-check: the rewritten case must fail on today's code (it is the old assertion inverted), otherwise it proves nothing — e6a0b43
- [x] 1.3 `grep -rn "bootLimitDue\|bootLimitWait" src` lists only `bootLimits.ts` and `BootScene.ts` — e6a0b43
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (e2e part left to the orchestrator) — e6a0b43; e2e 141+0 orchestrator at e6a0b43/d1a827e

### Phase 2: BootScene pauses its limits while the tab is hidden and records the hidden time (H-1)

#### Automated

- [x] 2.1 `grep -n "visibilitychange" src/scenes/BootScene.ts` shows one `addEventListener` and its `removeEventListener`; `git diff --stat main -- src/main.ts` shows no change to the `visibilitychange` handler (L-S3 not fired) — 2e67a1d
- [x] 2.2 `grep -n "bootLoad" src/data/layout.ts` shows `hiddenMs` and "not in SAVE_KEYS"; `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty — 2e67a1d
- [x] 2.3 Deliberate break: no automated unit test can see the scene listener (canvas boot, real timers); record that the proof is phase 8's e2e (its break: the scene passes `hiddenMs` 0 to the rule, i.e. no subtraction → red; dropping only the clear-on-hide is NOT a valid break, the hidden-aware guard re-arms and stays green by design, A-2) plus the [reviewer] row below — 2e67a1d
- [x] 2.4 Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (the `#15 A-1/A-2` and `#14 B-4` stallall specs in `load-and-tab-guard.spec.ts` stay green: never hidden, same timing) — 2e67a1d (e2e 141+0, orchestrator)

#### Manual

- [ ] 2.5 [reviewer] Reading `BootScene.preload` against the lifecycle: seed from `document.hidden`; hide clears both timers; show re-arms only by phase; no arm after `COMPLETE`/`shutdown`; the cut guard asks the hidden-aware rule
- [ ] 2.6 [human] On a real tablet (iPad Safari or Android Chrome, production build): start the game on a slow link, switch to another app for over a minute during the loading screen, come back: loading continues, no stand-in pictures; settings "Obrazki" shows no cut line

### Phase 3: "Obrazki" names the background, not the internet (H-1 panel)

#### Automated

- [x] 3.1 New tests red before the change, green after; unit `<phase-2 count> + N`; existing `artHealthLines` cases unchanged — 9013f59
- [x] 3.2 Deliberate break: ignore `background` in `artHealthLines` → the background case red; put "internet" in the new string → the text test red; each restored; meta-check: the view mapping has no unit test (L-8 deferred) — the [visual] row is its proof — 9013f59
- [ ] 3.3 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#14 B-4` "a cut start says some pictures did not finish" still sees `artCut`: never hidden)

#### Manual

- [ ] 3.4 [reviewer] Teacher read of `settings.artCutBackground` (spelling, comma before "bo", calm, no blame on the internet)
- [ ] 3.5 [visual] Settings "Obrazki" at 1440 and 1024 wide, states: cut without a hidden span (today's `artCut`), cut after a hidden span (`artCutBackground`) — reached in the hook build with `?e2eArt=stallall` and the visibility fake of phase 8

### Phase 4: An error code with the skill id (I-1 core, C-2, C-3, I-3)

#### Automated

- [x] 4.1 New tests red before the change, green after; unit `<phase-3 count> + N` — 511d4f1
- [x] 4.2 Seeds unchanged: `git diff main -- tests/generateTask.test.ts tests/contentInvariants.test.ts tests/solvableInMode.test.ts | grep '^-[^-]'` empty (only additions), and those suites are green; the rng-order oracle is the existing case "does not consume rng differently from the generator: the task text matches the bare generator" in `tests/generateTask.test.ts` — 511d4f1
- [x] 4.3 Deliberate break: call `numberChoices` before the generator (rng order changed) → the "does not consume rng differently" case of `tests/generateTask.test.ts` red (proves the oracle sees rng order); drop `assertDrawable` from the `try` → the icon-limit case red; drop the name copy → the `RangeError` name case red; each restored — 511d4f1
- [x] 4.4 `npm run sample -- E1` … `E6` exit 0 (unchanged content) — 511d4f1
- [ ] 4.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

### Phase 5: The "Ups!" card shows the code (I-1, C-1)

#### Automated

- [ ] 5.1 `grep -n "mountErrorCard" src` shows the one caller passing `errorCode(error)`; `grep -n "pictureLayout(" src/scenes/TaskScene.ts` shows `task.skillId` in every call
- [ ] 5.2 Deliberate break: no unit test renders the card (node environment); the proof is phase 9's tightened spec (break: pass `''` as code → red) plus the [visual] row
- [ ] 5.3 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`error-boundary.spec.ts` uses a substring match on `Wersja <id>`, which the new line still contains)

#### Manual

- [ ] 5.4 [visual] The "Ups!" card at 1440 and 1024 wide, states: `?e2eFail=step` (`Kod: Error · Wersja <id>`), `?e2eFail=boot`; the line is muted, one line at 1024, the button keeps focus

### Phase 6: A refused replace never advises deleting site data (Z-8)

#### Automated

- [ ] 6.1 New tests red before the change, green after; unit `<phase-5 count> + N`
- [ ] 6.2 Deliberate break: keep `blockedBy ??= 'newer'` without `refuseWrites` → the `onBlocked` case red; remove the `NewerSave` branch in `failureText` → both text cases red; each restored; meta-check: the forced case must go red on today's code with `siteDataAdvice` (check the received value), proving the test sees the harmful text
- [ ] 6.3 `git diff --stat main -- src/core/save.ts src/storage` shows no change to `writeVerdict`/`guardedPut`
- [ ] 6.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`save-transfer-blocked.spec.ts`, `stale-tab.spec.ts` green)

#### Manual

- [ ] 6.5 [visual] Import and reset dialogs at 1440 and 1024 wide after a replace refused with `NewerSave`: the dialog shows `deviceNewer`, no "usuń dane"; after "Zamknij" the refusal card with `Kod: NewerSave · Wersja <id>` is visible and its button can be tapped (reached with the phase-10 steps)

### Phase 7: Docs, follow-ups and seam sweep

#### Automated

- [ ] 7.1 `grep -rn "wall clock" src/core/bootLimits.ts src/scenes/BootScene.ts CLAUDE.md` shows only text that names the hidden time
- [ ] 7.2 `grep -c "^Trigger:" context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` ≥ 10
- [ ] 7.3 `grep -rn "errorCard.build" src` empty, or the remaining use named in the phase commit
- [ ] 7.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 7.5 [reviewer] The CLAUDE.md sentences match the code (symbols exist: `grep` each one); save format v4 stated

### Phase 8: A hidden tab does not cut the boot load — e2e (#15)

#### Automated

- [ ] 8.1 Spec red before (deliberate break: the scene passes `hiddenMs` 0 to `bootLimitDue`/`bootLimitWait` (the subtraction removed) → the "still loading while hidden" assertion red — this breaks the RULE, not the fake; pass `background: false` in `UIScene` → the line assertion red), green after; restored
- [ ] 8.2 `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` green run ALONE (fires the stale-tab-and-health follow-up "Isolation-only red of the `load-and-tab-guard` e2e (#2, P-5)": if that red reappears, fix it in this phase or record evidence and restate it in `follow-ups/review-fixes.md`); full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`; total equals `npx playwright test --list | tail -1`
- [ ] 8.3 Full local gate green

### Phase 9: The "Ups!" card shows `Kod:` — e2e (#15)

#### Automated

- [ ] 9.1 Deliberate break: pass `errorName` of a fixed `'X'` or `''` as the code in `main.ts` → the tightened assertion red; restored
- [ ] 9.2 `npx playwright test tests/e2e/error-boundary.spec.ts` green; full e2e (orchestrator) `<branch e2e baseline> + 0` over phase 8 (assertions tightened, no new test)
- [ ] 9.3 Full local gate green

### Phase 10: A refused replace shows "deviceNewer" and the refusal card — e2e (#2)

#### Automated

- [ ] 10.1 Spec red before (deliberate break: remove the `NewerSave` branch of `failureText` → the dialog text assertion red; keep the bare `blockedBy ??=` in `replace` → the card assertion red), green after; restored
- [ ] 10.2 `npx playwright test tests/e2e/save-transfer-blocked.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1` over phase 9
- [ ] 10.3 `npm run build` prints `e2e hook: absent (` (no seam leaked)
- [ ] 10.4 Full local gate green
