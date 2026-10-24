# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-plan` step of run 2026-10-24-audit-backdrop-fox: `plan.md` (six phases, 30 Progress rows) and `plan-brief.md` are written and `change.md` is `planned`. The next agent must not let a phase redraw the backdrop later than inside the `restorewebgl` handler, and must keep `'guide'` out of `pl.settings.artFallbackNames` (the `fallback` line is typed `DrawnFallbackWhere`).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 3 on top of `e020886`: change identity, research, `docs(audit-backdrop-fox): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 30 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/plan.md` | full plan: 6 phases with `Driver:` lines, success criteria, autonomous decisions P-1..P-11, `## Progress` (30 rows) |
| `context/changes/audit-backdrop-fox/plan-brief.md` | two-page brief with the key-decision table |
| `context/changes/audit-backdrop-fox/change.md` | status `planned`; one plan-step entry appended under `## Autonomous decisions` |
| `context/changes/audit-backdrop-fox/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-backdrop-fox` |
| script comparing each phase's Success Criteria bullets with the Progress rows | 30 = 30, identical text |
| `metadata-guard.mjs mark-planned` | `{"changed":true}`, status `planned` |
| `grep audit-backdrop-fox context/foundation/roadmap.md` | no row (non-roadmap change; roadmap untouched) |
| source read for open questions | `DynamicTexture.snapshotArea` under Canvas → `CanvasRenderer.snapshotCanvas(..., getPixel false)` → `CanvasSnapshot` builds an async `Image`, never a `Color` (basis of P-2); `FallbackWhere` indexes `artFallbackNames` in `artHealthView.ts` `textOf` |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no product code; baseline on `main` `e020886` per the agent contract (unit 3891, e2e 155), inherited, unverified here |

No deliberate break (nothing to protect yet).

## 4. Next command

`/10x-plan-review audit-backdrop-fox`

## 5. Open

- Phases: 1 tdd (`guideAvailable`, `guide` line, `standIn`, `pl.settings.guideMissing`), 2 impl (`GuideFox` constructor rule, `recordFallback('guide')`, `requested`, `UIScene` `noStandIn`), 3 impl (`SalonBackdrop` `BackdropSnapshot`/`pixel()`, `RESTORE_WEBGL` listeners in `TaskScene`/`WelcomeScene`, hook getter `backdropPixel`, Phaser pin, `tests/backdropRestoreWiring.test.ts`), 4 impl (C-1, gap 168, CLAUDE.md, follow-ups, sweep, visual), 5 e2e (`tests/e2e/backdrop-restore.spec.ts`, +3), 6 e2e (`tests/e2e/fox-guide.spec.ts` describe "one pose missing", +2).
- Manual rows (human checklist): 4.7 `[human]` accept the parent wording (`pl.settings.guideMissing`, `uiArtMissing` `standIn`); 4.8 `[human]` accept the G-2 proof form (`page.route`, not a new `e2eArt` seam value — departs from scope item 6's literal options); 4.9 `[visual]` desktop 1440 + tablet 1024 matrix (welcome/task/room-open before and after a forced restore, "Obrazki" with fox or wallet missing, task with one pose missing); 4.10 `[reviewer] (CI at ship)` workflow `CI` job `check` log `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- DESIGN-GAP: row 168 amended in phase 4; no new row.
- Follow-ups go to `context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` in phase 4 (Canvas `pixel()` null, real-device context loss, FU-NP 16 remainder, WelcomeScene carried F4/F6, artHealth/artHealthView generic triggers re-recorded; narrator hook follow-up and fox-guide F6 recorded closed).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **P-1 Six phases** instead of research's three. Why: small, independently green phases, the last impl phase carries the sweep. Would change: per-phase overhead dominating.
- **P-2 `SalonBackdrop.pixel()` returns `null` under Canvas** (research open question). Why: the Canvas snapshot path is asynchronous and returns an `Image`. Rejected: a `getImageData` path for a renderer no e2e runs. Would change: an e2e project on Canvas or a Canvas-only bug report.
- **P-3 The Chromium "INVALID_OPERATION: delete" log on restore is accepted**; specs assert no console silence. Rejected: filtering or patching. Would change: a visible glitch or a console-error spec guard.
- **P-4 G-2 e2e through `page.route`** (research R4), departing from scope item 6's literal options → `[human]` row 4.8. Rejected: a new `E2EArtSeam` value. Would change: the service worker serving the file under `serviceWorkers: 'block'`, or the maintainer asking for the seam.
- **P-5 Parent copy** "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." + `uiArtMissing(count, total, standIn)` → `[human]` row 4.7. Would change: the maintainer's wording.
- **P-6 Pixel via a separate hook getter `backdropPixel`**, not a snapshot field. Why: no GPU readback on every poll of 155 specs; scope item 3's snapshot fields are all present. Would change: a spec needing the pixel inside the same frozen snapshot.
- **P-7..P-11**: redraw counted by `render(..., cause)`; listener on every renderer type; `noStandIn` injected (no core import of `UI_ART_KEYS`); older WelcomeScene/artHealth follow-ups re-recorded not folded (scope item 8); e2e risk ids #12/#11 (backdrop) and #11/#14 (fox). Reversal conditions in `plan.md`.
