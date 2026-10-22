# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-new` step of run 2026-10-22-notebook-polish: the change identity exists, every scope.md claim about
the current code is checked against the repo, the kit views and DESIGN-GAPs are named. The next agent must not treat the
scope's prose as the kit: where they differ, `change.md` records the kit CSS value (D-1) and the maintainer's
pre-agreed decisions (PA-1..PA-13) override the kit.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish`, cut from `main` at `6e426ed` |
| Commits | 1 on the branch after this step (`docs(notebook-polish): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/notebook-polish/change.md` | change identity: Notes (source, save v4 unchanged, limits), scope claim / repo now / correction table, kit views bound, DESIGN-GAP list (next free row 155), triggered follow-ups, Autonomous decisions (PA-1..PA-13 pre-agreed, D-1..D-7) |
| `context/changes/notebook-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/notebook-polish` |
| fontTools on `public/fonts/AtkinsonHyperlegibleNext.ttf` | glyphs `zero`, `zero.tf` only; GSUB `aalt case ccmp frac locl ordn pnum sups tnum`; `wght` axis; v2.001 |
| `ls context/foundation/lessons.md` | absent |
| `grep SAVE_VERSION src/core/save.ts` | `4` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline in the agent contract stays the reference) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-research notebook-polish`

## 5. Open

- Research questions (from `change.md`): Phaser 4 blur API and Canvas fallback for the salon backdrop, and how it
  refreshes after a purchase while `TaskScene` sleeps (D-4); one shared lip/press helper across `AnswerTiles`, `Keypad`,
  `ActionButton`, `PageButton`, `AgeButton`, HUD pills (D-2); which "answer box" bounces in select/drag/dice modes;
  e2e specs sensitive to motion or the counter timing (D-5, `src/testing/e2eHook.ts`); the font route (D-6) and whether
  it touches the font load in `BootScene` (fires the FontFace time-limit follow-ups); welcome sunflower/cushion against
  `WELCOME_LAYOUT.parent` (D-3).
- DESIGN-GAP rows to add in `docs/design-gaps.md` (from 155) and to update (18 kept, 20 close, 25, 152): listed in
  `change.md` § DESIGN-GAPs. None written yet.
- Follow-ups that fire: slashed zero (closed by Step 3), shared HUD button, star flight (`TaskScene.flyStar`,
  `endFlyingStars`), bare animation numbers; conditional ones listed in `change.md` § Open follow-ups.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **Next step `/10x-research` instead of the skill's default `/10x-plan`.** Why: three steps over ~15 widgets, three
  scenes, a renderer feature and font tooling. Would change: nothing; the step prompt fixes it.
- **No AskUserQuestion; the scope.md items recorded as PA-1..PA-13 "pre-agreed by the maintainer 2026-10-22".**
- **D-1 kit CSS beats the prose** (stitch marks without a spine band, downward shadow, `#54b5a9`, radius 44). Would
  change: the maintainer asking for a spine band or offset shadow at the visual gate.
- **D-3 welcome sunflower and cushion in scope** from existing `flower.webp`/`cushion.webp` (closes gap 20). Would
  change: a collision with the "Rodzic" button or the icons not loaded before `WelcomeScene`.
- **D-5 motion never moves resting hit zones, delays state, or delays the counter value.** Would change: an e2e spec
  that screenshots mid-animation.
- Other decisions (D-2 tokens/shared helper, D-4 backdrop route, D-6 font route left to research, D-7): see
  `change.md` § Autonomous decisions, each with its reversal condition.
- Clipboard copy of the next command (skill step) skipped: unattended run.
