# Handoff — `salon-extra-slots` (slice S-16d)

Final pre-merge state, written by the ship step of autonomous run `2026-10-15-fix-s16bcd` before the archive move (earlier: visual gate `VISUAL: PASS`, row 3.7 ticked). `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` untouched; the [human] rows 6.4 and 8.4 stay open as a post-run checklist.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` (cut from main `a06795b`) |
| Commits | p1 4ac1460 … p8 9c41760, handoffs, impl review 9036f75, plus this `docs(salon-extra-slots): bramka wizualna` commit; no fix commits |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-15-fix-s16bcd/run-log.md |
| `change.md` status | `archived` (by `/10x-archive`, this step) |
| Progress rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): 6.4 [human], 8.4 [human] |
| Working tree | clean after this commit (`tests/e2e/visual.local/` deleted, never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/reviews/visual-review.md` | visual review: states vs the salon-v2 pack, star arithmetic 129 → 0, observations, `VISUAL:` line |
| `context/changes/salon-extra-slots/screenshots/README.md` | frame table: state · frames · how reached |
| `context/changes/salon-extra-slots/screenshots/*.jpg` | 42 JPEG frames (21 desktop 1440×900, 21 tablet 1024×768), 5.4 MB |
| `context/changes/salon-extra-slots/follow-ups/review-fixes.md` | new section "From the visual gate": VG-1 (miniature curtain overhang), VG-2 (hold outline top off-canvas), with triggers |
| `context/changes/salon-extra-slots/plan.md` | row 3.7 [visual] ticked |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present` (hook build, as intended) |
| `npx playwright test --config=tests/e2e/visual.local/visual.config.ts` (throwaway, port 4399, projects desktop + tablet) | 4 passed (1.5 m); hook log: stars 129 → 124 → 58 → 50 → 40 → 28 → 15 → 0, labels "Powieś zasłony 8", "Powieś półkę 10", "Wymień lampę 12", "Wymień roślinę 13", "Wymień pufę 15", mode "Zmień wygląd" after the card |
| Pixel diff r03 → r05 (shadow layer) | non-zero only under armchair, sofa legs, right plant, floor before the cabinet; 0.0 on the wall |
| Local gate (lint, typecheck, unit, build, e2e) | not re-run: no source change in this step; last observed green by the impl-review step on `063e7fd` (inherited, unverified here) |
| Port 4399 after the step | not listening (preview task stopped) |

No deliberate break: no test or code was written in this step.

## 4. Next command

none — shipped

## 5. Open

- [human] 6.4 and 8.4 (iPad: "Wymień lampę" wording, hold on the curtains near the top edge).
- Follow-ups in `follow-ups/review-fixes.md`: VG-1 (`drawRoomMiniature` live overhang ≈ 5 CSS px, inside the tile), VG-2 (curtains hold outline in `RoomScene`/`RoomView` hold drawing, top edge off-canvas), plus the earlier VO1–VO3, F1–F5 entries.
- The 'drawn' miniature mode (`miniatureMode` → 'drawn') has no e2e seam: code-reviewed only.

## 6. Autonomous decisions

1. **Playwright fallback instead of Claude in Chrome**: canvas touches and the long press cannot be driven synthetically (profile § 8). Would change: a Chrome tool that drives touch on the canvas.
2. **F5 / VG-1 recorded, not fixed**: the overhang stays inside the tile border and clear of the check mark and caption. Rejected: clipping in `drawRoomMiniature` now (new mask/crop code plus a test, for a few pixels). Would change: the author or the iPad check finding it distracting, or the overhang crossing the tile border.
3. **Local gate not re-run**: only docs and screenshots changed. Would change: any source edit in this step.
4. **Tablet hold frame named `-panel-open`**: the screenshot latency at 1024 landed after the 600 ms hold, so it shows the opened change panel, not the outline; the desktop frame shows the outline. Would change: nothing; renamed for honesty.
