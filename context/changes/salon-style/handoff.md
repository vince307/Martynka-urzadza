# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-research` step of run 2026-10-24-salon-style: `research.md` answers every open question with prototype
montages (scratchpad, not committed) and proposes five phases. The next agent must not reintroduce a dust/stain overlay or a
turquoise nudge: both were tried by eye and rejected; and the worn pieces must stay outside `chosen` / `shownVariants`.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | two: `docs(salon-style): change identity (autonomous run)`, `docs(salon-style): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| Progress rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/salon-style/research.md` | findings: grade numbers (E), Phaser 4.2.1 filter API/Canvas/DynamicTexture, slot mapping, board colour + tool, turquoise verdict, contact shadows, budget, phases, gap rows |
| `context/changes/salon-style/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/salon-style/handoff.md` | this file |
| scratchpad `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/` | prototype scripts and montages (`m9-proposed-flow.png` is the key one); not committed |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/salon-style` |
| Pillow prototypes (`m1.py`…`m9.py`, `board2.py`, `turq.py`) | montages opened and judged by eye; chosen numbers in research.md §1, §4, §6 |
| recolour determinism: `recolour2` run twice + `cmp` | byte-identical PNG |
| `cwebp -q 85 -alpha_q 100 -m 6` on the source `architecture-after.png` + `cmp` with the committed webp | identical (cwebp 1.1.0 is deterministic) |
| recoloured webp sizes | after 68 022 B (was 71 648), before 86 958 B (was 93 778); boot payload ≈ 2 079 700 B ≈ 41.6 s vs 48 s |
| full local gate | not run: docs-only step, no code changed |

## 4. Next command

`/10x-plan salon-style`

## 5. Open

- Plan inputs (research.md "Proposed phases"): P1 tdd data+core (`wornMatrix`, `wornPieces`, `contactShadowPieces` in
  `src/core/rooms.ts`, `RoomDef.scene` without `furnishingsBefore`, `miniaturePieces` worn flag, file deleted); P2 impl
  scene/widgets (`RoomView.render`, `RoomScene.fadeStage` + `onSleep` F1, `SalonBackdrop.render` graded sub-container, Canvas
  wash, e2e snapshot field); P3 impl art (`scripts/recolour-board.py` pinned Pillow 12.1.0 + numpy 2.4.3, called from
  `scripts/make-task-art.mjs`); P4 e2e (#15 in `tests/e2e/salon-load-health.spec.ts` retargeted to `shadows.webp`, new
  before/after spec); P5 impl docs + visual gate.
- DESIGN-GAPs to add: 169 worn look, 170 board colour `#BCD799`, 171 decoration contact shadows, 172 missing worn texture
  shows nothing; 107 and 109 amended.
- Risk: the WebGL result vs the Pillow prototype (shader clamps per channel like the prototype); the visual gate decides.
- Follow-ups for `follow-ups/review-fixes.md` at plan/archive time: thumbnail and loading background with curtains; a proper
  "before" from the author if the code version falls short; L-7 fires via the worn layer's snapshot field.

## 6. Autonomous decisions

- R1 grade E (sepia 0.20, saturate −0.30, brightness 0.90, contrast 0.90, lift +4) over the scope's A (−0.25/light sepia/0.92):
  A left the sofa cyan and the before/after step small (m1). Would change: the visual gate on WebGL showing E too grey or
  too weak.
- R2 no dust/stain overlay; the matrix haze + the whole `shadows` layer in the before state replace it. Rejected: speckles
  (polka dots, m2), soft stains (spots, m4). Would change: the maintainer saying the room does not read as "old".
- R3 `architecture-before` kept (no clash, m9). Would change: the visual gate.
- R4 board `#BCD799` via a pinned Python + Pillow + numpy conversion step. Rejected: ivory + shadow (pillars melt), sharp,
  pngjs, runtime code. Would change: the maintainer refusing Python in `npm run art`, then pngjs.
- R5 turquoise nudge not done (D6 not met, m8). Would change: a maintainer request.
- R6 contact shadows as code ellipses (alpha 0.25, rgb 95,70,43 from the pack's layer), shown after the stage until
  `roomDone`. Rejected: crops of `shadows` (blobs touch neighbours). Would change: author-delivered per-piece shadows.
- R7 worn pieces = variant 0 of the nine slots in the worn picture + decor `plant-right`; missing texture shows nothing.
  Would change: the maintainer wanting stand-ins.
- R8 e2e #15 retarget to `shadows.webp`. Would change: the plan finding another file more representative.
- Skill's AskUserQuestion clarification skipped (unattended run; questions derived from change.md).
