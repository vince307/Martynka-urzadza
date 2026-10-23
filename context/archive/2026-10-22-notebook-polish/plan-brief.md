# Notebook polish — Plan Brief

> Full plan: `context/changes/notebook-polish/plan.md`
> Research: `context/changes/notebook-polish/research.md`

## What & Why

The maintainer finds the task notebook unpolished: the approved maths-A kit (blurred room behind the notebook, stitch
marks, margin line, butter bookmark, darker bottom edge, chunky buttons with a lip) was only half built, so the notebook
looks like a different game from the painterly salon. This change finishes the kit look, adds gentle interface life
(press, bounce, wobble, pops, stagger) and replaces the slashed zero with a plain school "0" (scope.md, PA-1..PA-13).

## Starting Point

`drawNotebook` fills two flat rounded rects on the plain page colour; only tiles, keys and age buttons have a lip; a
wrong answer shakes the whole camera; dots, summary and counter are static; the font Atkinson Hyperlegible Next has
only a slashed zero. Every control is absolute `Graphics` + `Text` + a fixed `Zone` the e2e hook aims at.

## Desired End State

Task, summary, unlock and welcome show the kit notebook over a blurred, ivory-washed picture of the child's own salon
(refreshed after a purchase; plain page when the salon picture is missing). Controls have a lip and a press that sinks
onto it; HUD items are kit pills. Correct answers bounce and the counter pops when the star lands (number changes at
once); wrong answers wobble slowly, never red; beads fill with a pop; tiles/keys stagger in; summary stars pop in one by
one with a burst. All motion is off under reduced motion. Every 0 is plain ("Martynka Next" font).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Backdrop | One ¼-size `DynamicTexture` capture of `drawRoomMiniature`, WebGL-only blur, re-captured on wake after a purchase | One quad per frame; Canvas cannot run filters | Research / Plan (P-5) |
| Backdrop fallback | ⅛ scale without blur if the capture does not bake the blur in; plain page if the scene picture is missing | Decided before the spike so phase 3 never stalls | Plan |
| Notebook look | Kit CSS over prose: stitch marks only (no spine band), shadow straight down | The approved screenshots show neither a band nor an offset shadow | change.md D-1 |
| Lip + press | One `ChunkyFace` helper: face container at the rect centre, children at `(-cx,-cy)`; zone never moves | Reuses all drawing code; e2e targets untouched | Research / Plan (P-2) |
| Gear | Pill + static lip, no press motion | Gaps 25/28/151 keep the gear feedback-free | Research |
| Counter | Number synchronous; pop on `GAME_EVENTS.starLanded` | 7 e2e specs read `counterText` at once | Research (D-5) |
| Bounce/wobble target | Picked tile, keypad field, OK button; none for digits/dice | The object the child confirmed | Plan (P-3) |
| Burst | Every `SummaryPanel`; none on unlock/minigame-done cards; helper shared with the room | "Only at the end of a round" | Plan (P-7, P-8) |
| Zero | Modified Atkinson Next, renamed "Martynka Next", built by `scripts/make-font.py` from the committed copy in `designs/` | Proven reproducible; same design; OFL kept | Research / Plan (P-6) |
| Phases | 12 small phases, ≤ 2 new components each, gaps 155–164 fixed in the plan | Fresh agent per phase | Plan (P-1, P-12) |

## Scope

**In scope:** notebook per kit + welcome sunflower; salon backdrop; lips/press on tiles, keys, `ActionButton`,
`PageButton`, `AgeButton`, speaker, "Do pokoju"; HUD pills (counter, gear static); bounce, wobble, counter pop, star
start fix; beads, entrance stagger; summary pops + burst; plain-zero font; DESIGN-GAP rows; CLAUDE.md; one e2e spec.

**Out of scope:** save/balance/content changes (save v4); new raster art; welcome cushion; spine band; `SelectTiles`,
`CoverBoard`, `Dice`, `LetterTiles` restyle; motion for digits/dice; unlock/minigame bursts; FontFace time limit; guide
mascot; street.

## Architecture / Approach

Tokens in `src/data/layout.ts` (`NOTEBOOK`, `BACKDROP`, `LIPS`, `HUD_PILL`, `BEADS`, new `ANIMATION` keys); pure rules in
`src/core/motion.ts`, `src/core/notebookGeometry.ts`, `src/core/backdrop.ts` (unit-tested); drawing helpers `kitDraw.ts`,
`chunky.ts`, `hudPill.ts`, `starBurst.ts` and the `SalonBackdrop` widget in `src/ui/widgets/`; scenes only wire them.
A source test keeps every new tween site behind `prefersReducedMotion()`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Tokens + pure rules (tdd) | layout tokens, stagger/pop/bead/geometry rules | wrong kit numbers |
| 2. Notebook (impl) | kit notebook, gradient helper, sunflower | gradient flat under WebGL (fallback set) |
| 3. Salon backdrop (impl) | blurred salon, refresh on wake, hook field | capture not baking blur (fallback set) |
| 4. Chunky + task controls (impl) | lip/press on tiles, keys, `ActionButton` | fire moment / hidden "Dalej" |
| 5. Page + age buttons (impl) | lip/press on page and age buttons | `pressed` guard |
| 6. HUD pills (impl) | shared pill, counter/gear restyle | HUD row crowding |
| 7. Bounce, wobble, counter pop (impl) | Step 2 answer feedback, shake removed | counter number delayed |
| 8. Beads + stagger (impl) | bead pops, entrance stagger | input gated during entrance |
| 9. Summary pops + burst (impl) | pops, burst, shared helper | buttons hidden during pops |
| 10. Plain zero (impl) | Martynka Next font + table test | Chromium/Safari rejecting the font |
| 11. Docs + seam sweep (impl) | CLAUDE.md, gaps, follow-ups, full visual pass | stale text |
| 12. e2e #11/#12 (e2e) | 6 tests: counter, summary taps, backdrop, reduced motion, font | flakes under load |

**Prerequisites:** branch `feat/notebook-polish`; local `fontTools` for phase 10 (output committed).
**Estimated effort:** 12 phase sessions plus reviews; e2e gates run by the orchestrator.

## Open Risks & Assumptions

- Blur baked into a capture and WebGL gradients on rounded rects are inferred from source; each has a proof step and a
  decided fallback.
- iPad Safari acceptance of the modified font is checked only by the maintainer ([human] 11.8).
- Larger beads + 104 px pills may crowd the HUD; fallback bead tokens exist.

## Success Criteria (Summary)

- The task/welcome screens match the kit frames at 1440 and 1024, over the child's own blurred salon.
- Every existing e2e spec stays green unchanged; 6 new e2e tests prove touch, counter and backdrop with motion on/off.
- The maintainer sees a plain 0 and approves the look on the real tablet before "merguj".
