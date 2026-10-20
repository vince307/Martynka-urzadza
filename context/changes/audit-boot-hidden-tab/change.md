---
change_id: audit-boot-hidden-tab
title: Boot limit pauses while the tab is hidden, error card code, no site-data advice after NewerSave
status: new
created: 2026-10-20
updated: 2026-10-20
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** observability audit `context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md`,
findings **H-1** (HIGH), **I-1** (MEDIUM, with the skill-id part from C-2/C-3) and **Z-8** (MEDIUM). Autonomous run
`2026-10-20-playtest-boot`, slice 2 of 2; the maintainer's decisions are in `context/runs/2026-10-20-playtest-boot/scope.md`
§ 2 (copied below under Autonomous decisions). No roadmap status edits (no row in `context/foundation/roadmap.md`).

**Save format.** Stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`), the run's hard limit; none is expected:
- H-1 adds the hidden time to `REGISTRY_KEYS.bootLoad` (runtime only, documented in `src/data/layout.ts` as "not in
  SAVE_KEYS") and changes how `BootScene.preload` arms its limits; nothing stored.
- I-1 changes the DOM error card (`src/ui/dom/errorCard.ts`) and the message/name of errors thrown by `generateTask`;
  nothing stored (the boundary already blocks the saver with `saver.block('fatal', …)`).
- Z-8 changes the text chosen by `failureText` and the runtime `blockedBy` of `Autosaver.replace`; nothing stored.

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

**Content rule:** no change to `src/data/curriculum/` or generators is planned. `src/data/pl.ts` (new copy for H-1) and
possibly `src/data/balance.ts` are touched, so the impl-review runs `npm run sample` for E1–E6 as the gate does; a
teacher read is needed only if `src/core/tasks/generators/` is touched (it should not be: the skill-id work is in
`generateTask.ts` and `visual.ts`).

## Audit claims re-verified against the repo (branch `feat/audit-boot-hidden-tab` at `48c2c7e`)

The audit was written at `d235d0d`-era code (2026-10-17); playtest-fixes-f01-f03 (#90) shipped since. Every claim is
checked by symbol now.

| audit claim | repo now (symbols) | correction |
|---|---|---|
| H-1: `BootScene.preload` arms the limits on window timers and the wall clock (`arm(schedule.cutAt…)`, B-3) | confirmed: `bootLimitSchedule(limits, this.startedAt)` with `startedAt = performance.now()`, `arm` = `window.setTimeout` + `bootLimitDue(schedule, performance.now())` re-check; comment in `BootScene` says "also while the tab is hidden" | none |
| H-1: the Phaser loader only moves files from `list` to `inflight` in the scene's `update()`, which does not run with a hidden tab | not re-measured (static claim, Phaser 4.2.1 `LoaderPlugin.update`); the game config in `src/main.ts` has no `disableVisibilityChange`, so the loop sleeps on hidden | research confirms in `node_modules/phaser` (`LoaderPlugin` UPDATE listener, `checkLoadQueue`) and whether files already `inflight` (XHR) still finish while hidden |
| H-1: the cut is followed by "przy lepszym internecie" in the parent's panel | confirmed: `pl.settings.artCut`, `pl.settings.artCause.cut` and `pl.settings.artRestart` all blame the internet; chosen by `artHealthLines` (`src/core/artHealth.ts`, `restartHelps('cut')` → advice line) and drawn by `createArtHealthView` (`src/ui/dom/artHealthView.ts`); the loading-screen line `pl.loading.slow` ("Jeszcze chwilka, wczytuję obrazki.") does not blame the internet | add: three strings, not one; the loading line needs no change |
| H-1: `bootLoad` has `elapsedMs` but no hidden time | confirmed: `registry.set(REGISTRY_KEYS.bootLoad, { cut, cutByTable, creates, elapsedMs })` in `BootScene.create`; the console line `Boot load cut after N ms` also has none | none |
| H-1 fix sketch: "subtract the hidden time in `bootLimitDue`" | `bootLimitDue(schedule, now)` and `bootLimitWait` in `src/core/bootLimits.ts` are pure; a hidden-time term fits there (injected, tested in core) | none |
| H-6 (LOW, related): each cut file logs "(timeout or network)" from the `loaderror` listener | confirmed in `BootScene` (`loaderror` handler, `loadErrorLine`) | out of scope (scope.md § 2: only H-1, I-1, Z-8); see follow-ups |
| I-1: the "Ups!" card shows the build but not the cause | confirmed: `mountErrorCard(parent, buildId, onRestart)` draws `pl.errorCard.title/body/restart/build`; the boundary callback in `src/main.ts` (`installErrorBoundary`) has `error` and calls `errorName(error)` only for `saver.block('fatal', …)` | none |
| I-1 fix: `Kod:` via `pl.saveFailed.detail(errorName(error), build)` | `pl.saveFailed.detail(reason, build)` = `Kod: <reason> · Wersja <build>` exists (DESIGN-GAP 51); `errorName` lives in `src/core/save.ts` | add: the card's own `pl.errorCard.build` line (`Wersja <id>`) is then replaced by the `detail` line, not shown twice |
| C-3: `numberChoices` runs after the `try` in `generateTask` | confirmed: `generateTask` wraps only `generate(skill, rng)`; tile choices (`numberChoices`, `boundOf`) run outside it | none |
| I-3 (LOW, needed for a useful `Kod:`): `generateTask` rethrows as `new Error('Skill …')`, so `errorName` says `Error` | confirmed: `Object.assign(new Error(\`Skill ${skill.id}: …\`), { cause })` | add: without keeping the cause's name (or a separate skill-id field) the card's code would read `Error`; I-3 is pulled in as the cheap half of "skill id" |
| C-2: `assertPool` in `render` of `IconGroups`, `IconRow`, `Jugs`, `MoneyTable`; `lineTicks` in `NumberLine.render` | confirmed (four `assertPool` calls, one `lineTicks`, all in `src/ui/widgets/`; the rules are pure in `src/core/tasks/visual.ts`) | none |
| C-1 (related): `drawPrompt` calls `pictureLayout` without `skillId` | partly: the main `pictureLayout(…, task.skillId)` call in `TaskScene` passes it; the prompt-height call in `drawPrompt` (`pictureLayout(TASK_LAYOUT.picture, input, false, visualShape(task.visual))`) does not | add: one-argument fix, taken only if the plan finds it free (D-4) |
| Z-8: `failureText` returns `siteDataAdvice` for every forced refusal other than `Busy`/`Blocked`/`InvalidSave` | confirmed (`src/ui/dom/saveSummaryView.ts` `failureText`, used by `saveImportDialog` and `saveResetDialog`) | none |
| Z-8: `replace` sets `blockedBy ??= 'newer'` on `NEWER_SAVE` and does not call `onBlocked` | confirmed (`Autosaver.replace` catch branch); ordinary writes go through `refuseWrites(reason, error)`, which calls `options.onBlocked` (the refusal card) | add: `OTHER_WRITER_SAVE` and `PREVIOUS_PAGE_SAVE` from `guardedPut`/`writeVerdict` also reach the `replace` catch, set no `blockedBy` and get `siteDataAdvice` the same way; the plan treats all three refusals together (D-5) |

### Design kit, copy and parent-panel sections this change binds (profile § 6)

- Kit (`designs/martynka-maths-A-v1/`): no view for the loading screen's causes, the "Obrazki" section, the error card
  or the import/reset failure lines; all of them are already DESIGN-GAP rows (29 error card, 51 `Kod:` line, 71 site-data
  advice, 140 `artCut`, 141 `artCause`, 144 `artRestart`).
- Parent-panel sections: **"Obrazki"** (`src/ui/dom/artHealthView.ts`, lines from `artHealthLines`) for H-1; **"Zapis
  gry"** import/reset dialogs (`src/ui/dom/saveImportDialog.ts`, `saveResetDialog.ts`, text from `failureText`) for Z-8.
  The error card (`src/ui/dom/errorCard.ts`) is a page overlay, not a panel section.
- Copy keys (`src/data/pl.ts`) bound: `settings.artCut`, `settings.artCause.cut`, `settings.artRestart` (H-1; must not
  show for a cut caused by a hidden tab), `loading.slow` (unchanged), `errorCard.*` and `saveFailed.detail` (I-1, reused),
  `saveTransfer.siteDataAdvice` (Z-8, must not show after a refusal) and the existing refusal texts that can replace it:
  `settings.saveOff.newer` / `otherTab` and `saveTransfer.replaceUnconfirmed` (research picks the one that fits).
- **Missing copy → DESIGN-GAP** (next free row **153** in `docs/design-gaps.md`): the "Obrazki" line for pictures cut
  because the game was in the background during its first start (the kit and `pl.ts` have none). The text is ours, calm,
  says a restart helps, never mentions the internet; a teacher-read line like rows 140–150. A refusal line for the
  import/reset dialogs is reused from existing keys if one fits; a new one would be row 154.

## Open follow-ups whose trigger names this area

| follow-up (archive) | trigger | take |
|---|---|---|
| TXT-06 skill id under `Kod:` on the error card — `2026-10-16-child-flow-guards` | next change to `src/ui/dom/errorCard.ts` | **Fires, in scope** (it is I-1's skill-id part); closed by this change if the plan carries the skill id to the card |
| S12-13 dialog handlers outside `session.run`; two buttons named "Zacznij od nowa" — `2026-10-16-save-truth` § 3 | next copy change to `pl.saveTransfer.resetConfirm` / `pl.errorCard` | **Fires only if** `pl.errorCard` copy changes; D-3 keeps the card's copy and adds a line from `saveFailed.detail`, so not fired; deferred |
| G-2, G-3, B-4, B-5 (`loaderror` label "Task art failed to load"); P-2..P-6 — `2026-10-16-stale-tab-and-health` | next change to `BootScene.preload` / `artHealth` | **Fires.** Research checks which are already closed by health-lines-and-smoke (`loadErrorLine`, `tableOf`); the open rest stays deferred (not H-1) and is restated in this change's follow-ups |
| A-3, A-4, A-5, A-10, A-11 (loader log lines, "Obrazki" causes, progress handler, load time in the record) — `2026-10-15-load-and-tab-guard` | next change to `BootScene.preload` / `artHealth.ts` / `artHealthView.ts` | **Fires.** A-11 (load time in the record) overlaps H-1's `hiddenMs` — in scope only for the hidden time; the rest is closed or deferred, research records which |
| impl-review F3 (slow-line timer asks `bootLoadPhase` with the constant) — `2026-10-15-load-and-tab-guard`; F4 (`startedAt` on the scene clock) — `2026-10-16-final-art-p2` | next change to the `BootScene.preload` slow timer | **Fires.** F4 is closed in code (`startedAt = performance.now()`, B-3); F3: in scope only if the plan rewrites the slow timer for the hidden time (it likely must, the slow line has the same clock); otherwise deferred |
| `FontFace` load limit — `2026-10-15-salon-load-health`, `2026-10-16-final-art-p2`, `2026-10-17-health-lines-and-smoke` § 10 | next change to `BootScene` font loading / `BootScene.preload` | **Fires by wording; out of scope** (not H-1); deferred |
| Per-file loader timeout guarded only by e2e — `2026-10-15-salon-load-health`; per-file timeout test — `2026-10-16-final-art-p2`, `2026-10-16-salon-extra-slots` | Phaser upgrade / next change to `BootScene.preload` / `balance.loader` | **Fires if** `balance.loader` changes (D-2 adds no number there); deferred |
| F3 `BootScene` never removes its `progress` listener — `2026-10-15-final-art-salon` | next change to `BootScene` | **Fires**; cheap but not H-1 → deferred unless the plan touches the same listener |
| F4 `createArtHealthView` hides the salon line while task art is unknown; L-6, L-8 — `2026-10-15-final-art-salon`, `2026-10-15-salon-load-health` | next change to the "Obrazki" section / `artHealthView.ts` | **Fires**; research checks whether `artHealthLines` (health-lines-and-smoke) closed them; open ones deferred |
| ASL-02..ASL-09 — `2026-10-14-save-reason-and-recovery` | next change to `artHealth.ts` | **Fires**; deferred (art filter/stand-in behaviour, not H-1) |
| A-6 per-file limit by size, B-6 throttled cold-start measurement — `2026-10-17-health-lines-and-smoke` §§ 7, 13 | Android measurement / report of a cut boot | **Not fired** (no field report); H-1's hidden-time record would make such a report diagnosable |
| Phaser upgrade tripwire (`loaderCut.ts`) — `2026-10-15-load-and-tab-guard` | Phaser version change | not fired (Phaser stays 4.2.1) |
| S12-07/08/12/13, S12-02/03/11 (`replace` dialog paths) — `2026-10-14-minigame-daily-puzzle`, `2026-10-14-save-reason-and-recovery` | next change to `saveImportDialog.ts`, `saveResetDialog.ts` or `autosave.ts` `replace` | **Fires.** S12-02 (time limit) closed by save-v2-backup-health (`withTimeLimit`); S12-11 (replace failures shown as `off`) overlaps Z-8 — in scope only where the refusal changes `blockedBy`; the rest deferred, restated |
| Stale-window replace (plan review F6) — `2026-10-16-stale-tab-and-health` | a parent report of an import that replaced newer progress | not fired; Z-8 makes the refusal visible, does not add a generation check to `replace` |
| § 26 `putBackupOnce` / forced replace takes no copy; § 24 `startCounter` — `2026-10-16-save-truth` | next change to the forced replace path / `replaceGate` | **Fires by wording** if the plan touches the forced path; Z-8 changes only the text and `blockedBy` after a refusal, not `replaceGate` or the copy → deferred |
| L-S3 `visibilitychange` handler in `main.ts` — `2026-10-13-save-observability-c1-c2`, `2026-10-15-save-v2-backup-health`, `2026-10-16-save-truth` | next change to the visibilitychange handler in `main.ts` | **Fires only if** H-1's hidden-time listener goes into that handler; D-1 puts it in `BootScene` (own listener, removed at `create`), so not fired |

## Autonomous decisions

Pre-agreed by the maintainer 2026-10-20 (`context/runs/2026-10-20-playtest-boot/scope.md` § 2 — not the agent's choice;
they override skill recommendations and earlier plan text):

- **PA-1 (H-1, HIGH)** — the boot load limit (`balance.loader.totalMs`, wall clock since B-3) must not cut files while the
  tab is hidden (the Phaser loader queue does not advance while the game loop is paused), and the panel must not blame the
  internet in that case ("Obrazki" / loading lines). Record the hidden time in `bootLoad`.
- **PA-2 (I-1, MEDIUM)** — the "Ups!" error card shows a `Kod:` line (error name + build), plus the skill id for the
  draw-time asserts of C-2/C-3 if it is cheap.
- **PA-3 (Z-8, MEDIUM)** — after `NewerSave` (a forced replace refused) never advise "usuń dane witryny"
  (`siteDataAdvice`); following that advice would delete the newer save.
- **PA-4** — every other MEDIUM/LOW finding of that report stays in follow-ups (out of scope).
- **PA-5** — save format stays v4 (`SAVE_VERSION` 4); a v5 need stops the ship at an open PR.

Agent decisions in this step (interpretations the scope leaves open; research/plan may refine, never contradict PA-*):

- **D-1 how the limit treats a hidden tab.** Chosen: both limits (slow line and total cut) count only visible time: the
  pure rule in `src/core/bootLimits.ts` takes the accumulated hidden time (from `document.visibilityState` /
  `visibilitychange`, a listener owned by `BootScene` and removed when the load ends) and moves `slowAt`/`cutAt` by it;
  `bootLoad` gets `hiddenMs` next to `elapsedMs`; a cut that happens anyway (visible time exhausted) still says "cut", but
  if the tab was hidden during the load the "Obrazki" line names the background, not the internet. Rejected: (a) only
  recording `hiddenMs` and a separate line, still cutting (the child still gets a session of stand-ins — against "must not
  cut"); (b) `disableVisibilityChange: true` in the game config (keeps the whole game running in the background, audio
  and timers too; changes far more than the loader). Why: the audit's own first sketch, one pure rule, testable in core.
  Would change: research showing in-flight XHRs time out while hidden anyway (then the per-file `timeoutMs` also needs
  the hidden term), or that the hidden listener cannot be observed in Playwright (then the e2e proof uses the pure rule
  plus a hook-build seam).
- **D-2 no new balance number.** Chosen: no extra limit for hidden time (a load hidden for an hour simply waits). Rejected:
  a cap on hidden time (a child who returns sees the loading screen continue, which is correct). Would change: a report of
  a loading screen that never ends after a return.
- **D-3 error card code.** Chosen: the card keeps title, body and button; its build line becomes
  `pl.saveFailed.detail(reason, build)` (`Kod: <reason> · Wersja <build>`), with `reason` = `errorName(error)` or
  `<name>/<skillId>` when the error carries a skill id (the `corrupt/<field>` precedent of save-truth). No new copy key.
  Rejected: the full message (may contain numbers from the task, not a code); a second line. Why: reuses DESIGN-GAP 51's
  line, one place for codes. Would change: the maintainer wanting no codes on a child-facing card (then only the build).
- **D-4 skill id "if cheap".** Chosen (cheap set): `generateTask` keeps the cause's `name` (I-3) and carries `skillId` as a
  property of the thrown error; tile choices move into the same `try` (C-3); the pool/tick checks of C-2 run at
  generation (a pure validation of `Task.visual` with `assertPool`/`lineTicks` in `generateTask` or the validator) so they
  throw with the skill id at round build, the widgets keep their asserts as a backstop; the C-1 `drawPrompt` call gets
  `task.skillId`. Rejected: wrapping every widget `render` in a try with a skill id (touches every widget; a render
  throw in Phaser's loop still reaches the boundary without context). Would change: research finding the generation-time
  check changes seeded draws (it must not consume rng) or costs more than one helper — then C-2 is deferred and only
  C-3 + I-3 ship.
- **D-5 Z-8 refusals.** Chosen: `failureText` returns a plain/refusal text (never `siteDataAdvice`) for `NewerSave`,
  `OtherWriterSave` and `PreviousPageSave`; `replace` turns all three into the same runtime `blockedBy` as an ordinary
  write (`'newer'` / `'otherTab'`) through `refuseWrites`, so `onBlocked` shows the existing refusal card once
  (`saveRefusedCard`). Rejected: only `NewerSave` (leaves the same harmful advice for the other two named refusals);
  showing the card from the dialog itself (two code paths for one refusal). Would change: research showing `onBlocked`
  from inside an open dialog collides with the dialog's input session (then the dialog shows the refusal line and the card
  waits until the dialog closes).
- **D-6 next step.** `/10x-research` (fixed by the step prompt; also warranted: the Phaser loader behaviour while hidden
  and the boundary/registry path for the skill id need source-backed answers).
