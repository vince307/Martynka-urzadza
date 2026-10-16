# Handoff — `final-art-p2` (slice S-16c)

Written by the `/10x-plan final-art-p2` step of autonomous run `2026-10-15-fix-s16bcd`: `plan.md` (11 phases with drivers) and `plan-brief.md` are written, no product code changed. The next agent must not let phase 1 land without the `money-pay.spec.ts` "spread" fix: with the wallet capped at 6 coins the old spread can need 7 coins and `payCoins` would hang.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | 3 on the branch after this step's commit (`docs(final-art-p2): change identity (autonomous run)`, `docs(final-art-p2): research`, `docs(final-art-p2): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 46 (`grep -c '^- \[ \]' plan.md`) |
| Roadmap | S-16c `Status: planning` (At a glance row and block), committed with the plan |
| Working tree | clean after the commit (five files staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/final-art-p2/plan.md` | full plan: 11 phases, `## Autonomous decisions` (3 `[human]` rows), `## Progress` |
| `context/changes/final-art-p2/plan-brief.md` | two-page brief with the key-decision table |
| `context/changes/final-art-p2/change.md` | status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-16c `proposed` → `planning` |
| `context/changes/final-art-p2/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/final-art-p2` |
| byte count of the boot queue on disk (`public/assets/tasks`, `public/assets/rooms`, `public/fonts`) | 442 240 + 1 233 242 + 118 983 B; with boot sounds 132 243 B = 1 926 708 B; + research's 151 014 B new = 2 077 722 B ≈ 41.6 s at 50 KB/s (basis of decision 3) |
| `sips -g pixelWidth/Height` on the pack P2 files | background 1920×1080, emblem 600², notebook 400², wallet 640×420, thumbnails 480×270, plate/box/sticker 512² |
| pack `manifest.json` `learning.wallet` | 6 `dropCenters`, pitch 120 × 88 native → 150 × 110 at the planned scale 1.25 |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched, `changed: true` |
| Success Criteria ↔ Progress | 46 rows, one per criterion bullet, phases 1–11 |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main c16734d: unit 3034, e2e 109 — inherited, unverified) |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan-review final-art-p2`

## 5. Open

- `[human]` decisions for the maintainer (plan `## Autonomous decisions` 1–3): wallet cap 10 → 6 (content change, `pay` variant of `E1.11.money_pay_10` / `E2.2.money_pay_20` refuses wallets of 7–10 pieces; teacher read in phase 1), `salon-before` not shipped, `balance.loader.totalMs` kept at 45 s with a recomputed comment.
- Manual-only Progress rows (human checklist): 7.4 iPad home-screen icon and Android maskable crop; 10.4 paying by finger on the wallet art.
- Visual rows: 4.4 wallet, 5.4 loading screen, 6.3 unlock card and room-done tile.
- New DESIGN-GAP planned: 115 (full wallet dims the tray) in phase 4; gaps 22, 105, 108 closed and 104 narrowed in phase 8.
- Follow-ups carried with their triggers (to `follow-ups/review-fixes.md` in phase 8): A-3/A-4/S14-08 (`loaderror` listener in `BootScene.preload`), `FontFace` limit, per-file timeout test, art-health set L-6/L-8/F4/A-5/ASL-02..09, texture atlas, `salon-before`, plate as MULT_GROUPS frame (`IconGroups`).
- Phase 1 must edit `tests/e2e/money-pay.spec.ts` (`spread`) in the same commit as `balance.coinDrag.maxTotal` 6.

## 6. Autonomous decisions

- **Wallet cap 6** (`[human]`), rejected: coins beyond the six centres, a 5×2 grid inside the art. Why: every amount payable in ≤ 4 pieces; bigger targets. Would change: the teacher read requiring 1-zł payments up to 10 zł, or a 10-place wallet from the author.
- **`salon-before` dropped** (`[human]`), live miniature + `salon-after` fallback. Would change: the author wanting the fixed picture or a room list of not-done rooms.
- **`totalMs` kept 45 s** (`[human]`), rejected: raising it. Why: measured 41.6 s at 50 KB/s, and a higher limit lengthens the stalled-server wait. Would change: S-16d's salon art pushing the queue past ≈ 2.2 MB, or a field report.
- **Wallet geometry art × 1.25, coin box 144 × 104**, full signal = dimmed tray (gap 115). Would change: the visual gate or author art for a full wallet.
- **Phase split 1–3 `tdd`, 4–8 `impl`, 9–11 `e2e`** per the step prompt (pure logic test-first; e2e after the phases that build it; risks #11, #15, #16 / FR-019). Would change: the plan review merging or splitting phases.
- **Notebook unlock card has no e2e** (visual 6.3 only): reaching the unlock card needs a long adaptive run; the choice is the tested `firstLoaded` rule. Would change: a cheap seam to open the unlock card.
- **Plan in English**, commit in Polish (profile § 1). Would change: a maintainer rule for Polish plans.
- No `AskUserQuestion`: the skill's complexity check, interview and phase-approval questions were decided from research and the step prompt.
