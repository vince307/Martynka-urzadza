# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-new` step of run `2026-10-16-audit-sweep` (slice 3 of 3). The change identity and the re-verified
scope table are in `change.md`; nothing is researched or planned yet. Do not get wrong: audit ids collide across
reports — `P-1..P-6` here are the 2026-10-16_0915 ids except the "S14-06/P-4" one (2026-10-15_2217), and `M-1`/`M-2`
are 2026-10-16_1419; `change.md` § Notes "Id note" is the mapping.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | 1 (this docs commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were written) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/health-lines-and-smoke/change.md` | change identity: source, id mapping, save-format statement (v4), deploy boundary + why the new smoke checks pass on the current Caddy config, re-verified findings table (finding / audit says / repo now / in scope), `pl.ts`/`balance.ts`/`layout.ts` additions expected, design-kit binding, e2e candidates, follow-ups whose trigger names this area, deferred LOWs with triggers, autonomous decisions |
| `context/changes/health-lines-and-smoke/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/health-lines-and-smoke` |
| `git diff --name-only 9b7fe37 dfc49ae -- src scripts vite tests` (filtered to this area) | slices 1–2 touched `rooms.ts`, `artFilter.ts`, `main.ts`, `UIScene.ts`, `e2eHook.ts`, `settingsPanel.ts`, `CoinWallet.ts`; none closes a slice-3 id (re-read per row) |
| Re-read of every slice-3 id in the code at `dfc49ae` | 0 fixed, 0 obsolete; ids still open with the symbols named in `change.md` |
| Gate (lint, typecheck, tests, build, e2e) | not run — docs-only step, no code changed; baseline on main is the contract's (dfc49ae, inherited, unverified here) |

## 4. Next command

`/10x-research health-lines-and-smoke`

## 5. Open

- Research questions recorded in `change.md` (decisions 1, 3, 5, 7, 8): Caddy `file_server` answer to `HEAD` and to a
  precache `index.html` request (`scripts/check-deploy.ts` new per-entry check); the VPS MIME table for
  ttf/woff2/m4a/ogg; where Phaser 4.2.1 drops image and audio decode failures (`BootScene.create`, `SoundService`,
  `QUIET_REJECTIONS` in `src/core/errorSignal.ts`); whether a font failure fires `loaderror`; a throttled cold-start
  time with the sounds queued last (`BootScene.preload`, `balance.loader.totalMs`).
- New `pl.ts` lines expected → DESIGN-GAP rows from **139** in `docs/design-gaps.md` (no kit view for the parent panel).
- [human] row to carry into the plan: M-1 on a real iPad (a never-unlocking audio context in WebKit).
- Deferred LOWs (O-1 SW error name, 2217 P-4 deploy/ half, G-3 per-room thumbnail, G-6, ASL-05, ASL-08) are listed in
  `change.md` § Deferred with triggers; the plan's follow-ups file must copy them to
  `follow-ups/review-fixes.md`.
- Known e2e load flakes in this run (orchestration notes): `money-pay` #11, `final-art-loading` #15,
  `child-flow-guards` #2.

## 6. Autonomous decisions

The ten decisions are recorded in `change.md` § Autonomous decisions (chosen, rejected, why, what would change the
answer). In short:
1. Next step research (step prompt). Would change: nothing.
2. Every MEDIUM in; six LOWs deferred to stay within ~12–13 phases. Would change: plan-review over 14 phases → defer
   R-6, ASL-04, S-7 next.
3. O-1 split: smoke HEAD now, SW-side error name deferred. Would change: `vite-plugin-pwa` giving the error without a
   custom snippet.
4. Art tables from HEAD checked only with a SHA; per-entry status from the served `sw.js` always (no build manifest).
   Would change: the Deploy workflow passing a SHA on rollback.
5. Content type asserted only for Go built-in MIME extensions. Would change: research confirming the server types
   fonts/audio.
6. L-8 via a pure lines builder, no DOM test dependency. Would change: the maintainer adding one.
7. B-6 reorder first, `totalMs` only on measured evidence. Would change: the measurement.
8. S-2 kept in; source catch only if Phaser exposes it. Would change: a public Phaser hook.
9. M-4/R-3 as a runtime decode note (v4 kept). Would change: a need to show it on later launches.
10. M-1 touch counter in the sound service, threshold in `balance`; WebKit proof is human. Would change: Phaser
    exposing unlock failure.
