# Handoff — `final-art-salon` (slice S-16a)

Written by the implementation review step (`/10x-impl-review final-art-salon`, full plan, phases 1-10). Verdict APPROVED, `MERGE: CLEAR`; one fix commit (stale comments only). The next agent must not get wrong: the live-save remap (`remapLegacySalon`) is verified on data and needs no change; the remaining rows are [visual] (orchestrator gate) and [human] 2.5, 10.4.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-10 (`d5d6993` … `9362f3f`), review fix `898517d`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` | 8 rows open (`grep -c '^- \[ \]' plan.md`): [visual] 4.7, 5.3, 5.4, 6.4, 7.4, 8.3; [human] 2.5, 10.4. No [reviewer] rows in the plan |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-art-salon/reviews/impl-review.md` | review report: 0 critical, 2 warnings (deferred), 5 observations (1 fixed); ends with `MERGE: CLEAR — …` |
| `context/changes/final-art-salon/follow-ups/review-fixes.md` | new section "From the implementation review": F1-F5/F7 with `Trigger:` lines |
| `context/changes/final-art-salon/change.md` | `status: impl_reviewed` |
| `src/scenes/RoomScene.ts`, `src/data/layout.ts`, `src/ui/widgets/RoomView.ts`, `src/ui/widgets/RoomLayer.ts` | commit `898517d`: stale comments reworded (class doc of `RoomScene`, `ROOM_LAYOUT` doc, `RoomView.objectOf`, `RoomLayer.object`); no code change |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| lint / typecheck | pass (before and after `898517d`) |
| unit | `npm test` 2939 passed = baseline 2839 + 100; deploy and ops tests OK; `sample` E1-E6 exit 0 (before the fix); after the fix lint, typecheck, `npm test` 2939, build re-run green |
| build | pass, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` lists all 26 `assets/rooms/salon/*.webp` (1 233 242 B); no lazy chunk |
| e2e | `npx playwright test --config=<abs> --workers=4`: 98 passed (7.1 min) = baseline 93 + 5 (`room-purchase` 1→2, `salon-art` 0→4); run on `1dc079b`, the fix after it is comments only |
| fixtures | `git diff --exit-code main..HEAD -- tests/fixtures/` clean |
| Deliberate break | `remapLegacySalon` rounds down (`cost + next <= spent`) → `tests/salonRemap.test.ts` 8 failed; restored, 62 passed. Meta-check: it bites the rounding rule (prefix ≥ spent, gifts with variant 0), the same 8 as the phase 2 record; idempotence is guarded separately (phase 2 meta-break) |
| Remap on data | throwaway script: old `tasksDone` 0-10 × 6 variant patterns + a second room, 66 cases, 0 failures (stars same, carried variants kept, every new slot task has `chosen`, idempotent `toBe`, round-trips `encodeSave`/`decodeSave`) |
| Hooks | `.claude/settings.json` and `.claude/hooks/*` predate the branch; no `--no-verify` used |

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- [visual] 4.7 "Obrazki" section, 5.3/5.4 room screenshots and z order, 6.4 variant panel (thumbnail crop in `VariantPanel.show` verified by reading Phaser 4.2.1 source, not yet seen in a browser) and room-done card, 7.4 cross-fade/pop frames (also check F1: leave the room during the fade), 8.3 loading screen and unlock card book.
- [human] 2.5 remap rule B (round up, no refund; old 9-10 lose 10/25 stars of value, room done; curtains disappear, floor/walls → stage, lamp/plant → decor). 10.4 iPad PWA run.
- Follow-ups F1-F5/F7 in `follow-ups/review-fixes.md` (`RoomScene.fadeStage`, `RoomView.drawRoomMiniature`, `BootScene` progress listener, `createArtHealthView`, room helper duplication).
- Later: archive (re-run `validate-rule-files.sh` after the move), ship.

## 6. Autonomous decisions

1. F1 and F2 (warnings) deferred to follow-ups instead of fixed. Why: both are cosmetic with a correct end state (F1) or occur only with partly missing art (F2); a scene change would need another full E2E gate and visual re-check. Would change: the visual gate shows F1 as distracting, or the maintainer wants it in this slice.
2. Only the stale comments (F6) fixed in place: zero behaviour change, gate re-run without E2E. Would change: nothing.
3. Content teacher read done on the new `pl.room.*` strings, variant names and minigame words (no generator or curriculum change in this slice, so `sample --count 6` reading of task steps not needed beyond the gate's exit 0). Would change: a later fix touching `src/data/` task content.
