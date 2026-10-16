# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 7` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2), 5 (3714f3c), 6 (fc0f7f7) and 7 (4801d61) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key; also a record written by an ended document of the same tab stays REFUSED (`PreviousPageSave` -> `otherTab`), it must never be put over.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-6 as before, phase 7 = 4801d61 (`feat(save-truth): writer identity and an older build's write (p7)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 55 (`grep -c '^- \[ \]' plan.md`); 7.1-7.3 ticked, 7.4 [reviewer] and 7.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/storage/writerId.ts` | new. `createWriterId(storage?, random?)` -> `{ writer: '<tabId>:<nonce>', endedWriters: full ids, end() }`; sessionStorage key `martynka:writer` = `{ tabId, ended: nonces }` (last 8); any throw or junk -> fresh id, no ended list, `end()` never throws |
| `src/core/save.ts` | `PREVIOUS_PAGE_SAVE = 'PreviousPageSave'`; `writeVerdict(stored, { …, endedWriters? }, mode)`: an ahead record whose writer is in `endedWriters` refuses as `PreviousPageSave` (else `OtherWriterSave`, replace still puts); a normal put over a stored `version < page.version` with `page.base > 0` returns `{ kind:'put', generation, olderWriter: true }` |
| `src/storage/idb.ts` | `IdbSaveStoreOptions.endedWriters/onOlderWriter`; `guardedPut(…, mode, onOlderWriter?)` tells the listener only after the put landed (return value stays the generation, so existing callers and tests are unchanged) |
| `src/core/autosave.ts` | `PreviousPageSave` blocks as `otherTab` exactly like `OtherWriterSave` (one `onBlocked`, a log line naming "previous page"); `noteOlderWriter()` + runtime `olderWriterSeen` (one log, never saved) |
| `src/core/saveHealth.ts`, `src/ui/dom/saveHealthView.ts`, `src/data/pl.ts` | `SaveHealthView.olderWriter`; one line `pl.settings.olderWriter` under the state sentence |
| `src/main.ts` | one `createWriterId()` per page load passed to `createIdbSaveStore`; `onOlderWriter` -> `booted.saver?.noteOlderWriter()`; `pagehide` calls `writerId.end()` after the hidden flush |
| `docs/design-gaps.md` | row 130 |
| tests | `tests/saveV4.test.ts` describe "writeVerdict: an earlier document of this tab, and an older build" (8) ; `tests/writerId.test.ts` (8); `tests/autosave.test.ts` describe "a PreviousPageSave refusal and an older-writer note" (3); `tests/idbStore.test.ts` describe "previous page and older writer" (4); `tests/saveHealth.test.ts` (1); `tests/saveTransferCopy.test.ts` pins the string |

## 3. Verification

| command | result |
|---|---|
| RED (stubs for the new names, no logic) | 15 assertion failures, e.g. `expected { kind: 'refuse', …(1) } to deeply equal { kind: 'refuse', …(1) }` (PreviousPageSave case), `expected { kind: 'put', generation: 4 } to deeply equal { kind: 'put', generation: 4, …(1) }` (older writer), `expected 'stub' to be 'r1:r2'` (writerId), `expected false to be true` (olderWriterSeen), `expected undefined to be 'Starsza wersja gry zapisała tu postęp…'`; idb: `expected 'OtherWriterSave' to be 'PreviousPageSave'`, `expected +0 to be 1` (onOlderWriter) |
| Deliberately reversed existing test | `tests/saveV4.test.ts` "treats a malformed stored generation as 0": its second case `writeVerdict({ version: 3 }, page base 3)` is exactly an older build's record, so it now expects `olderWriter: true` (generation 4 unchanged). Every other pre-existing `writeVerdict` / B-1 test is green unchanged |
| GREEN | `npm test` 3481 passed (branch baseline after p6: 3456, +25) |
| `npm run lint` / `typecheck` | OK |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), no flakes; `stale-tab.spec.ts` and `load-and-tab-guard.spec.ts` green |
| `SAVE_VERSION`, fixtures | 4; `git diff --stat tests/fixtures` empty |
| Deliberate breaks | (a) ended check on `tabId` alone: 1 red (live nonce of the same tab is another writer); (b) ended writer allowed to put: 2 red (verdict case + idb store case); (c) `olderWriter` without `base > 0`: 2 red (verdict + idb "first write after a migration"); all restored (`save.ts` diffed against the backup). Meta-check: proves the verdict and the store wiring over fake-indexeddb, not the real reload race in a browser |
| stray processes | `ps … | grep -E 'sleep|until|playwright|vite'` printed nothing (run outside the sandbox, the sandbox forbids `ps`) |

## 4. Next command

`/10x-tdd save-truth phase 8`

## 5. Open

- Row 7.4 [reviewer] and 7.5 [visual] not ticked (the older-writer line needs a state built through the hook build). Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6, 5.4, 6.4, 6.5.
- No e2e spec for the new line or for a reload race (phase 15 covers the browser path); the older-writer line is covered by unit tests only.
- The olderWriter flag is limited to normal writes (a `replace` is the parent's explicit overwrite). A v3 written over a v3 both at base 0 stays undetected (known, research T-1).
- `pagehide` also fires into the bfcache; the live document then counts as ended, but its own writes carry its own writer, which the verdict checks first, so nothing is refused.
- Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Whole phase TDD, Driver stays `tdd`, no redirect; no mixed-phase question. RED seen with stubs for the new names only (constant, types, no-op methods, stub writerId).
2. `endedWriters` holds FULL ids (`tabId:nonce`) so the verdict is an exact `includes`; the storage keeps only nonces. Rejected: parsing ids inside the verdict. Would change: a reviewer wanting the format parsed in core.
3. `guardedPut` keeps returning the generation and takes a sixth optional `onOlderWriter` callback instead of resolving a flag (plan wording "resolves the flag"), so existing `resolves.toBe(n)` tests stay unchanged; the callback fires only after the put landed.
4. `olderWriter` is not raised in `replace` mode (explicit parent overwrite). Would change: a reviewer asking for the plan's literal wording.
5. One existing test case reversed (see §3); commit message and next-phase prompts decided in place; the run stops after this phase.
