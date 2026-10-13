<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zdrowie zapisu widoczne dla rodzica, przyczyna nieudanego odczytu i naprawa nieznanego pokoju

- **Plan**: context/changes/save-observability-c1-c2/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-13
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning (fixed), 5 observations (2 fixed)
- **Diff**: `git diff 4698110...HEAD` (phases fb2e7bb..a44f3b4); review fixes d455c40

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites (observed in this step)

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | clean / clean (on a44f3b4+handoff and again on d455c40) |
| unit (`npm test` + deploy scripts + `sample` E1-E6) | 1172 on the branch head = baseline 1142 + 30 (phases 1-3: +20, +10 incl. loops); after d455c40: 1176 (+4, one guard case per `?e2eSave=` seam); samples 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rlE "e2eSave\|e2eStars" dist/` empty (exit 1) |
| `npx playwright test` | Chromium cannot launch in the agent sandbox (`browserType.launch: Target page, context or browser has been closed`, every test 1 ms). Evidence: orchestrator run on a44f3b4, 33 passed = baseline 29 + 4 (`e2e-request-p6.md`, handoff p6 §3). e2e: orchestrator re-runs on the review's final commit. |

## Deliberate breaks re-executed (core)

| Break | Result |
|---|---|
| `createAutosaver` `block`: `blockedBy ??= reason` → `blockedBy = reason` | RED "a start blocked as unavailable … a later fatal block keeps the first reason" (`expected 'fatal' to be 'unavailable'`); restored |
| `repairCurrentRoom`: known-salon branch returns `{ [firstRoom]: emptyRoomState() }` | RED "moves an unknown current room to the first room and leaves every other room untouched" (`expected undefined to be { tasksDone: 3, … }`); restored |
| `loadSave`: orphan `read.catch` removed alone | GREEN (23/23) — see F4: `Promise.race` already subscribes to `read` |
| `loadSave`: orphan `.catch` removed AND `Promise.race([timeout])` (read left without any handler) | RED "a read that rejects after the limit … raises no unhandled rejection" via the test's own listener (`expected [ Error: late ] to deeply equal []`); restored |
| `vite/e2eHookGuard.mjs` without `'e2eSave'` | RED the 4 new seam cases (d455c40); restored |

Meta-check: each break targets a rule from the run contract or the audit (first reason wins, other rooms untouched, no late rejection at the boundary, seams absent from `dist/`), not an implementation detail; the tree was clean after every restore.

## Audit findings in scope — closed

| Finding | Where (file + symbol) | Proof |
|---|---|---|
| C-1 | `src/core/autosave.ts` `loadSave` → `{ kind: 'unavailable', error: errorName(e) }`; `src/main.ts` `start` `console.warn` + `mountSaveFailedCard({ copy: pl.saveUnavailable })` without export; saver `blockedBy: 'unavailable'`, `loadError` | `tests/autosave.test.ts` "reads once and reports fresh / loaded / unreadable / unavailable…", name cases; e2e "#2 C-1 a save the browser will not give shows the card…" |
| C-2 | `createAutosaver` status `blockedBy`, `lastError`, `lastWriteAt`, `consecutiveFailures`; `src/core/saveHealth.ts` `saveHealthView`; `src/ui/dom/saveHealthView.ts` `createSaveHealthView`; `UIScene.openSettings` (`saveHealth`) | `tests/autosave.test.ts` "autosave health status (audit C-2, M-S5)"; `tests/saveHealth.test.ts`; e2e "#2 C-2 failed writes show in the parent panel", "#2 C-2 the parent panel says the game saves after a normal write" |
| H-R3 | `src/core/rooms.ts` `repairCurrentRoom` in `main.ts` `start` (`loaded` branch, after `floorToCalendar`, before `createGame`); `RoomScene.resolve` (one id for room and state) | `tests/rooms.test.ts` "repairCurrentRoom (H-R3: …)" incl. the frozen v1 fixtures (`currentRoom: "living"`); `grep "this.room()\|this.roomState()" src/` empty |
| M-R6 | purchase `flush('now')` → `attempt` feeds the same status; failure visible in the panel | indirect (plan known risk): e2e C-2 failing state uses the same `attempt` |
| M-S5 | `Autosaver.block(reason: BlockReason)`, first reason wins | autosave health tests (break re-executed above) |
| M-S4 | `loadSave(store, limit)` races `timers.setTimeout`, `balance.save.loadTimeoutMs: 5000`; `E2E_LOAD_TIMEOUT_MS` only under `__E2E_HOOK__` | `tests/autosave.test.ts` limit tests (timer cleared, late rejection, late success never written); e2e "#2 M-S4 a read that never answers…" |
| M-R5 / L-R10 | data loops over `ROOMS` | `tests/roomsData.test.ts` "every room in ROOMS" → "gives every slot a placeholder (M-R5)", "has child-facing text for every slot and task (L-R10)" |

Out of scope (M-S1, M-S2, M-S3 + L-S1, M-R4, L-S2, L-S3, L-R8, L-R9, L-R11, plan-review F3 directions): `follow-ups/review-fixes.md`, each with a `Trigger:` line.

## Save paths walked

- **Timeout then late success**: `loadSave` returns `{ unavailable, 'timeout' }`; the late value is dropped (never assigned to `raw`); saver starts with `blockedBy: 'unavailable'`, so `markDirty`/`flush` only count `skipped`. Test "a read that resolves after the limit … nothing is written". Never written over.
- **Late rejection**: handled twice — `Promise.race` subscribes to `read`, and `read.catch(() => undefined)` at race start. `QUIET_REJECTIONS`/`isFatalSignal` untouched (`git diff` shows no change to `src/core/errorSignal.ts` or `errorBoundary.ts`); the rejection never reaches the boundary (break re-executed).
- **`repairCurrentRoom`**: returns the same object for a known room; for an unknown one copies `rooms` (spread), adds `emptyRoomState()` only when `rooms[firstRoom]` is absent, keeps the unknown room's state. Runs only after a successful read (`loaded`), before `createGame` and before the saver exists, so it writes nothing; the repair reaches disk only through a normal autosave. `'living'` (fixtures) never appeared in `src/` history, so no shipped device holds it.
- **`blockedBy`**: `blockedBy ??= reason`; callers of the old `blocked` option: only `main.ts` `start` (migrated) and `tests/autosave.test.ts` `setup` (migrated); `block` caller: `main.ts` `onFatal` → `block('fatal')`. `status().blocked` kept for the hook and the S-11 spec.
- **Seams**: `e2eSave`/`e2eSaveStore`/`E2E_LOAD_TIMEOUT_MS` reached only under `__E2E_HOOK__`; production build reports the hook absent and `dist/` has no `e2eSave`/`e2eStars`.
- **`encodeSave` unchanged**: `src/core/save.ts` not in the diff; `tests/save.test.ts` "the v1 format did not change" round-trips both fixtures with `toEqual` and no status keys; `tests/fixtures/` not in the diff; `SAVE_VERSION` 1.

## Teacher read ([reviewer] rows 4.4, 5.6)

- `pl.saveUnavailable`: "Gra nie może teraz zapisywać postępów" / "Przeglądarka nie udostępniła zapisu gry. Można grać dalej. Jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron." / "Graj dalej" / "Tym razem gra nie zapisze postępów." — correct Polish, calm, no blame, no error words, no technical names, no numbers. A child who reads it sees "the game can't save right now, play on"; nothing frightening, no red, no "błąd". A parent understands what to check. PASS.
- `pl.settings.save*`: "Zapis gry"; "Postępy zapisują się na tym urządzeniu."; "Ostatni zapis: HH:MM"; "Ostatnie próby zapisu się nie udały. Postępy z tej gry mogą nie zostać zachowane."; "Zapis jest wyłączony: starego zapisu nie udało się wczytać." / "…: przeglądarka nie udostępniła zapisu." / "Zapis jest wyłączony do ponownego uruchomienia gry." — grammatical, parent-only (behind the adult gate), no numeral agreement needed. "z tej gry" means this session; acceptable for a parent. PASS.

## Findings

### F1 — S-11 F4 follow-up triggered by this change but left open

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/changes/save-observability-c1-c2/follow-ups/review-fixes.md` (S-11 F4); `tests/e2eHookGuard.test.ts`
- **Detail**: the carried follow-up's own trigger ("a new `?e2eSave=` value") fired in phase 2 (`unavailable`, `hang`, `writefail`), yet it was re-filed as open.
- **Fix**: one `checkE2EHook` case per seam value in `tests/e2eHookGuard.test.ts`; F4 moved to Closed.
- **Decision**: FIXED — d455c40 (break: `'e2eSave'` dropped from `E2E_HOOK_MARKERS` → the 4 cases red; restored)

