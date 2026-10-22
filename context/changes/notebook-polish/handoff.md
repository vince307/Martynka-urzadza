# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-plan` step of run 2026-10-22-notebook-polish: `plan.md` (12 phases, drivers tdd ×1, impl ×10,
e2e ×1) and `plan-brief.md` are written; `change.md` is `planned`. The next agent must not get this wrong: no motion
may move a `Zone`, gate input or delay `StarCounter.setValue` (7 e2e specs read `counterText` at once), and `addBlur`
only behind `renderer.type === WEBGL`.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish`, cut from `main` at `6e426ed` |
| Commits | 5 on the branch after this step (`40e27fe` change identity, `2da4b37` research, `6a7da0a` plan, then two handoff fixes) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 59 (all; `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/notebook-polish/plan.md` | the plan: 12 phases with `Driver:` lines, success criteria with baseline + delta, deliberate breaks + meta-checks, proof steps with decided fallbacks, `## Autonomous decisions` P-1..P-12, `## Progress` |
| `context/changes/notebook-polish/plan-brief.md` | two-page brief |
| `context/changes/notebook-polish/change.md` | frontmatter status `preparing` → `planned` |
| `context/changes/notebook-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/notebook-polish` |
| node check: each phase's Success Criteria bullets equal its Progress rows (text and count), every phase body has `Driver:` + `Driver why:` | 12/12 phases match |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `changed: true` |
| `GraphicsCanvasRenderer.js` (`case Commands.GRADIENT_FILL_STYLE: index += 5`) | Canvas skips gradient fills → solid-first fallback in `fillPaper` (plan phase 2) |
| roadmap lookup for `notebook-polish` | not done by instruction (no roadmap row; step prompt: skip the status edit) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no product code changed (contract baseline: unit 3736, e2e 144 on `main` 6e426ed) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan-review notebook-polish`

## 5. Open

- Proof steps with decided fallbacks inside phases: WebGL gradient on rounded rects (phase 2, row 2.4 → two-band fill);
  blur baked into a `DynamicTexture` capture (phase 3, row 3.5 → ⅛ scale, no filter); Chromium accepting the modified
  font (phase 10, rows 10.4/10.5 → revert to the original, follow-up); Safari only by the maintainer (11.8).
- Manual rows (human checklist): `[visual]` 2.4, 2.5, 3.5, 3.6, 4.5, 5.5, 6.5, 7.5, 8.4, 9.4, 10.5, 11.7; `[reviewer]`
  11.6; `[human]` 11.8 (maintainer checks look + plain zero on the real tablet before "merguj").
- DESIGN-GAP numbers fixed in the plan: 155 backdrop, 156 `ActionButton` lip, 157 press motion, 158 HUD pills, 159
  bounce + counter pop, 160 wobble, 161 beads, 162 entrance stagger, 163 summary pops + burst, 164 plain zero; rows 20
  (narrowed, phase 2), 152 (phase 5), 25 (phase 6) updated.
- Follow-ups list for phase 11 (`context/changes/notebook-polish/follow-ups/review-fixes.md`, not yet created): digits/
  dice motion, `SelectTiles`/`CoverBoard`/`LetterTiles`/`Dice` restyle, cushion, star sound vs pop timing, FontFace limit
  (re-recorded), salon sleep follow-ups (re-recorded, `RoomScene.celebrate` code swap only), step indicator dots,
  FeedbackBar size, unlock/minigame bursts, spine band, Safari font.
- Phase 10 needs `fontTools` (Python) locally; output committed, CI does not run it.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **12 phases instead of research's 8** — rejected: research phases touching 4–7 widgets with 2 components. Why: step
  prompt caps UI phases at ~2 new components for fresh agents. Would change: orchestrator measuring per-phase overhead
  as dominant.
- **Pivot trick for all motion (face child at `(-cx,-cy)` in a centred container)** — rejected: redrawing widgets in
  local coordinates. Would change: a nested-container input/mask quirk found in phase 4.
- **Bounce/wobble targets: tile, keypad field, OK button; none for digits/dice** — would change: maintainer request.
- **Burst on every `SummaryPanel`, none on unlock/minigame-done; `starBurst` shared with `RoomScene` (same params)** —
  rejected: copying the texture code. Would change: impl-review finding a behaviour change in `celebrate`.
- **Font "Martynka Next" built from `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf`, old public file
  removed** — rejected: second OFL digits font. Would change: Chromium `fontHealth: 'fallback'`.
- **One e2e phase (6 tests, risks #11/#12) after the seam sweep; hook `backdrop` field added in phase 3** — would change:
  a motion phase breaking a spec the new one would not catch.
- **No PRD-conflict `[human]` row**: no decision contradicts the PRD's literal text (touch < 100 ms, reduced motion,
  nothing only by colour all hold); the plain zero overrides the kit by the maintainer's own decision. The required
  tablet check is 11.8.
- No questions asked (contract rule 1): every choice came from scope.md, change.md, research.md or is recorded above and
  in plan `## Autonomous decisions`.
