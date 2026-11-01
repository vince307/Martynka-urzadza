# Handoff — `bathroom-room` (slice S-31)

Written by the `/10x-plan` step of run 2026-11-01-bathroom-polish-lab: `plan.md` (6 phases, 37 Progress rows) and
`plan-brief.md` are written, nothing is implemented. The next agent must not let the `HOUSES` row (phase 4) land before
the card rule (phases 1-2): every house-1 card gets four tiles the moment the row exists.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | 3 on the branch after this step: `c208e25` identity, `6b96a9f` research, then `docs(bathroom-room): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/bathroom-room/plan.md` | plan: phases 1 tdd (card rule `roomDoneCardRect`), 2 impl (`RoomDoneCard` reads it), 3 impl (bathroom data/copy/art, unreachable), 4 tdd (`HOUSES` row, frozen fixture, flipped tests), 5 impl (docs, gaps, follow-ups, seam sweep, visual), 6 e2e (`bathroom-room.spec.ts`); `## Autonomous decisions` P1-P9; `## Progress` |
| `context/changes/bathroom-room/plan-brief.md` | two-page brief with the decision table |
| `context/changes/bathroom-room/change.md` | status `planned`; the product-owner note finalised (core helper + widget + layout data) |
| `context/foundation/roadmap.md` | S-31 status `proposed` → `planning` (at-a-glance row and body) |
| `context/changes/bathroom-room/handoff.md` | this handoff |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/bathroom-room` |
| `gh run view 41313671518 --log` (Deploy of merge #133, sandbox disabled) | SEEN: `Tests  4212 passed \| 3 skipped (4215)`, `e2e hook: absent (2 chunks checked)`, `ok   precache covers room pictures — 123 of 123 room pictures precached` (cited in rows 3.8 and 5.12) |
| `grep -c '^- \[ \]' plan.md` | 37 = the Success Criteria bullets of the six phases, one-to-one |
| `grep -A2 '^## Phase' plan.md` | every phase opens with `Driver:` and `Driver why:` |
| `metadata-guard.mjs mark-planned` | `{"changed":true}`, status `planned` |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no product code changed |

No deliberate break: nothing testable was written. The contract's baseline line is still the `<<<BASELINE>>>`
placeholder; phases measure on the branch and write `baseline + delta`.

## 4. Next command

`/10x-plan-review bathroom-room`

## 5. Open

- Product-owner `[human]` rows (plan Progress): 5.7 card code outside data (`roomDoneCardRect` in
  `src/core/roomDoneLayout.ts`, `RoomDoneCard.show`, `ROOM_DONE_LAYOUT.card`); 5.8 costs 5 + 7..15 = 71; 5.9 wording
  (gap 205, pack captions over the roadmap's "szafka"/"półka z kaczuszkami"); 5.10 'room' celebration against PRD
  FR-040's literal 'house' intensity (S-24 owns it); 5.11 real tablet offline.
- `[reviewer]` rows: 2.5 card coordinates from the rect; 3.7 Polish-language read of the bathroom copy; 3.8 and 5.12
  (CI at ship, Deploy smoke `144 of 144` and build `Tests <4212 + N> passed`).
- `[visual]` row 5.6: 14 frames × desktop 1440 and tablet 1024.
- E2E: phases run only the specs they add or edit (single-spec command); the orchestrator runs the full suite once after
  phase 6 from a pinned worktree, expected `191 + 2`.
- Phase 3 depends on local `cwebp` + Pillow 12.1.0 + numpy 2.4.3 and the local `designs/martynka-bathroom-v1`; a tool
  failure is BLOCKED, never a hand-made WebP.
- Follow-ups fired (handled in phase 5): kids-room 1, 3 (closed), 7 (re-measure), 11 / house-cross-section 21 (closed by
  phase 6), final-art-salon F2 (re-record), hangar 4 (carry); new: finished-house celebration (Trigger: S-24), six rooms
  in one house (Trigger: a house with six rooms).

## 6. Autonomous decisions

- Skill's "ask the user" points (complexity, question budget, approach, phase structure) decided in place: complexity
  MEDIUM, 0 open product questions after research (every product question had a research recommendation), 6 phases.
  Would change: the plan review finding an undecided product question.
- P1 card option A via a pure core helper (rejected B fixed 1516, C smaller tiles, D two rows, inline maths). Would
  change: a designer four-room card or the 1024 visual frames showing the card cramped.
- P2 `ROOM_DONE_LAYOUT.card` loses `left`/`width`. Would change: a second reader of the fixed rect.
- P3 costs 71 (D3). Would change: S-17 or the maintainer naming prices.
- P4 wording ("Ustaw umywalkę i lustro", "Połóż dywanik", "Powieś półkę z zabawkami", "Naturalne" for the two-noun
  sink caption). Would change: the reviewer's Polish-language read or a designer list.
- P5 'room' celebration, decided against PRD FR-040's literal text (`[human]` row 5.10). Would change: the maintainer
  wanting the 'house' intensity in S-31.
- P6 frozen fixture + load-order mirror instead of an e2e save seam. Would change: a `main.ts` load bug the mirror misses.
- P7 four-tile fit proven by a rendered pixel outside the old card, no hook rect. Would change: the point covered by
  another layer on some renderer.
- P8 kids-room #16 flipped (change mode proven through a visit), not deleted. P9 house-cross-section follow-up 21 closed in
  the phase-6 spec. Would change: nothing foreseen.
- No overturn of scope.md or the orchestrator's starting decisions (save v6 kept, costs on the kitchen precedent).