### F2 — style.css comment of the progress preview now labels `.parent-save`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/style.css` `.parent-save` / `.parent-progress`
- **Detail**: the new rules were inserted between the S-08 comment and `.parent-progress`.
- **Fix**: own comment for `.parent-save` (DESIGN-GAP 43), S-08 comment back above `.parent-progress`. Comment-only production change.
- **Decision**: FIXED — d455c40

### F3 — low follow-ups had only a trigger, no description

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `follow-ups/review-fixes.md` L-S2, L-S3, L-R8, L-R9, L-R11
- **Detail**: a later slice grepping the Trigger would not know what to do without the audit open.
- **Fix**: one line each (file + symbol + recommended direction) from the audit § 5.
- **Decision**: FIXED — d455c40

### F4 — orphan `read.catch` in `loadSave` is redundant; the p2 break on it cannot be red

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `src/core/autosave.ts` `loadSave`
- **Detail**: `Promise.race([read, timeout])` already attaches a rejection handler to `read`, so removing the `.catch` alone stays green (re-executed). The property itself is proven: with `read` out of the race the test's `unhandledRejection` listener goes red. The run log (p2) already records the `.catch` as defensive. Keeping it is harmless and guards a future refactor that drops `read` from the race.
- **Fix**: none; recorded.
- **Decision**: ACCEPTED

### F5 — 5000 ms read limit on an old iPad gives a session without saving

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/data/balance.ts` `balance.save.loadTimeoutMs`
- **Detail**: a cold IndexedDB open longer than 5 s shows the "unavailable" card and plays without saving; the existing save is never overwritten (saver blocked) and loads next launch. Plan known risk; device row 4.5 [human] open.
- **Fix**: keep; revisit the number if the device check shows the card on a healthy device.
- **Decision**: ACCEPTED (carried to [human] 4.5)

### F6 — e2e cannot run in the agent sandbox

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: N/A
- **Detail**: `npx playwright test` failed at `browserType.launch` (sandbox); the review's fixes touch a CSS comment, a unit test and docs only.
- **Fix**: orchestrator re-runs e2e on the review's final commit.
- **Decision**: ACCEPTED

## Hook integrity

`git diff 4698110...HEAD --stat` touches nothing under `.claude/`; no settings edited, no hook muted, no `--no-verify` in this step.

MERGE: CLEAR — no critical findings; C-1, C-2, H-R3, M-R6, M-S5, M-S4, M-R5/L-R10 closed with tests; v1 format byte-identical, seams absent from dist/, no write before a successful read; e2e to be confirmed by the orchestrator on the final commit.
