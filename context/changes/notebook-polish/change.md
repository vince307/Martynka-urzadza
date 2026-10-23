---
change_id: notebook-polish
title: Notebook polish (finished maths-A notebook, chunky controls, interface life, plain zero)
status: impl_reviewed
created: 2026-10-22
updated: 2026-10-23
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** maintainer request 2026-10-22, recorded in
`context/runs/2026-10-22-notebook-polish/scope.md` (finish the approved notebook design of the maths-A pack, add
interface life from the review of children's apps, a zero without a slash). Autonomous run
`2026-10-22-notebook-polish`, its only slice `fix:notebook-polish`; branch `feat/notebook-polish` cut from `main` at
`6e426ed`. No roadmap block and no roadmap status edits. Out of scope (scope.md): the guide mascot (PRD FR-037, PR #98)
and any street/houses work (PRD FR-032–FR-036).

**Save format and storage.** No migration and no save change is expected: `SAVE_VERSION` stays **4**
(`src/core/save.ts`), `SAVE_KEYS` (`src/data/layout.ts`) unchanged, nothing new in IndexedDB or `localStorage`. The
blurred salon behind the notebook only *reads* the runtime registry (`REGISTRY_KEYS.rooms`, `REGISTRY_KEYS.currentRoom`);
animations and the font are presentation only. A change that would need v5, a stored field or a balance/curriculum/content
edit is outside the run's hard limits (scope.md) and stops at an open PR.

**Hard limits (scope.md):** no game logic, balance, curriculum, content, save or storage change; no new raster art
(drawn in code or built from files already in `public/`); child targets stay ≥ 96 px (`MIN_TOUCH_TARGET`) in the
1920 × 1080 scene; all new motion off under `prefersReducedMotion()` (`src/ui/motion.ts`); a wrong answer never turns
red, never shakes hard, never removes stars.

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

**Content rule:** no change to `src/data/curriculum/`, `wordTemplates.ts`, generators or task copy is planned, so no
teacher read is due; new or changed geometry/colour/motion tokens live in `src/data/layout.ts` (`balance.ts` untouched).
If a step adds player-facing text (none expected), it goes to `src/data/pl.ts`.

## Scope claims re-verified against the repo (branch `feat/notebook-polish` at `6e426ed`)

| scope claim | repo now (symbols) | correction |
|---|---|---|
| "the game draws a flat ivory card with a turquoise frame on a plain page colour" | confirmed: `drawNotebook` (`src/ui/widgets/notebook.ts`) fills two rounded rects (`PLACEHOLDER_COLORS.turquoise` outer, `ivory` inner) from `TASK_LAYOUT.notebook` (left 180, top 204, 1560 × 788, border 16, radius 40); the page behind it is the game's `backgroundColor: PAGE_BACKGROUND` (`#FFF5DF`, `src/main.ts`). Called by `TaskScene.create` and `WelcomeScene.create` only | kit `.surface`: radius **44** (game 40), border colour **`#54b5a9`** (game uses the palette turquoise `#54BEB4`), ivory face is a gradient `115deg #fffbef → #fff5df`. Small geometry/colour drift to fix with the rest |
| kit has "a blurred room behind the notebook" (task, summary, unlock, welcome) | not drawn today: nothing behind the notebook but `PAGE_BACKGROUND`. Kit: `.stage:before` = `assets/room.png` cover, `filter: blur(5px)`, then `.stage:after` ivory `#fff5df99` (60 %) wash | scope asks for the child's CURRENT salon, not the kit's static `room.png` (pre-agreed). The layers exist: `RoomView.render(room, state, preview)` (`src/ui/widgets/RoomView.ts`) draws the salon from `ROOMS` + `RoomState` through `RoomLayer`; room art is loaded at boot (`src/data/roomArt.ts`, `BootScene`). Renderer is `AUTO` (`src/main.ts`): blur needs Phaser 4 filters on WebGL; a Canvas fallback has none → plain page colour (research). TaskScene is put to sleep by `scene.switch` to the room, so a purchase must refresh the backdrop on wake (research) |
| "a spine with stitch marks on the left" | absent | kit `.surface:before` is **stitch marks only, no spine band**: a 26 px wide column 40 px inside the left border, from 20 px above to 20 px below the notebook, dashes 10 px tall every 100 px (`#bfa577`), soft drop shadow `2px 3px 1px #6d57382b`. Draw exactly that; a separate spine band would be invented |
| "a thin margin line" | absent | kit `.surface:after`: 2 px, `#e4ceb2`, 92 px from the inner left edge, 38 px from top and bottom |
| "the butter bookmark ribbon top right" | absent | kit `.ribbon`: 48 × 74, 92 px from the right, top −16 (over the border), `--yellow` (`#F1CE6B`, `PLACEHOLDER_COLORS.butter`), notched bottom (`polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)`) |
| "a thicker bottom edge (darker turquoise) and a soft lower-right shadow" | absent | kit `.surface` box-shadow: `0 12px 0 #328476` (a 12 px darker-teal bottom edge) **and** `0 22px 36px #56473030` (soft shadow straight down, not offset right). The style guide's prose says "soft lower-right shadow" and code-drawn helpers use "4 px offset, ~8 px blur" — the screenshots show a downward shadow; follow the CSS/screenshots |
| "answer tiles … buttons with a darker bottom lip" (all chunky controls) | **partly present already**: `AnswerTiles.paint` draws a lip (`dotDone` at 50 %, 8 px), `Keypad.paintButton` (6 px), `AgeButton.draw` (`ageButtonShadow`, `WELCOME_LAYOUT.ages.shadow` 10). **No lip**: `PageButton` (summary, unlock "Dalej", welcome "Rodzic", "Wróć"), `ActionButton` ("Dalej", "Podpowiedź", "Pokaż kroki", step buttons), `SpeakerButton`, `RoomSwitchButton`, `StarCounter`, `SettingsIcon` | kit lips per control: `.answer` `0 8px 0 #a4bd9670`; `.key` `0 5px 0 #a4bd9650` (game 6); `.age-button` `0 10px 0 #a4bd964d`; `.page-button` `0 8px 0 #397f7330`; HUD `0 7px 0 #8f6d3d25`. `.hint-button` and `.next-button` have **no** lip in the kit → their lip is a DESIGN-GAP (scope asks for it) |
| "a press moves the face down onto the lip (~80 ms) and the release returns with a Back overshoot (~150 ms)" | today a press only repaints the face (`PLACEHOLDER_COLORS.pressed`, `HUD_LAYOUT.speaker.pressed`); no motion. `ActionButton` fires on `pointerdown`, tiles on `pointerdown` (`AnswerTiles.press`, highlight "synchronous: before any tween"), page/age/HUD buttons on `pointerup` | kit motion is only `button:active{transform:translateY(2px)}` — the lip travel and the Back overshoot are beyond the kit → DESIGN-GAP. The press must not delay the existing fire moment (tiles/keys/ActionButton on down, others on up) nor move the hit zone (e2e aims at zone centres) |
| HUD: "Do pokoju", speaker and star counter "as pills with the same lip" | `SpeakerButton`/`RoomSwitchButton`: `HUD_LAYOUT.speaker` fill `#fffdf2`, border 5 `#d3b77d`, radius 32 — kit colours, flat fill, no lip. `StarCounter`: butter border 4 and ivory fill, height 100 | kit `.hud button,.stars`: gradient `#fffdf2 → #fff0cc`, border 5 `#d3b77d`, radius 32, `min-height 104`, lip `0 7px 0 #8f6d3d25`. The star counter differs from the kit today (butter border 4, height 100) — align it with the HUD pill |
| "Wróć" and the settings gear restyled to match (kit has no style) | "Wróć" = a secondary `PageButton` in the left margin (`TASK_LAYOUT.ageBack`, DESIGN-GAP 152); gear = `SettingsIcon` in the speaker's colours, no feedback while held (DESIGN-GAP 25, 28, 151) | confirmed no kit style → DESIGN-GAP rows (new, plus updates of 25/152). The gear must stay feedback-free while held (row 28) unless research shows the restyle needs otherwise; its long press (`src/core/longPress.ts`) is untouched |
| Correct answer: "the tile/answer box turns green, one bounce, the existing flying star goes to the counter and the counter pops when it lands" | **green already**: `AnswerTiles.markCorrect` paints `PLACEHOLDER_COLORS.correct` + `dotDone` border; `Keypad` field turns `correct`. **Flying star exists**: `TaskScene.flyStar` (pop to 1.6 then 850 ms to `starCounterTarget`, off under reduced motion) — kit `fly 850ms`. No bounce; the counter (`StarCounter.setValue`, via `changedata-stars` in `UIScene`) shows the new total **at once**, before the star lands | new: the bounce and the counter pop (DESIGN-GAP: kit has only the flight). The counter value must keep changing at once (e2e reads the drawn counter, `src/testing/e2eHook.ts`); only the pop waits for the landing. Select/drag/dice answers have their own "answer box" (OK of `SelectTiles`, `BlockMat`, `CoinWallet`, `ClockSet`, `CoverBoard`) — research lists which one bounces |
| Wrong answer: "a gentle think wobble instead of the current shake; no red" | confirmed: `TaskScene.shake` tweens the **main camera** `scrollX` ±`ANIMATION.shakeDistance` (14 px), 360 ms, 3 swings — the whole notebook moves; off under reduced motion; no red anywhere (hint is yellow `PLACEHOLDER_COLORS.hint`) | the wobble targets the answered tile/box, not the camera; kit has no wrong-answer motion → DESIGN-GAP |
| "Progress: the round dots become larger beads that fill with a pop" | `ProgressDots.update` redraws one `Graphics`: radius 20 (kit 40 px dot), gap 62; done = `dotDone` fill, current = turquoise with ivory ring, future = ivory with a `dotDone` ring; no motion | kit `.dot`: future border 4 `#9cb8a0` on `#fff8e5`; current teal with `#245c59` border and a 7 px ivory ring; done `#a6cf7f` with `#547e3d` border — today's colours drift. Larger beads + pop exceed the kit → DESIGN-GAP (row 18 neighbours); the HUD title (`HudTitle`) replaces the dots in variants |
| "Entrance: tiles/keys enter with a 200–400 ms ease-out stagger" | none: `AnswerTiles.setChoices` / `Keypad` draw at final position at once | DESIGN-GAP (kit has no entrance). Input must be live at once or after the stagger in a way e2e and the "first try" rule tolerate (research) |
| Summary: "earned stars pop in one by one; a bigger burst only at the end of a round" | `SummaryPanel.show` draws the whole star row and "★ +N" at once; no motion. A star burst exists only in `RoomScene` (purchase particles, `ANIMATION.purchaseParticles`) | DESIGN-GAP (kit summary is static). "End of a round" = the ordinary/warm-up summary; minigame done card (`MinigameDoneCard`) and unlock card are research's call |
| "The bundled Atkinson Hyperlegible Next has only a slashed zero (`zero`, `zero.tf`; no alternate feature)" | confirmed with fontTools on `public/fonts/AtkinsonHyperlegibleNext.ttf`: glyphs `zero`, `zero.tf` only; GSUB features `aalt case ccmp frac locl ordn pnum sups tnum` (no `zero`/`ss0x`); variable `wght` axis; name "Atkinson Hyperlegible Next", Version 2.001. Loaded from `FONT_URL` `fonts/AtkinsonHyperlegibleNext.ttf` (`FONT_KEY`, `FONT_FAMILY` in `src/data/layout.ts`), health in `REGISTRY_KEYS.fontHealth` | the kit **approved** the slashed zero (style-guide "Its slashed zero … visible in the preview"; screenshots show `0`) — the maintainer's plain zero overrides the kit (DESIGN-GAP row recording the override). `public/fonts/OFL.txt`'s copyright line declares **no Reserved Font Name**, so the OFL does not force a rename; renaming a modified copy is still the OFL FAQ's advice and avoids clashing with an installed original (research decides). The deploy smoke checks the precache (`scripts/deploy-check/parse.ts`); a new/renamed font file must be precached (`ttf`/`woff2` globs) and in `FONT_URL` |
| Welcome (no learner yet) "may use the salon's initial state" | `WelcomeScene.create` draws `drawNotebook`, brand, question, `AgeButton`s, "Rodzic" `PageButton`, build id. Room art is loaded by `BootScene` before `WelcomeScene` | kit welcome also has the sunflower and cushion (`assets/icons/flower.png`, `cushion.png`) — DESIGN-GAP 20 left them out "waiting for art"; the same icons are now in `public/assets/tasks/icons/flower.webp`, `cushion.webp` (`TASK_ART`), so the kit view can be completed without new raster art (decision D-3) |

## Design kit views and details this change binds (profile § 6)

Source of truth: `designs/martynka-maths-A-v1/screenshots/{task-keypad,task-tiles,summary,unlock,welcome}.png`
(1920 × 1080), `screen.css`, `maths.css`, `style-guide.md` ("A — Przytulny notes"). The kit is read-only.

- **All five views — page and notebook:** `.stage:before/:after` (blurred room 5 px + ivory `#fff5df99` wash);
  `.surface` (left 180, top 204, 1560 × 788, border 16 `#54b5a9`, radius 44, face gradient `#fffbef → #fff5df`,
  bottom edge `0 12px 0 #328476`, shadow `0 22px 36px #56473030`); `.surface:before` stitch marks; `.surface:after`
  margin line; `.ribbon` bookmark. Welcome, summary and unlock use the same notebook (screenshots).
- **task-keypad.png / task-tiles.png:** `.answer` (136 high, border 5 `#c1d9b7`, radius 30, gradient
  `#f9fff1 → #e3f0d9`, lip 8 px), `.key` (104, border 4 `#c6d8c0`, radius 24, lip 5 px), `.key.delete` ("kasuj"
  `#fff1cb`/`#d4bd85`), `.key.ok` (`#a6ddd2 → #70c7b7`, `#397f73`), `.hint-button` (`#fff2c0`, border 4 `#d8bd73`,
  radius 26), `.dot`/`.dot.current`/`.dot.done`, HUD `.hud button`, `.stars`, `.room-button` (316 wide).
- **correct.png / second-try.png / hint-*.png** (states of the same views): `.feedback.correct` `#e5f2d4`,
  `.feedback.hint` `#fff0b9` + border 3 `#d9bd73`, `.next-button` (`#a6ddd2`, border 4 `#397f73`, radius 26),
  `.flying-star` (`fly 850ms ease-in-out`, `none` under reduced motion).
- **summary.png:** `.summary-star-row` (98 px stars, gap 26), `.earned` (114 px star, 124 px "+N"),
  `.page-button` (450 × 128, border 5 `#397f73`, radius 32, lip 8 px) and `.page-button.secondary`.
- **unlock.png:** `.unlock-card` on the notebook, `.page-button` "Dalej" 450 × 108.
- **welcome.png:** `.welcome-brand`, `.page-title`, `.age-button` (218 × 190, lip 10 px), `.welcome-flower`
  (152 px, −14°), `.welcome-cushion` (160 px, +12°).
- **Kit motion:** only `button:active{transform:translateY(2px)}` and the star `fly`. Everything else of Step 2 is
  beyond the kit.

### DESIGN-GAPs (kit has no view; never invented beyond the maintainer's words — rows in `docs/design-gaps.md`, next free number **155**)

| gap | what the maintainer asked (scope.md) | rows touched |
|---|---|---|
| Blurred backdrop = the child's current salon, not the kit's `room.png`; Canvas fallback | Step 1 | new |
| Lip on "Dalej" / "Podpowiedź" / "Pokaż kroki" (`.next-button`, `.hint-button` have none in the kit) | Step 1 | new |
| Press-down onto the lip (~80 ms) + Back overshoot release (~150 ms) (kit: `translateY(2px)` only) | Step 1 | new |
| "Wróć" restyle | Step 1 | update 152 |
| Settings gear restyle (HUD pill + lip; still no feedback while held) | Step 1 | update 25 (and 28 if its "no feedback" changes) |
| Correct bounce (1 → 1.12 → 1) and the counter pop on landing | Step 2 | new |
| Wrong-answer "think" wobble replacing the camera shake | Step 2 | new |
| Larger beads with a fill pop (kit dots 40 px) | Step 2 | new (row 18 stays for the sixth dot) |
| Entrance stagger of tiles/keys (200–400 ms ease-out) | Step 2 | new |
| Summary stars pop one by one; bigger burst at the round end | Step 2 | new |
| Plain zero overrides the kit's approved slashed zero; the font source | Step 3 | new |
| Welcome sunflower and cushion from the existing icons | (kit-bound; D-3) | close 20 |

## Open follow-ups whose trigger names this area

Swept all 38 `context/archive/*/follow-ups/review-fixes.md`; open items whose trigger (or subject) names the notebook,
task-screen visuals, buttons, HUD, animations or the font. Closed items and pure content/wording items left out.

| follow-up (archive) | trigger | take |
|---|---|---|
| Slashed zero in the task font (V3) — `2026-10-16-final-art-p2` (earlier copies `2026-10-12-task-round-stars`, `2026-10-15-final-art-salon`) | the maintainer asks for a plain 0 or delivers a font | **Fires — in scope** (PA-10); closed by Step 3 |
| Shared HUD button for `SpeakerButton`/`RoomSwitchButton` (frame, press guard, icon numbers) — `2026-10-12-narrator-round-summary` (repeated in `first-furniture-purchase`) | S-09 or the next change to a HUD button | **Fires — in scope** (PA-4 restyles every HUD pill; D-2 shared lip/press helper); closed by this change |
| Bare animation/stroke numbers in widgets (`lineStyle(3/4)`, `shakeMs / 6`) — `2026-10-12-narrator-round-summary` | S-06 (fired long ago, never done) | **In scope where touched** (D-2 tokens): the shake is replaced, touched widgets read layout tokens; untouched widgets stay out |
| Star in flight on "Do pokoju" freezes while `TaskScene` sleeps — `2026-10-12-narrator-round-summary` | the next change to the star flight in `TaskScene` | **Fires** (counter pop on landing). `TaskScene.endFlyingStars` already ends stars on the switch; research confirms it is closed and that the landing pop does not fire on a killed star |
| Flying star starts over the "9" key (keypad, `ANIMATION.starStartLift`) — `2026-10-12-task-round-stars` | next change to `flyStar` | **Fires**; research/plan decide (cheap start-point fix in the same edit) — otherwise re-recorded |
| `StarCounter` value never asserted — `2026-10-12-task-round-stars` | S-05 (round summary touches the counter) | likely closed (the e2e hook exposes the drawn counter, `src/testing/e2eHook.ts`); research confirms since `StarCounter` changes (D-5 keeps the value immediate) |
| FontFace load has no time limit of its own — `2026-10-20-audit-boot-hidden-tab` (copies in salon-load-health, final-art-p2, health-lines-and-smoke #10); A-7 failing font load ends as COMPLETE — `2026-10-15-load-and-tab-guard` | the next change to the font load in `BootScene` / A-7 taken up | **Fires only if Step 3 changes the font load** (new file/family in `BootScene`); research decides; if the load path changes, the plan takes the time limit or re-records both |
| Solution step indicator dots (kit `.step-indicator`) — `2026-10-12-narrator-round-summary` (copies) | the next change to `SolutionSteps` | conditional: fires only if the lip/press helper is wired into `SolutionSteps`' buttons; then re-recorded (kit-bound but outside scope.md) |
| `SelectTiles` toggles on `pointerdown`, no pressed state — `2026-10-13-drawn-widget-tasks-e3-e4`; check mark on big figures — `2026-10-15-e1-shapes-picture-mode` | tablet row 9.8 report / next change to `SelectTiles` | the second fires if `SelectTiles` gets the lip/press; out of scope (re-record); the press visual must keep the down-toggle |
| FeedbackBar text 36 px vs kit 34 / ~19 CSS px on a tablet — `2026-10-12-task-round-stars` | visual gate or iPad check finds the bar unreadable | not fired unless this change's visual gate finds it; checked there |
| Stage cross-fade / pop / particles not stopped on sleep — `2026-10-15-final-art-salon` F1, `2026-10-16-salon-extra-slots` L-R8/L-R11 | the next change to `RoomScene` (`fadeStage`, `celebrate`, `onSleep`) | conditional: fires only if the backdrop work edits `RoomScene` (D-4 prefers reusing `RoomView` without touching it); then in scope for the sleep handler |
| Settings hint timing — `2026-10-20-playtest-fixes-f01-f03`, `2026-10-21-post-run-polish` N-5; `UIScene` long-press state F5 — `2026-10-13-parent-settings-progress` | playtest note / new overlay calling `suspend()` | not fired (the gear restyle changes drawing only, not the hint or the hold); out |
| "Wróć" leaves no trace (N-2) — `2026-10-21-post-run-polish` | next change to `TaskScene.backToAge` / `ageBackOffered` | not fired (restyle only, `PageButton`); out |
| Wallet-shake cue, `= ?` copy, blank spacing, thermometer tiles low, prompt wraps, review-round HUD title, digit-box nudge, unlock fallback wording | tablet tests, S-17, kit views, content changes | not fired; out |

## Autonomous decisions

Pre-agreed by the maintainer 2026-10-22 (`context/runs/2026-10-22-notebook-polish/scope.md`; they override skill
recommendations, the kit where they differ, and earlier plan text):

- **PA-1 (backdrop)** — behind the notebook on task, summary, unlock and welcome: a blurred, dimmed view of the child's
  CURRENT salon (her bought pieces and variants, the same layers the room screen draws); missing room art → the plain
  page colour as today; welcome may use the salon's initial state. Pre-agreed by the maintainer 2026-10-22.
- **PA-2 (notebook)** — stitch marks on the left, thin margin line, butter bookmark top right, thicker darker-turquoise
  bottom edge, soft shadow, as in the kit screenshots. Pre-agreed by the maintainer 2026-10-22.
- **PA-3 (chunky controls)** — answer tiles, keypad keys, OK, "kasuj", "Dalej", "Podpowiedź"/"Pokaż kroki", summary
  buttons, age buttons get a darker bottom lip; press moves the face onto the lip (~80 ms), release returns with a Back
  overshoot (~150 ms). Pre-agreed by the maintainer 2026-10-22.
- **PA-4 (HUD)** — "Do pokoju", speaker, star counter as pills with the same lip; "Wróć" and the gear restyled to match,
  DESIGN-GAP rows. Pre-agreed by the maintainer 2026-10-22.
- **PA-5 (correct)** — tile/answer box green, one bounce 1 → 1.12 → 1, existing flying star to the counter, counter pops
  on landing. Pre-agreed by the maintainer 2026-10-22.
- **PA-6 (wrong)** — gentle slow "think" wobble instead of the shake; no red. Pre-agreed by the maintainer 2026-10-22.
- **PA-7 (progress)** — dots become larger beads that fill with a pop. Pre-agreed by the maintainer 2026-10-22.
- **PA-8 (entrance)** — tiles/keys enter with a 200–400 ms ease-out stagger. Pre-agreed by the maintainer 2026-10-22.
- **PA-9 (summary)** — earned stars pop in one by one; a bigger burst only at the end of a round. Pre-agreed by the
  maintainer 2026-10-22.
- **PA-10 (zero)** — a plain school "0" by an OFL-compliant route (modified font renamed, or a second local OFL font for
  digits), keeping Polish diacritics, 1/7 and 0/O legibility, loaded locally and precached, deploy smoke green.
  Pre-agreed by the maintainer 2026-10-22.
- **PA-11 (limits)** — no logic/balance/curriculum/content/save/storage change (save v4); no new raster art; targets
  ≥ 96 px; new motion off under `prefersReducedMotion()`; wrong answers never red, never a hard shake, never remove
  stars. Pre-agreed by the maintainer 2026-10-22.
- **PA-12 (out of scope)** — guide mascot (FR-037, PR #98) and street/houses (FR-032–FR-036). Pre-agreed by the
  maintainer 2026-10-22.
- **PA-13 (how far)** — stop at an open PR; the maintainer reviews the visual change and merges on "merguj".
  Pre-agreed by the maintainer 2026-10-22.

Agent decisions in this step (research/plan may refine, never contradict PA-*):

- **D-1 the kit's CSS beats the prose where they differ.** Chosen: geometry and colours from `screen.css`/screenshots
  (stitch marks only — no spine band; shadow straight down `0 22px 36px`; notebook border `#54b5a9`, radius 44; HUD
  pill gradient for the star counter too). Rejected: a drawn spine band and a lower-right offset shadow (scope prose /
  style-guide prose) — the approved screenshots show neither. Would change: the maintainer, at the visual gate,
  asking for a visible spine band or an offset shadow.
- **D-2 tokens before pixels.** Chosen: every new colour, size, duration and easing lives in `src/data/layout.ts`
  (`PLACEHOLDER_COLORS`, `TASK_LAYOUT.notebook`, a new notebook/lip/motion block next to `ANIMATION`), scenes and
  widgets read them; the lip and the press motion are one shared helper in `src/ui/widgets/` used by every chunky
  control, not copied per widget. Any pure timing/sequence rule (stagger delays, summary pop order) goes to `src/core/`
  with unit tests. Rejected: per-widget magic numbers. Would change: research showing a control whose drawing cannot
  share the helper (then a documented exception).
- **D-3 welcome sunflower and cushion.** Chosen: in scope — the kit's welcome view binds them, the art already exists
  (`flower.webp`, `cushion.webp` in `TASK_ART`), so DESIGN-GAP 20 can close without new raster art; a missing texture
  simply leaves them out (no stand-in box on the welcome). Rejected: leaving gap 20 open (the scope asks for the notebook
  "as in the kit screenshots" for welcome). Would change: research finding the icons are not loaded before
  `WelcomeScene` or that they collide with the "Rodzic" button (`WELCOME_LAYOUT.parent` sits where the kit has the
  cushion) — then the cushion stays out and row 20 is narrowed, not closed.
- **D-4 backdrop renderer and fallback.** Chosen: research decides between a Phaser 4 blur filter on a room container
  / camera and a pre-rendered blurred texture (`RenderTexture`/`DynamicTexture`) refreshed when the room changes; under
  the Canvas renderer, or when any salon layer texture is missing, the plain `PAGE_BACKGROUND` stays (PA-1). Rejected:
  the kit's static `room.png` (not in `public/`, and PA-1 wants her own salon). Would change: a tablet frame-time
  measurement showing the live blur too slow (then the pre-rendered texture is mandatory).
- **D-5 e2e stability.** Chosen: no motion may move a hit zone's centre at rest, delay an answer's effect on state, or
  delay the drawn star counter value; the e2e hook keeps reading the same values. Entrance stagger and press motion
  are visual only (zones placed at their final rects immediately). Rejected: gating input until the entrance ends
  (would change first-try timing and e2e). Would change: research finding an e2e spec that screenshots mid-animation.
- **D-6 the font route is research's job.** Chosen: research compares (a) a modified Atkinson Hyperlegible Next with
  an unslashed zero, renamed (e.g. a family name without "Atkinson Hyperlegible") with the OFL and a modification note,
  and (b) a second local OFL font for digits only via `unicode-range`/fallback; criteria from PA-10 plus file size,
  the variable `wght` axis (650–750 used), the tablet render and the build/precache/smoke path. Rejected: deciding now
  without measuring. Would change: nothing pre-set.
- **D-7 next step.** `/10x-research` (not `/10x-plan`): three steps across ~15 widgets, three scenes, the Phaser 4 filter
  API, the font tooling and the e2e hook need source-backed findings before a plan.
