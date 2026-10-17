---
change_id: save-truth
title: What the parent is told about save, import/reset and a stale tab (audit sweep slice 2)
status: archived
created: 2026-10-16
updated: 2026-10-17
archived_at: 2026-10-17T02:31:25Z
---

## Notes

Non-roadmap fix. **Source:** audit sweep 2026-10-16, slice 2 of 3 (save, import/reset, stale tab — what the parent is
told), autonomous run `2026-10-16-audit-sweep`. Scope list: `context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md`
§ Slice 2; per-finding evidence: `triage-A.md`, `triage-B.md`, `triage-C.md` in the same folder; primary sources (audit
reports under `context/audits/observability/`):

- `2026-10-14_0445-eksport-import-reset-widzety-obrazki.md` (S12-*)
- `2026-10-15_0253-zapis-v2-siatka-minigry-slupek.md` (SV2-*, SRR-*, carried C-2r, L-S1)
- `2026-10-15_1314-limity-zapisu-zadania-tekstowe-obrazki.md` (SVB-*)
- `2026-10-15_2217-zapis-v3-ladowanie-grafiki.md` (V-*, P-1, P-8)
- `2026-10-16_0915-start-dzwieki-grafika-salon.md` (R-4, T-1..T-5)
- follow-ups of `context/archive/2026-10-16-stale-tab-and-health/` (FU-3)

No roadmap status edits (no matching row in `context/foundation/roadmap.md`).

**Id note.** The scope's `P-1` is the **2026-10-15_2217** P-1 (triage-B: a failed first write after a migration has
no retry) — the label says so. The 09:15 audit has another P-1 (service-worker status, triage-C), which belongs to
slice 3 and is not touched here. `FU-3` and `P-8` are the same item (keep the first `backup-v<N>` copy) and are
handled as one.

