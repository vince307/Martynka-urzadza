# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-impl-review` step of run 2026-10-24-audit-backdrop-fox: full-plan review done, verdict APPROVED, `MERGE: CLEAR`; four cheap fixes landed in 22c80e2. The next agent must not tick 4.7/4.8 (maintainer's) or 4.10 (CI at ship): only the visual gate (row 4.9) comes next.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 80432e8..HEAD (19 commits incl. 22c80e2 review fixes and this handoff commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | impl_reviewed |
| `## Progress` rows open | 4 (`grep -c '^- \[ \]' plan.md`): 4.7 [human], 4.8 [human], 4.9 [visual], 4.10 [reviewer] (CI at ship) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/reviews/impl-review.md` | review report: 0 critical, 4 warnings, 5 observations, scope items 2-8 table, `MERGE: CLEAR` |
| `src/ui/widgets/SalonBackdrop.ts` | `plainBackdropSnapshot(scene)` exported; dead getters `mode`/`captures`/`redraws` removed; doc comments on `pixel` (e2e only) and `BackdropSnapshot` (`captures` includes restores) |
| `src/scenes/TaskScene.ts`, `src/scenes/WelcomeScene.ts` | use `plainBackdropSnapshot`; unused `WEBGL` import dropped |
| `tests/backdropRestoreWiring.test.ts` | the `off` must sit inside an `events.once('shutdown', () => { … })` body |
| `tests/phaserLoaderPin.test.ts` | also pins `glTextureWrappers` re-created before `RESTORE_WEBGL` |
| `tests/e2e/fox-guide.spec.ts` | `one pose missing`: `requested === 'cheer'` on the summary; `#14` fallback lead from `pl.settings.artFallback` |
| `context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` | F6 added (pixel compared with the pre-loss pixel), with `Trigger:` |
| `context/changes/audit-backdrop-fox/plan.md` | rows 1.5, 2.4, 3.5, 4.6, 5.2, 5.3, 6.2, 6.3 ticked (22c80e2) |
| `context/changes/audit-backdrop-fox/change.md` | `status: impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build | green; unit `Tests 3915 passed` = baseline 3891 + 24; build `e2e hook: absent (2 chunks checked)` |
| `npm test` after the review fixes | 3915 passed (fixes add assertions, no cases) |
| `npx playwright test --list` | 160 = 155 + 3 (p5) + 2 (p6) |
| full e2e `--workers=3` (load ~40) | 136 passed, 15 failed, 9 did not run (all timeouts) |
| serial re-run `--workers=1` of the 12 files holding them (53 tests, after fixes) | 51 passed, 2 load timeouts; those 2 green on a second serial run → 160/160 |
| TDD p1 break: `guideAvailable` checks only `idle` | `tests/guide.test.ts` 2 red; restored |
| pixel break (p5 gap): `SalonBackdrop.render` skips `dt.draw`/`dt.render` when `cause === 'restore'` | all 3 `backdrop-restore.spec.ts` tests red at the post-restore `expectSalonPixel` after their `redraws` polls passed; restored. Meta: proves the pixel check catches a blank texture with the counter rising |
| wiring break: `WelcomeScene` `off` moved to `events.once('destroy')` | new guard red (the old one passed it); restored |
| `SAVE_VERSION` | 4; save, fixtures, balance, curriculum, `vite/` untouched |
| `dist/` | no `__martynkaE2E`; scene method `backdropPixel` and the `console.warn` ship by design |
| hooks | no settings edit, no `--no-verify` |

## 4. Next command

visual gate (row 4.9) — then /10x-archive audit-backdrop-fox

## 5. Open

- [visual] row 4.9: hook build on 4399, desktop 1440 and tablet 1024; matrix in `plan.md` row 4.9 (welcome/task/room before and after lose + restore; "Obrazki" with `fox-think.webp` and with `wallet-open.webp` aborted; task screen with `fox-think.webp` aborted at idle, after a miss, after a right answer).
- [human] row 4.7: accept `pl.settings.guideMissing` wording and `uiArtMissing(count, total, standIn)` (decision P-5). Reviewer note: "nie pokazuje się" reads slightly more naturally than "się nie pokazuje"; both correct.
- [human] row 4.8: accept the G-2 proof form (`page.route` abort, not a new `e2eArt` value; decision P-4).
- [reviewer] (CI at ship) row 4.10: job `check` of workflow `CI`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Follow-ups F1-F6 in `follow-ups/review-fixes.md` (F6 new: `isSalonPixel` in `backdrop-restore.spec.ts`).
- Load flakes seen: `fox-guide.spec.ts` `#11 no fox on the unlock card`, `stale-tab.spec.ts` `#2 B-1 without BroadcastChannel` (pass serially).

## 6. Autonomous decisions

- **IR-1 Triage in place** (contract rule 1): warnings F1-F3 fixed (cheap), F4 deferred to follow-up F6 (needs a measured tolerance under SwiftShader). Would change: the maintainer asking for the stronger pixel check now.
- **IR-2 Separate `events.once('shutdown')` blocks kept** for the restore listener instead of merging into the existing one (plan wording): same behaviour, the guard now pins the placement. Would change: a lint or review rule requiring one shutdown block per scene.
- **IR-3 No `vite/e2eHookGuard.mjs` marker for `backdropPixel`**: scene methods for the hook already ship (`backdropState`, `targets`) and the plan forbids a guard edit. Would change: a rule that hook-only scene methods must be absent from `dist/`.
- **IR-4 e2e judged by serial re-run of whole files** (not `--last-failed`) so the 9 "did not run" tests of serial describes ran too. Would change: never.
