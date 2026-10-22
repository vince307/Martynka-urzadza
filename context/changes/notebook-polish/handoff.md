# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-research` step of run 2026-10-22-notebook-polish: `research.md` answers (a)–(f) with file + symbol
anchors; `change.md` is now `preparing`. The next agent must not get this wrong: no motion may move a `Zone`, delay a
state change or delay `StarCounter.setValue` (7 e2e specs read `counterText` at once), and an unguarded
`filters.internal.addBlur` throws under the Canvas renderer.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish`, cut from `main` at `6e426ed` |
| Commits | 2 on the branch after this step (`40e27fe` change identity, then `docs(notebook-polish): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/notebook-polish/research.md` | research: backdrop (reuse `drawRoomMiniature` into a `DynamicTexture`, refresh in `TaskScene` `onWake`, Phaser 4.2.1 blur API, Canvas guard), chunky helper inventory, motion placement, zero via a fontTools modification, tests that pin visuals, 8-phase split |
| `context/changes/notebook-polish/change.md` | frontmatter only: status `new` → `preparing`, `updated` 2026-10-22 |
| `context/changes/notebook-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/notebook-polish` |
| `node_modules/phaser` source: `Filters#enableFilters`, `FilterList#addBlur`; context7 v4 docs (Blur) | early return without `renderer.gl`; `addBlur(quality, x, y, strength, color, steps)` |
| fontTools experiment (`$TMPDIR/zero/make_zero.py`, not committed) | modified `zero` saved; two runs byte-identical (`cmp`); PIL render at wght 400/700/800 shows a plain 0, diacritics unchanged |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no product code changed (baseline in the agent contract stays the reference) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan notebook-polish`

## 5. Open

- Unverified at runtime (plan must spike or gate): a `DynamicTexture.capture` baking in a blur filter (WebGL); gradient
  fills under Canvas; Chromium/OTS acceptance of the modified font (prove `fontHealth: 'loaded'`).
- Font script must NOT alter name ID 0 (copyright) — the experiment's naive rename did; save with
  `recalcTimestamp=False`. Proposed family "Martynka Next" (plan decides the file name; `FONT_URL`/`FONT_KEY` in
  `src/data/layout.ts`).
- DESIGN-GAP rows still to write in `docs/design-gaps.md` (from 155; update 18, 25, 152; row 20 **narrowed**, not
  closed: the kit cushion overlaps `WELCOME_LAYOUT.parent`, sunflower only).
- scope.md correction: no "Podpowiedź"/"Pokaż kroki" button exists (`FeedbackBar` shows the hint by itself;
  `SolutionSteps` has "Następny krok"/"Już wiem") — the lip goes on `ActionButton`, which covers them.
- Follow-ups firing: slashed zero (phase 7), shared HUD button (phase 4), star flight start over the 9 key
  (`ANIMATION.starStartLift`, phase 5), bare animation numbers in touched widgets; conditional: `RoomScene.celebrate`
  edit fires the salon sleep follow-ups (or copy the texture code instead); FontFace time limit does not fire if only
  URL/key change (re-record).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **Backdrop = one capture into a `DynamicTexture` at reduced size (¼) + `addBlur` only on WebGL; refresh in `onWake`
  on a new `rooms` reference; missing scene picture → plain page.** Rejected: live filter per frame (cost on older
  tablets), a second `RoomView` in `TaskScene` (depth conflict with the notebook, would shake with the camera). Would
  change: the spike showing the capture unusable or the downscale too blocky at the visual gate.
- **Chunky helper keeps each widget's `Zone` fixed and moves only a face container; `SettingsIcon` gets a static lip
  only, `StarCounter` a pop only.** Rejected: per-widget copies; press motion on the gear (gaps 25/28/151). Would
  change: the maintainer asking for gear feedback.
- **Zero: modify Atkinson Next (one oval counter per gvar master), renamed, OFL kept.** Rejected: composite scaled `O`
  (stem contrast off), a second OFL font for U+0030 (style mismatch, second file). Would change: OTS rejecting the file
  in Chromium, or the maintainer disliking the shape at the visual gate.
- **Welcome cushion stays out (collides with "Rodzic"), sunflower in; gap 20 narrowed** (D-3's own reversal condition).
- **No burst on unlock / minigame-done cards** — scope.md says "only at the end of a round". Would change: maintainer
  request.
- Sub-agents used for discovery (3, read-only); their key anchors spot-checked locally (`ANIMATION`, `UIScene` `onStars`,
  `TaskScene` symbols, Phaser `enableFilters`).
