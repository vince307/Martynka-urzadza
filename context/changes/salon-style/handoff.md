# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-plan` step of run 2026-10-24-salon-style: `plan.md` has six phases (tdd, impl ×4, e2e) with 33
Progress rows, and `plan-brief.md` is written. The next agent must not reintroduce a dust overlay or a turquoise nudge, and must
keep the worn pieces outside `chosen` / `shownVariants`. The extra grade on soft furnishings (P-2) is a plan decision answering
the orchestrator's concern, so a review must not read it as drift.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | three: `docs(salon-style): change identity (autonomous run)`, `docs(salon-style): research`, `docs(salon-style): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| Progress rows remaining | 33 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/salon-style/plan.md` | full plan: 6 phases with `Driver:` lines, contracts, literal oracles, deliberate breaks, `## Autonomous decisions` P-1…P-12, `## Progress` (33 rows) |
| `context/changes/salon-style/plan-brief.md` | two-page brief |
| `context/changes/salon-style/change.md` | status `preparing` → `planned` |
| `context/changes/salon-style/handoff.md` | this file |
| scratchpad `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/` | new montages `m12-variants.png` (every variant of seven slots), `m13-worn-levers.png` (old before / grade E / E + soft extra / without frames / done room); scripts `variants.py`, `m13.py`; not committed |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/salon-style` |
| `python3 m13.py` (scratchpad, Pillow 12.1.0, numpy 2.4.3) | montage written, judged by eye: soft-extra grade B gives a clearly larger purchase step than E alone |
| prototype `grade_matrix` for the two param sets | E `[0.5794,0.1842,0.0941,0,16.8, …]` (matches research), soft `[0.691,0.1693,0.1168,0,0, 0.1325,0.7199,0.1155,0,0, 0.1278,0.1548,0.669,0,0]` — pinned as literals in phase 1 |
| Phaser 4.2.1 `renderer/webgl/renderNodes/Camera.js` | internal filters run from index 0 upward (soft matrix added first) |
| `grep -c '^- \[ \]' plan.md` | 33 = Success Criteria bullets of phases 1-6 (4+5+5+5+11+3) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| full local gate | not run: docs-only step, no code changed (baseline in the contract: unit 3915, e2e 160) |

## 4. Next command

`/10x-plan-review salon-style`

## 5. Open

- Manual rows (phase 5): 5.6 [human] accept the worn before state or ask the author for a before picture; 5.7 [human] grade
  stronger than scope's −25 % and no dust overlay; 5.8 [human] turquoise not nudged; 5.9 [human] board `#BCD799` and the Python
  step; 5.10 [visual] the full frame list at 1440 and 1024; 5.11 [reviewer] (CI at ship).
- DESIGN-GAPs to add in phase 5: 169 worn look, 170 board colour, 171 contact shadows, 172 missing worn texture shows nothing;
  107 and 109 amended.
- Risks: WebGL vs the Pillow prototype; nested per-image filters inside the backdrop's blurred holder (fallback named in plan
  "Known risks"); `#15 H-2` retargeted to `shadows.webp` in phase 3.
- Follow-ups go to `context/changes/salon-style/follow-ups/review-fixes.md` in phase 5 (list in plan phase 5 § 4).

## 6. Autonomous decisions

- P-2 orchestrator concern: extra grade on sofa, rug, armchair, pouf (sat −0.35, sepia 0.10, brightness 0.95) before grade E.
  Rejected: plainer coffee-table top (no variant without the vase, m12), dropping the table or the frames, a non-v0 worn variant
  (kept as the `SALON.worn[].variant` data lever). Would change: the maintainer rejecting the look at [human] 5.6.
- P-3 per-image filters through one helper `applyWornGrade`, not one filtered container (research's proposal). Would change: a
  frame-rate report on the first room screen.
- P-7 no contact shadows in the backdrop miniature. Would change: the visual gate showing floating pieces in the after backdrop.
- P-9 six phases (research's scene phase split so the old file stays queued until the phase that removes it retargets `#15`).
  Would change: per-phase overhead dominating.
- P-10 hook fields `room.worn`, `room.contactShadows`, `backdrop.graded`. Would change: a spec needing per-piece filter state.
- P-1, P-4, P-5, P-6, P-8 carry research R1, R4, R5, R6, R7 unchanged; P-11 e2e risks #16 and #12; P-12 no teacher read (no task
  content). Each reversal condition is in plan.md `## Autonomous decisions`.
- Skill's AskUserQuestion steps (complexity, questions, phase approval) skipped: unattended run; decisions taken from research,
  change.md and scope.md, the step prompt's concern answered by a new prototype.
- No roadmap edit (non-roadmap change, step prompt).
