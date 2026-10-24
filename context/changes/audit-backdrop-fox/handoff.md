# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-new` step of run 2026-10-24-audit-backdrop-fox: the change folder and `change.md` exist, nothing else.
The next agent must not treat the audit reports as repo paths (they live only on branches docs/observability-audit-2026-10-22-notebook-polish, PR #101, and docs/observability-audit-2026-10-23-fox-guide, PR #104; read them with `git show origin/<branch>:context/audits/observability/<file>`), and must remember that `WelcomeScene` has no refresh method yet.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 1 on top of `e020886`: `docs(audit-backdrop-fox): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/change.md` | change identity: scope items 1-8, claim / repo now / correction table, kit views and copy keys, migration (none), triggered follow-ups, autonomous decisions D0-D6 |
| `context/changes/audit-backdrop-fox/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-backdrop-fox` |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code touched; baseline on `main` `e020886` per the agent contract (unit 3891, e2e 155), unverified here |
| repo checks behind the claims table | observed in this step: `grep` for `restorewebgl`/`contextlost`/`RESTORE_WEBGL` in `src/` (none), Phaser 4.2.1 `RESTORE_WEBGL_EVENT.js` and `DynamicTexture.js` comments, `snapshotPixel` present, `SalonBackdrop.render`, `GuideFox.show`, `FallbackWhere`/`FALLBACK_ORDER`, `pl.settings.uiArtMissing`/`artFallback`, `E2EArtSeam`, `E2E_HOOK_MARKERS`, `SAVE_VERSION = 4`, two Atkinson spots in `docs/art-inventory.md` |

No deliberate break (nothing to protect yet).

## 4. Next command

`/10x-research audit-backdrop-fox`

## 5. Open

- Research questions (from `change.md` corrections and D1): does Phaser 4.2.1 emit `restorewebgl` on `game.renderer` after `WEBGL_lose_context.restoreContext()`; does `SalonBackdrop.render` (remove old `DynamicTexture`, add a new one, `enableFilters` blur) work right after restore; does `holder.destroy(true)` free the filter camera (FU-NP 16); is `Graphics.generateTexture` (`starBurst`) canvas-backed; is `WEBGL_lose_context` available in the e2e Chromium; does `DynamicTexture.snapshotPixel` return a real pixel there; redraw while `TaskScene` sleeps (on the event or on `wake`).
- G-1 copy: one new short Polish key under `pl.settings` for a missing fox (decision D3); DESIGN-GAP row 168 amended and maybe one new row (D6) in `docs/design-gaps.md`.
- G-2: new `e2eArt` seam value in `E2EArtSeam` (`src/testing/e2eHook.ts`) and the UI branch of `BootScene.preload`; marker `e2eArt` already guards it.
- Follow-ups: FU-FG F6 folded; FU-NP 16 partly folded; the rest re-recorded as open (table in `change.md`). No `follow-ups/review-fixes.md` yet.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

Recorded in `change.md` `## Autonomous decisions` (D0-D6), each with chosen, rejected, why and what would change it. In short: D0 scope.md items pre-agreed by the maintainer 2026-10-24; D1 next step `/10x-research` (prompt-fixed; real Phaser unknowns), would change: nothing; D2 redraw through each scene's refresh path, would change: research showing the widget must own a rebuild; D3 a separate true fox sentence instead of "lisek" under "gra rysuje", would change: maintainer wording; D4 pure availability rule + one e2e seam for one missing pose, would change: a seam needing a new build-guard marker; D5 health-lines FU 20 only if `pl.settings.artFallback` is edited; D6 gap row 168 amended, no gap for B-1/B-2 unless restore shows a visible difference.
