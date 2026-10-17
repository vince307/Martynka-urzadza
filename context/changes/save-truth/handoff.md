# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 8` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2), 5 (3714f3c), 6 (fc0f7f7), 7 (4801d61) and 8 (b1a01c6) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key; also a BroadcastChannel message alone never blocks the only live tab's write (`channelVerdict` mirrors `writeVerdict`, which still decides).

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-6 as before, phase 7 = 4801d61, phase 8 = b1a01c6 (`feat(save-truth): early stale signal and the refusal code line (p8)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 52 (`grep -c '^- \[ \]' plan.md`); 8.1-8.3 ticked, 8.4 [reviewer] and 8.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/storage/saveChannel.ts` | new. `createSaveChannel(ctor?)` -> `{ post, onMessage, close }` on `BroadcastChannel('martynka-save')`; feature-detected, every call try/caught, malformed messages dropped, never stored; the only place touching BroadcastChannel |
| `src/core/save.ts` | `channelVerdict(msg, page{writer,base})` -> `'stale'` iff `msg.writer !== page.writer && msg.generation > page.base` (exactly what `writeVerdict` would refuse next) else `'ignore'` |
| `src/core/autosave.ts` | `refuseWrites(reason, error)` shared by the refusal branch and `noticeOtherWriter()` (blocks `otherTab`, `onBlocked` once, no writes); `onBlocked(reason, error)` now carries the error name |
| `src/storage/idb.ts` | `IdbSaveStoreOptions.onWritten({writer, generation})` called after every landed write (replace included, listener throw only warns); `IdbSaveStore.stamp()` -> `{writer, base}` |
| `src/main.ts` | channel created once; `onWritten` -> `post`; message -> `channelVerdict(msg, store.stamp())` -> `saver.noticeOtherWriter()`; not created for e2e save seams; card gets `pl.saveFailed.detail(error, __BUILD_ID__)` |
| `src/ui/dom/saveRefusedCard.ts` | optional `detail` `overlay-muted` line (the `Kod:` line) |
| tests | `tests/saveV4.test.ts` describe "channelVerdict…" (4); `tests/autosave.test.ts` "noticeOtherWriter and the refusal code" (3); `tests/idbStore.test.ts` "onWritten" (2); new `tests/saveChannel.test.ts` (5); `tests/e2e/stale-tab.spec.ts` edited |

## 3. Verification

| command | result |
|---|---|
| RED (stubs: `channelVerdict` always `ignore`, no-op `noticeOtherWriter`, no-op channel) | 7 assertion failures, e.g. `expected 'ignore' to be 'stale'`, `expected [ undefined ] to deeply equal [ 'PreviousPageSave' ]`, `expected [] to deeply equal [ { writer: 'A:1', generation: 4 } ]`, `expected undefined to be true` (close), `expected { Object (load, blocked, ...) } to match object { Object (blocked, blockedBy) }`, `expected [] to deeply equal [ Array(2) ]` (onWritten) |
| Existing test changed | `tests/e2e/stale-tab.spec.ts` #2 (both tests): they used `staleWork` (a tap in the stale window) to provoke the refused write; the card now rises at once from the channel, the tap landed on "Zacznij od nowa" and reloaded. `staleWork` removed, the tests poll `blockedBy` instead. Not one of the plan's named reversals; a necessary consequence of T-2 (phase 14 adds the explicit specs). The refused-write path stays covered by idbStore/autosave unit tests and `load-and-tab-guard.spec.ts` |
| GREEN | `npm test` 3495 passed (branch baseline after p7: 3481, +14) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 126 passed + 1 known flake (money-pay #11) which passed rerun alone (4 passed); baseline 127 -> same total |
| Deliberate break | `channelVerdict` without the `generation > base` guard: 2 red (`a generation at or below the base is ignored`, `agrees with writeVerdict`); restored. Meta-check: proves the rule, not delivery between pages (phase 14) |
| `SAVE_VERSION`, fixtures | 4; no fixture touched |
| stray processes | `ps … | grep -E 'sleep|until|playwright|vite'` empty (outside sandbox) |

## 4. Next command

`/10x-implement save-truth phase 9`

## 5. Open

- Rows 8.4 [reviewer] and 8.5 [visual] not ticked (the `Kod:` line is verified in a browser only by phase 14). Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5.
- Phase 14 adds the e2e for the early signal and the `Kod:` line; `stale-tab.spec.ts` #2 tests no longer exercise a refused write in a browser.
- No unit test for the DOM card (`detail`): the vitest environment has no DOM; wiring is in `main.ts`.
- `replace` posts too, so a reset in one window stops other windows at once (intended; checked by the edited spec).
- Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Whole phase TDD, Driver stays `tdd`, no redirect. RED with stubs for the new names only.
2. `idb.ts` returns an `IdbSaveStore` with `stamp()` instead of widening core's `SaveStore`; the channel is wired in `main.ts` only for the real IndexedDB store (e2e save seams get none). Rejected: a `stamp` on `SaveStore` (core would learn the channel). Would change: a reviewer wanting the verdict inside the store.
3. `onBlocked` error for a channel notice is `OtherWriterSave` (as the plan says).
4. `stale-tab.spec.ts` edited minimally (see §3); commit message and next-phase prompts decided in place; the run stops after this phase.