**Save format.** The save stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`, accepted by the maintainer
2026-10-16). No finding in this slice needs a v5:
- SRR-01, V-1, SV2-07, L-S1 change the *decode result* and the runtime `LoadOutcome` (what is reported), not the
  stored shape.
- R-4 checks room state against the catalogue at load/import and reports it; it does not repair or reshape the save.
- SV2-13 (repair a bad `variants` block on decode) would change which saves are accepted — not a format change, but a
  change of save semantics; it is LOW and **deferred** (below), so nothing here touches validation rules.

**State outside the save (allowed, stated):**
- SVB-01: a tiny IndexedDB record `profile:default:backup-status` (kept / lost / uncertain) beside the save key in the
  same database — outside the save record, never read by `decodeSave` (triage-B: "new IDB key, no save-fmt").
- SV2-04 / FU-3 / P-8: the existing `profile:default:backup-v1|v2|v3` keys become readable (and write-once); no new key.
- SRR-08: a counter of consecutive `unavailable` starts in `localStorage` (a `martynka:` key in a small module under
  `src/storage/`, like `soundPrefs.ts`) — device state outside the save.
- T-3: the writer id in `sessionStorage` (`martynka:writer`) — per tab, outside the save.
- T-2: a `BroadcastChannel('martynka-save')` message `{writer, generation}` — never stored.

**T-1:** detect and report only (a third `writeVerdict` outcome `olderWriter`, a runtime `olderWriterSeen`, one
warn and one "Zapis gry" line). No service-worker forced reload or other prevention (research may revisit only if it
finds the detection impossible without it).

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

## Findings re-verified against the repo (branch `feat/save-truth` at `24b3e4b`)

Slice 1 (#79) changed no save-area file except `UIScene.openSettings` (progress preview of the previous stage) and
`pl.ts` (task strings): every row below was re-read in the current code.

| finding | audit says | repo now | in scope? |
|---|---|---|---|
| SVB-01 (med) | a hidden first copy failure gives up at once; `skipBackup` only logs; the "copy lost" line needs `migratedFrom` (gone next launch); a copy timeout counts as lost | `src/core/autosave.ts` `attempt`: `reason === 'hidden' && backupFails > 0` → `giveUpCopy`; catch: `if (reason !== 'hidden' && …) throw` (hidden gives up on the first failure); `skipBackup` logs only; `src/core/saveHealth.ts` `migrationOf` reads `status.migratedFrom`, `status.writes` (session-only) | yes (new IDB key outside the save) |
| SVB-02 (med) | "Poczekaj dłużej" turns any late `unavailable` into "still slow", the real error name is dropped | `src/main.ts` `start` → `slowCard` `onWait`: `if (late.kind === 'unavailable') return 'still-slow'`, no log, `late.error` unused | yes |
| SVB-03 (med) | a write that timed out may still land; it counts as a failure and the panel says the same as for a rejection | `withTimeLimit` comment "a late success is dropped"; `attempt` catch counts it; `saveHealth.ts` `stateOf` → `failing` with no timeout distinction; `pl.settings.saveFailing` one sentence | yes (pl) |
| SVB-04 (med) | an import/reset that timed out says "Obecne postępy zostały bez zmian" | `replace` returns `{ ok:false, error:'timeout' }`; `src/ui/dom/saveSummaryView.ts` `failureText` → `pl.saveTransfer.applyFailed`/`resetFailed` | yes (pl) |
| SRR-01 (med, latent) | validation that fails after a migration is `corrupt`, not `migration-failed` | `src/core/save.ts` `decodeSave`: `if (!validateSave(current)) return { …reason: 'corrupt' }` regardless of `from` | yes (decode result, v4) |
| SRR-08 (med) | `unavailable` is forceable at the first start while the copy says "Jeśli to się powtarza" | `replaceGate`: `blockedBy === 'unavailable'` → `force ? 'ok'`; `pl.saveTransfer.deviceUnavailable` unchanged | yes (localStorage counter, see decisions) |
| SRR-09 (med, latent) | `migration-failed`/`unknown-version` are replaceable without a warning while `saveOff` says "Został bez zmian" | `replaceGate`: `blockedBy === 'unreadable'` → `loadReason === 'future' ? 'Blocked' : 'ok'`; `deviceSaveView` returns `unreadable` for them | yes (gate like `unavailable`: force + warning) |
| SV2-04 (med) | backup copies are write-only; no way to read or export them in the app | `SaveStore` has `backup` only; `idb.ts` `backup` = `set(…backup-v${from})`; no read path | yes (store API, not format) |
| V-1 (med) | `unreadable` carries no field name; card says only `Kod: corrupt` | `LoadOutcome` `unreadable` = `{ reason, raw }`; `main.ts` card `detail(reason …)`; `importProblem` used only by `parseImport` | yes |
| P-1 (med) | a failed first write after a migration is not retried until the next change/hide | `attempt` returns false; `save` loop stops; `arm` only from `markDirty` and the start branch | yes (pl: "przenoszenie w toku", = 2217 P-2) |
| V-4 (med) | no frozen v1 fixture of the old salon through v1→v4 | `tests/fixtures/`: `save-v1.json`, `save-v1-fresh.json` (room `living`), `save-v2-legacy-salon.json`; no v1 salon | yes (tests only) |
| S12-07 (med) | "Plik został pobrany" after `link.click()` that may do nothing | `src/ui/dom/saveExport.ts` `saveFileToDevice` always `'downloaded'`; `pl.saveTransfer.exportOutcome.downloaded` | yes (pl) |
| S12-08 (med) | a file that cannot be read is "not a save of this game"; error lost | `saveImportDialog.ts` `stepOne`: `file.text()` rejection → `refuse('not-json', null)`; `ImportRejection` has no `unreadable-file` | yes (pl) |
| T-2 (med) | another tab's newer save is noticed only at this page's next write | `autosave.ts` `attempt` catch on `OTHER_WRITER_SAVE`; no channel anywhere in `src/` (`grep BroadcastChannel` empty) | yes |
| R-4 (med) | `validRoom` checks shape only; room state is never checked against the catalogue | `save.ts` `validRoom`; `src/core/rooms.ts` has `repairCurrentRoom` only; `saveSummary` clamps `tasksDone` silently | yes (report only, pl) |
| T-1 (low) | a v3 record (no `generation`) written over a v4 save by an older build goes unnoticed | `writeVerdict`: `generation` missing → 0, `put`; nothing records it | yes — **detection only** |
| T-3 (low) | a fresh writer per page load; a late write of the same tab's previous document refuses a reload | `idb.ts` `randomWriter()` default per store | yes |
| T-5 (low) | refusal card has no code line | `src/ui/dom/saveRefusedCard.ts` title + body + button only; `onBlocked` in `main.ts` ignores `reason` | yes |
| FU-3 = P-8 (low) | `backup-v<N>` is overwritten by a second migration | `idb.ts` `backup` = plain `set` | yes (write-once, with SV2-04) |
| S12-04 (low) | export of a state that does not validate says "pobrany" | `UIScene.openExport` `file()` uses `saver.current()` without `validateSave` | yes (pl, with S12-07) |
| S12-05 (low) | `deviceSaveView` `broken` closes the panel silently | `UIScene.openImport`/`openReset`: `broken` → `closeSettings()` | yes (pl, one line + log) |
| SRR-10 (low) | `Busy` and `InvalidSave` refusals of `replace` are not logged | `replace`: both `return` without `log` | yes |
| SRR-11 (low) | `block('fatal')` carries no error; the fatal code is the last write error | `Autosaver.block(reason)`; `main.ts` boundary `block('fatal')`; `offState` fatal → `lastError` | yes |
| SV2-07 (low) | `LoadOutcome.unreadable` drops `step` | `loadSave` maps `decodeSave` result to `{ reason, raw }` | yes (with V-1) |
| SV2-11 (low) | a word round that cannot be built silently becomes dice | `TaskScene.freshRound`: `built` null → falls to the dice branch, no warn | yes |
| C-2r (low) | start `Save unreadable (<reason>)` and autosave `InvalidSave` have no field | `main.ts` warn without field; `attempt` throws `InvalidSave` without `saveProblem` | yes (with V-1) |
| L-S1 (low) | `decodeSave` catch → `corrupt` silently | `decodeSave` final `catch { return … 'corrupt' }` | yes (with V-1) |
| S12-03 (low) | `stateOf` never reads `status.replace` | unchanged; masked because every successful replace reloads | **deferred** |
| S12-11 (low) | replace failures share `failures`/`consecutiveFailures` | unchanged; `lastFailure.stage = 'replace'` names it | **deferred** |
| S12-13 (low) | dialog handlers outside `session.run`; two buttons "Zacznij od nowa" | unchanged | **deferred** |
| SRR-07 (low) | "replacing a save that was not read" is only a log wiped by the reload | unchanged | **deferred** |
| SRR-13 (low) | export envelope does not say it is a session, not the device save | `ExportInput` `kind:'save'` only | **deferred** |
| SV2-13 (low) | one bad `variants` field rejects the whole save | `saveProblem` → `'variants'` | **deferred** (save semantics) |
| SV2-15 (low) | backup in the same database; eviction looks like `fresh` | unchanged | **deferred** |

Totals: **15 MEDIUM** in scope (SVB-01..04, SRR-01, SRR-08, SRR-09, SV2-04, V-1, P-1, V-4, S12-07, S12-08, T-2,
R-4); **20 LOW** ids (FU-3 and P-8 counted once = 19 items): **12 in scope** (T-1 detection, T-3, T-5, FU-3/P-8,
S12-04, S12-05, SRR-10, SRR-11, SV2-07, SV2-11, C-2r, L-S1), **7 deferred** (S12-03, S12-11, S12-13, SRR-07, SRR-13,
SV2-13, SV2-15). **Dropped as fixed/obsolete: none** — every id is still open in the code at `24b3e4b`.

### New `src/data/pl.ts` strings (parent-facing Polish copy)

Expected (exact keys decided by the plan; every one is ours → a DESIGN-GAP row from **126**, the next free number in
`docs/design-gaps.md`, and the teacher/author read):
- SVB-01: the old-copy line across launches (kept / lost / uncertain) in "Zapis gry".
- SVB-03: a `failing` variant for a timed-out write ("mogło się zapisać").
- SVB-04: a dialog line for an import/reset that timed out ("nie potwierdzono … uruchom grę ponownie").
- SRR-09: the warning before forcing over `migration-failed`/`unknown-version` (may reuse `forcedWarning`).
- SV2-04: the button and file name for the old-version copy ("Zachowaj kopię starego zapisu").
- P-1: "przenoszenie w toku" line.
- S12-07: a softer `downloadStarted` outcome ("sprawdź Pobrane").
- S12-08: `rejected['unreadable-file']`.
- S12-04: `exportOutcome.invalid`.
- S12-05: one line for a `broken` device save.
- R-4: one import-preview / panel line for room state that does not match the salon.
- T-1: one "Zapis gry" line for an older build that wrote over the save.
- SRR-08: none if the counter is kept (the existing `deviceUnavailable` copy becomes true); a wording change otherwise.
- T-2, T-3, T-5, V-1, SV2-07, C-2r, L-S1, SRR-10, SRR-11, SV2-11: no new text (T-5 reuses `pl.saveFailed.detail`;
  logs are English developer text).

No curriculum or generator content changes → no `npm run sample` teacher read beyond the gate's sample run; the copy
read above still applies (`src/data/pl.ts` is touched).

### Design-kit binding (profile § 6)

- `Martynka-urzadza.md` § 8 "Zapis postępu" (autosave, versioned migration, "nieudana migracja zostawia stary zapis
  nietknięty i pokazuje rodzicowi możliwość eksportu", export/import with summary, reset with confirmation,
  `persist()`) and PRD FR-020, FR-021, FR-022 bind every finding here. SV2-04 and SRR-09 are the direct reading of
  FR-021 ("stary zapis nietknięty … możliwość eksportu").
- `designs/martynka-maths-A-v1/screenshots/` has **no** parent-panel, dialog or save-card view (the kit covers child
  screens only): every new line or button is a **DESIGN-GAP** in the existing overlay components
  (`src/ui/dom/overlay.ts` `createText`/`createButton`, `saveHealthView.ts`, `saveSummaryView.ts`,
  `saveFailedCard.ts`, `saveRefusedCard.ts`), never a new view or style. Existing gap rows this slice revisits:
  43–51 (save panel/transfer), 69–72 (reasons/recovery), 94–97 (backup health), 116–117 (refusal card, `otherTab`).
- Copy source: `src/data/pl.ts` sections `settings` (save-health lines), `saveTransfer` (`exportOutcome`, `rejected`,
  `device*`, `applyFailed`, `resetFailed`, `forcedWarning`), `saveFailed` (`detail`), `saveRefused`.

### E2E candidates (E2E=on)

T-2 (a second page in the same context saves; the first shows the refusal card without writing) — extend
`tests/e2e/stale-tab.spec.ts`. SVB-02 and SVB-04 through the existing `?e2eSave=` seams (`slow`, `writehang`) in
`save-backup-health.spec.ts` / `save-transfer-blocked.spec.ts` if research finds a seam for a late *error*. The rest is
pure `core` (unit tests).

## Open follow-ups whose `Trigger:` names this area

| follow-up (archive file) | trigger | take |
|---|---|---|
| Earlier stale signal, BroadcastChannel (`2026-10-16-stale-tab-and-health`; also `2026-10-15-salon-load-health` "Two tabs of one origin") | parent report / next format change | **in** — = T-2 |
| P-8 keep the first `backup-v3` (stale-tab-and-health) | report / v5 | **in** — = FU-3/P-8 |
| Settings panel unreachable under the refusal card (stale-tab-and-health) | a change to `saveRefusedCard` | **in** — fired by T-5; the code line on the card answers it |
| Reload race F4 (stale-tab-and-health) | report / e2e reload failing | **in** — = T-3 |
| Stale-window replace F6 (stale-tab-and-health; = T-4) | parent report of an import over newer progress | out — not fired; T-4 is not in the slice list; T-2's early signal narrows it. Carry |
| E2E on two real builds (stale-tab-and-health, salon-load-health, minigame-daily-puzzle) | v5 | out — not fired (no v5) |
| Order of the `future`/`newer` cards (stale-tab-and-health) | report / change to `onBlocked` | obsolete — triage-C FU-5: both cannot appear in one load; T-5 passes `reason` through `onBlocked` without changing the order |
| F7 / SRR-09 / SRR-01 `replaceGate` for `migration-failed` (salon-load-health; save-v2-backup-health; minigame-daily-puzzle) | a migration step that can throw | **in** — scope lists SRR-01/SRR-09 as MEDIUM; latent (no step throws) but cheap |
| Failed copy at start leaves the v3 write waiting, F8 (salon-load-health; load-and-tab-guard P-1/P-2) | report / v4 format | **in** — = P-1 (and 2217 P-2 line) |
| V-1..V-8 (load-and-tab-guard) | next change to `attempt`, `decodeSave`, `parseImport`, `saveHealth.ts` (all fired) | V-1, V-4 **in**; V-2 (step/error name) **in** via SV2-07/L-S1; V-6 (copy failure counted twice), V-7 (copy retried after give-up) **in if** the SVB-01 phase rewrites the copy accounting, else carry; V-3, V-5, V-8 out (LOW, not in the slice list) — carry with the same trigger |
| P-7 `future` card names no version (load-and-tab-guard) | first rollback across versions / change to the `future` branch | out — not fired |
| Child card when `newer` blocks writing (load-and-tab-guard) | parent report | obsolete — #75 `saveRefusedCard` is that card |
| SV2-04 + option B (save-v2-backup-health; minigame-daily-puzzle "backup-v1 not readable") | report / v3 format (fired) | **in** — = SV2-04 |
| SRR-08 counter of `unavailable` starts (save-v2-backup-health; save-reason-and-recovery) | N-7 measurement / report | **in** — scope lists SRR-08 MEDIUM |
| S12-07; S12-08, S12-13; S12-03, S12-11 (save-v2-backup-health; save-reason-and-recovery; minigame-daily-puzzle) | change to `saveExport.ts` / a step added to the dialogs / a replace that keeps the page | S12-07, S12-08 **in**; S12-13, S12-03, S12-11 deferred (below) |
| SRR-07, SRR-10, SRR-11, SRR-13, SV2-05..15 (save-v2-backup-health) | next change to `autosave.ts attempt` or `main.ts start` (fired) | SRR-10, SRR-11, SV2-07, SV2-11 **in**; SRR-07, SRR-13, SV2-13, SV2-15 deferred; SV2-05/09/14 fixed (triage-A) |
| Impl-review F3/F4: `replace` marks the copy `skipped` after one failed try (save-v2-backup-health) | next change to `replace` | **in if** the SVB-01/P-1 phases touch `replace`'s copy branch (likely), else carry |
| Visual V1: code named twice after 3 failed copies (save-v2-backup-health) | next copy change to `saveHealthView` (fired by SVB-01/SVB-03) | **in** — fold into the SVB-01 line (no `earlierFailures` repeat for `backup` stage) |
| Visual V2: focus drops during a busy write (save-v2-backup-health) | next change to the busy branch of the dialogs | **in if** SVB-04 changes the busy branch (it does: the timeout line) — status line `tabindex=-1` |
| `isRecord` copied three times (salon-load-health) | a fourth copy in `src/core` | watch — if R-4 or SV2-04 needs `isRecord`, extract `src/core/isRecord.ts` instead of a fourth copy |
| L-S2 export may do nothing in the iPad home-screen app (save-observability-c1-c2) | — | **in** — = S12-07 |
| L-S3 `visibilitychange` throw skips `flush` (save-observability-c1-c2; save-v2-backup-health) | next change to the visibilitychange handler | out — not fired (no handler change planned); carry |
| Plan review F3 `validateSave` path of the first bad field (save-observability-c1-c2) | first InvalidSave in the panel | **in** — closed by C-2r/V-1 (`saveProblem` in the log and `Kod:`) |
| `tests/deviceSaveWiring.test.ts` openExport (save-reason-and-recovery O4; save-v2-backup-health O4) | next change to `UIScene.openExport` (fired by S12-04) | **in** — assert the `deviceSaveView` argument and `warning` |
| Visual O2 colon without a list in the reset dialog (save-reason-and-recovery; save-v2-backup-health) | next copy change to the reset lead line / `saveSummaryView.ts` (fired by SVB-04) | **in if** SVB-04 edits `saveSummaryView.ts` copy, else carry |
| Escape during `replace` (save-reason-and-recovery) | — | fixed (save-v2-backup-health `busy` guard); no import-dialog e2e — **in if** SVB-04 adds an import e2e |
| Import from the welcome screen (save-export-import-reset; save-reason-and-recovery) | a parent who needs to restore before the first round | out — not fired |
| Raw copy from inside the import/reset dialog (art-stand-in-and-load-signal) | a parent who cannot reach the start card's copy | out — not fired; SV2-04 adds the old-version copy only |
| Abort of an IDB transaction after a timeout (save-v2-backup-health) | evidence of hangs inside a live transaction | out — not fired |
| SV2-08 / M-S1 deploy-side rollback guard | a human deploy/ change | out — never shipped by a run (profile § 5) |

## Deferred (LOW only), each with a trigger

- **S12-03** `stateOf` ignores `status.replace`. Trigger: any replace path that does not reload the page right after
  apply.
- **S12-11** replace failures counted with write failures. Trigger: same as S12-03, or a parent report of "failing"
  right after a failed import.
- **S12-13** dialog handlers outside `session.run`; two different "Zacznij od nowa" buttons. Trigger: a parent report
  of a stuck import/reset dialog, or the next copy change to `pl.saveTransfer.resetConfirm`/`pl.errorCard`.
- **SRR-07** a persistent marker of "replaced a save that was not read". Trigger: a parent report of lost progress
  after an import/reset over an unreadable save.
- **SRR-13** export envelope `source: 'session-not-device'`. Trigger: a parent importing a file exported under
  `exportNotDevice`, or the next change to `ExportInput`.
- **SV2-13** repair a bad `variants` block on decode. Trigger: a save rejected with problem `variants` in any report,
  or the next save-format change (v5).
- **SV2-15** eviction indistinguishable from a first launch. Trigger: a parent report of an empty game after a long
  pause on iPad (the SVB-01 backup-status record may then serve as the "had a save" marker).

Why these: the slice already holds 15 MEDIUMs across `autosave.ts`, `save.ts`, `idb.ts`, `main.ts`, three dialogs and
the panel; these seven are masked (S12-03/11), cosmetic or need their own design (SRR-07/13, SV2-13/15), and none has a
fired trigger.

## Autonomous decisions

1. **Next step `/10x-research save-truth`, not `/10x-plan`.** Chosen per the step prompt; the skill's default is
   plan. Why: 15 MEDIUMs over ~12 files, three new pieces of device state and a cross-tab channel need grounding
   (BroadcastChannel in iPadOS standalone PWAs, `idb-keyval` `update` for write-once). Would change: nothing — fixed
   by the orchestrator.
2. **Seven LOWs deferred** (list above). Rejected: all LOWs in. Why: keep the slice inside ~12–14 phases; each
   deferred item has no fired trigger and no child or parent impact today. Would change: research showing a deferred
   item falls out of a MEDIUM fix for free (then it is taken in the same phase and recorded in the plan).
3. **SRR-08 — counter of consecutive `unavailable` starts in `localStorage`, forceable from the second.** Rejected:
   changing `deviceUnavailable` wording only. Why: the scope and triage sketch name the counter, the existing copy
   ("Jeśli to się powtarza przy każdym uruchomieniu") already promises it, and a `timeout` is never forceable anyway, so
   only a hard browser refusal is affected. Would change: research finding `localStorage` unusable exactly when
   IndexedDB is refused (same blocked site data) — then the wording change wins, since a counter that cannot persist
   never reaches 2.
4. **T-1 detection only** (step prompt). Rejected: forcing the old service worker out. Would change: research showing
   detection cannot be done without a write-time read the store already does (it can: `guardedPut` reads first).
5. **No v5.** Every in-scope finding is reporting, a runtime field, or state outside the save record. Would change:
   a plan step needing a new field in the save record (e.g. GRD-09-style data) — such an item would be deferred with
   `Trigger: the next save-format change (v5)`.
6. **`P-1` = the 2026-10-15_2217 id** (retry the first write after a migration), per the scope label and triage-B;
   the 09:15 P-1 (service worker) stays in slice 3. Would change: the orchestrator's scope file saying otherwise.
7. **SRR-01/SRR-09 kept in although latent** (no migration step can throw today, `MIGRATIONS[3]` only adds two
   fields). Rejected: dropping as unreachable. Why: the scope lists both as MEDIUM, both are S, and SRR-01 also covers
   a step that returns an invalid shape (not only a throw). Would change: nothing short of a scope change.
