# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 10 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-10 are committed. Do not get wrong: the salon carry note is RUNTIME only (save format stays v4, `MIGRATIONS[2]` output byte-identical, fixtures untouched, nothing bought is lost or re-charged); the art-filter fallback only reports, it never changes a draw or mastery; phase 11 is `Driver: impl`.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-9 with handoffs, phase 10 (`test(health-lines-and-smoke): Salon carry note, room growth, art-filter fallback (p10)`, sha in `git log`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (rows 10.1-10.4 ticked; 10.5 [reviewer] and 10.6 [visual] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/migrations/legacySalon.ts` | `carryV2Salon(raw) -> { value, carried: { from, to } \| null }`; `LIFT_V2_SALON = r => carryV2Salon(r).value` |
| `src/core/save.ts`, `src/core/autosave.ts` | `SalonCarried` type; `DecodeResult` ok and `LoadOutcome` loaded carry `salonCarried` (set at the v2 step only when the step is `LIFT_V2_SALON`); `saveFile.parseImport` left alone (own literal) |
| `src/main.ts`, `src/data/layout.ts` | `REGISTRY_KEYS.salonCarried` (runtime only, not in `SAVE_KEYS`), `console.info` with the prefix lengths, `roomGrowth` info log |
| `src/core/saveHealth.ts`, `src/ui/dom/saveHealthView.ts`, `src/scenes/UIScene.ts` | 4th arg of `saveHealthView`, `view.salonCarried`, one line |
| `src/core/rooms.ts`, `src/core/types.ts`, `src/data/rooms.ts` | `roomGrowth`, `RoomDef.formerTaskCounts` (`[7]` for the salon) |
| `src/core/round/artFilter.ts`, `src/core/curriculum.ts`, `src/scenes/TaskScene.ts`, `src/data/balance.ts` | `withoutArtBlocked(...).fallback` `none\|current\|all`; `art.onFallback` callback; TaskScene counter, one `console.info` per `balance.artHealth.fallbackLogEvery` (10) |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.salonCarried`; gap row 150; row 66 ASL-03 note |
| tests | `legacySalonMigration`, `save`, `autosave`, `saveHealth`, `rooms`, `artFilter`, `freshRoundWiring`, `saveTransferCopy` widened |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3652 passed = 3628 + 24; deploy scripts OK; samples exit 0 |
| first RED (stubs, assertions) | `AssertionError: expected null to deeply equal { from: 1, to: 1 }` (`legacySalonMigration`), `expected [] to deeply equal [ { room: 'salon', from: 7, to: 12 } ]` (`rooms`), `expected false to be true` (`saveHealth`), `expected 'none' to be 'current'` (`artFilter`), `expected [] to deeply equal [ 'current' ]` (ASL-04 callback); 16 cases red before the change |
| break | `salonCarried = null` at the v2 step plus `fallback: 'none'` on the all-empty fallback: 4 red (`expected 'none' to be 'all'`, `expected null to deeply equal { from: 4, to: 4 }`, `{ from: 6, to: 6 }`, autosave `loaded` match); restored, 255 green |
| meta-check | proves the note, the fallback kinds and the unchanged `MIGRATIONS[2]` output; the panel line itself is the visual gate (`?e2eSave=legacy-salon`, row 10.6) |
| save invariants | `SAVE_VERSION` 4; `git diff --stat main -- tests/fixtures` empty; `salonCarried` not in `SAVE_KEYS` |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.8m), 0 failed; `playwright --list` 132; baseline 132 + 0 |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), after the run: empty |

## 4. Next command

`/10x-implement health-lines-and-smoke phase 11`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- New `pl.ts` string (gap 150): "Pokój przeniesiony na nowy wygląd. Kupione rzeczy zostały."
- Phase 11 CLAUDE.md paragraph must name `carryV2Salon`/`salonCarried`, `roomGrowth`, `withoutArtBlocked.fallback`, `fallbackLogEvery`.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 10. Would change: nothing.
2. **`saveFile.parseImport` not given `salonCarried`** (its literal is its own type; the import preview already runs the same conversion). Would change: reviewer wants the field there.
3. **`decodeSave` calls `carryV2Salon` only when step 2 is `LIFT_V2_SALON`** so an injected test step stays a plain function. Would change: the note should work for any step 2.
4. **`fallback: 'current'` only when the filter removed something and the step was kept whole** (a short step nothing was removed from is `none`, ASL-03). Would change: reviewer wants the plan's looser reading.
5. **The fallback reaches the scene through an optional `art.onFallback` callback** (`buildAdaptiveRound` returns tasks only). Would change: a counter in the return value.
6. **`roomGrowth` reports `tasksDone` equal to a former length and below the new length**; log only. Would change: also report any `tasksDone` below the length.
