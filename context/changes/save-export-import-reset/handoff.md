# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-tdd phase 3` step of run `2026-10-13-s12-s14`. Phase 3 is committed (`df18f2f`, `test(save-export-import-reset): … (p3)`); rows 3.1, 3.2 ticked with sha. 3.3 waits for the orchestrator's e2e (existing "Zapis gry" specs must stay green). The next agent must not get wrong: `saveHealthView` now returns `SaveHealthState & { persistence }`; `data-state` stays the `kind`; `requestPersistence(nav?)` returns a Promise and never rejects.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phase 1 `2e435cf`, phase 2 `5debed5`, phase 3 `df18f2f`, plus handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` or `plan_reviewed` (not edited by this step) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the docs commit |


## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `Persistence` type, `AutosaveStatus.persistence`, `onFirstWrite` may return a Promise (resolved value or `'error'` kept) |
| `src/core/saveHealth.ts` | `SaveHealthState` (`off`/`failing`/`notYet`/`ok` with `earlierFailures`), `SaveHealthView` adds `persistence` |
| `src/storage/idb.ts` | `requestPersistence(nav?) : Promise<Persistence>` |
| `src/ui/dom/saveHealthView.ts`, `src/data/pl.ts` | renders `notYet`, earlier-failures sentence, persistence sentence; `pl.settings.saveNotYet/saveEarlier/savePersist` (DESIGN-GAP 50 comment; the gap ROW in `docs/design-gaps.md` is still for phase 6) |
| tests | `tests/saveHealth.test.ts`, `autosave.test.ts`, `idbStore.test.ts`, `plural.test.ts` extended |


## 3. Verification

| Command | Result |
|---|---|
| RED (stubs for the pl strings only) | 14 failed, e.g. `AssertionError: expected 'ok' to be 'notYet'`; `AssertionError: expected undefined to be 'granted'`; `expected '5QuotaExceededError' to be 'Wcześniej: 5 nieudanych prób (…'` (idbStore tests failed with TypeError: `.resolves` on void, the old signature) |
| GREEN | `npm test`: 1238 passed (branch baseline 1224, +14) |
| lint / typecheck / deploy tests / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)`. Fixed on the way: `unbound-method` lint and a TS18048 in `idb.ts` |
| e2e `npx playwright test` | NOT RUN OK: Chromium cannot start (16 did not run). The orchestrator must run e2e (expect 33); row 3.3 stays unticked until then |
| Break B1: `notYet` checked before `failing` | red: "failures without a block are failing", "no write yet but a failed attempt is failing"; restored |
| Break B2: autosaver drops the resolved `onFirstWrite` result | red: "keeps the resolved result of onFirstWrite"; restored |
| Meta-check | B1 proves the audit's N-8 ordering (a failed first attempt is not "not yet"); B2 proves M-S2 reaches `status()`. The "Zapis gry" DOM wiring is covered only by e2e |


## 4. Next command

`/10x-implement save-export-import-reset phase 4`


## 5. Open

- Orchestrator: run `npx playwright test` (33 expected) on the phase 3 commit, then the next agent ticks 3.3.
- 3.4 `[reviewer]` row not mine (teacher read of the new strings).
- Existing `save-restart.spec` "ok" case relies on `saveOk` after a write: still true (`writes > 0`).
- Carried: DESIGN-GAP rows 46-51 (row 50 text exists as a comment), e2e request-file protocol for phases 4-7, human checklist, follow-ups in phase 6.


## 6. Autonomous decisions

- TDD gate: `notYet`, `persistence`, `earlierFailures`, `saveEarlier` absent and testable; driver stays `tdd`. Not mixed: the DOM rendering in `saveHealthView.ts` was done inline with GREEN (thin glue, covered by e2e).
- Stubs for the pl strings so RED is an assertion failure; `requestPersistence` kept the old void signature for RED.
- `notYet` when `writes === 0` after the block and failure checks, per the plan's order.
- `earlierFailures` uses `failures` (all-time count) and `lastError`, as the contract says.
- Manual gate, commit message, next-phase question decided in place; planned set only, stopped after the phase.

