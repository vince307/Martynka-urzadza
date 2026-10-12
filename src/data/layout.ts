// Scene geometry and placeholder colours. Scenes import these instead of
// hard-coding numbers (plan section 14: no balance numbers in scenes).

/** Base scene resolution; Phaser.Scale.FIT scales it to the viewport. */
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

/** Minimum touch target size in scene pixels (style guide: 96 px at 1920×1080). */
export const MIN_TOUCH_TARGET = 96;

/** Palette for code-drawn placeholders, taken from the approved art pack style guide. */
export const PLACEHOLDER_COLORS = {
    ivory: 0xfff5df,
    turquoise: 0x54beb4,
    deepTeal: 0x245c59,
    butter: 0xf1ce6b,
    tile: 0xe3f0d9,        // answer tile and keypad key
    correct: 0xe5f2d4,     // correct answer feedback
    hint: 0xfff0b9,        // hint and solution bar
    dotDone: 0xa6cf7f,     // finished progress dot
    pressed: 0xc9e3b8,     // pressed tile or key, a step darker than the tile
    tileBorder: 0xb9d9c9,  // idle tile outline and keypad entry field
    field: 0xffffff,       // empty keypad entry field
    fieldPlaceholder: 0x8fb0a8, // "?" in the empty entry field
    button: 0xfff2c0,      // step and hint buttons (kit .step-next, .hint-button)
    buttonBorder: 0xd8bd73,
    hintBorder: 0xd9bd73,  // outline of the yellow hint bar (kit .feedback.hint)
    next: 0xa6ddd2,        // "Dalej" and the keypad OK (kit .next-button, .key.ok)
    nextBorder: 0x397f73,
    pageButton: 0x8dd3c5,       // kit .page-button gradient (#a6ddd2 to #70c7b7), flattened to its middle
    pageButtonSecondary: 0xfff6dc, // kit .page-button.secondary gradient (#fffbee to #fff0ca), flattened
    pageButtonSecondaryBorder: 0xc0a363,
    pageButtonHighlight: 0xf1ce6b, // DESIGN-GAP (docs/design-gaps.md row 10): "Do pokoju" highlighted when a renovation task is affordable
    starEmpty: 0xeadfbe,        // a task of the summary row that paid no star
    starOutline: 0xae802c,      // kit .star-icon stroke
    ageButton: 0xeaf6df,        // kit .age-button gradient (#f8fff0 to #dceecf), flattened to its middle
    ageButtonBorder: 0xabc49b,  // kit .age-button border
    ageButtonShadow: 0xc6d8b9,  // kit .age-button box-shadow (#a4bd964d over the ivory page), flattened
} as const;

/** Deep teal as a CSS colour: every text of the task screen. */
export const TEXT_COLOR = '#245C59';

/** Same ivory as a CSS colour, for the page background and game config. */
export const PAGE_BACKGROUND = '#FFF5DF';

/** Font sizes in scene pixels (style guide: prompts 64, calculations 112). */
export const FONT_SIZES = {
    caption: 32,
    prompt: 64,
    answer: 90,
    key: 58,
    keyLabel: 36,
    expression: 112,
    bar: 36,
    barButton: 40,
    solutionLine: 44,       // kit .solution-line 42-44
    counter: 56,
    summaryTitle: 86,       // kit .page-title
    earned: 124,            // kit .earned
    pageButton: 46,         // kit .page-button
    bonusLine: 44,          // DESIGN-GAP (docs/design-gaps.md row 9): the kit has no bonus line
    brand: 62,              // kit .welcome-brand
    ageDigit: 112,          // kit .age-button
} as const;

/**
 * Font weight per text role (style guide: 650-750 for short labels, 700-750 for numerals; kit screen.css).
 * The bundled font is variable (wght 200-800), so these are real weights, not faux bold.
 */
export const FONT_WEIGHTS = {
    caption: 400,           // technical build id, not part of the kit
    prompt: 750,            // kit .prompt
    answer: 700,            // kit .answer, .entry
    key: 750,               // kit .key
    keyLabel: 750,
    expression: 750,        // kit .equation
    bar: 650,               // kit .feedback
    barButton: 750,         // kit .next-button, .step-next, .hint-button
    solutionLine: 650,      // kit .equation small
    counter: 750,           // kit .stars
    summaryTitle: 750,      // kit .page-title
    earned: 750,            // kit .earned
    pageButton: 750,        // kit .page-button
    bonusLine: 650,
    brand: 800,             // kit .welcome-brand
    ageDigit: 750,          // kit .age-button
} as const satisfies Record<keyof typeof FONT_SIZES, number>;

/** Weight range of the variable font, declared on its FontFace so canvas text uses the real weights. */
export const FONT_WEIGHT_RANGE = '200 800';

/** Task screen font: Atkinson Hyperlegible Next, loaded from public/fonts and precached. */
export const FONT_FAMILY = 'AtkinsonHyperlegibleNext, sans-serif';
export const FONT_KEY = 'AtkinsonHyperlegibleNext';
export const FONT_URL = 'fonts/AtkinsonHyperlegibleNext.ttf';

/** Scene keys. */
export const SCENE_KEYS = { boot: 'Boot', welcome: 'Welcome', task: 'Task', room: 'Room', ui: 'UI' } as const;

/** Game-level events the scenes send each other (this.game.events). */
export const GAME_EVENTS = {
    toRoom: 'to-room',   // "Do pokoju" was tapped (summary or HUD switch); the task scene switches to the room scene
} as const;

/** Keys of the game registry shared by scenes (the UI overlay listens to `changedata-<key>`). */
export const REGISTRY_KEYS = {
    stars: 'stars',
    narration: 'narration',   // text the speaker reads in the current phase, or null
    narrator: 'narrator',     // the game's Narrator (src/ui/narrator.ts), set before the scenes start
    roomSwitch: 'roomSwitch', // whether the HUD "Do pokoju" shows (roundView.switchVisible), false while the room is open
    learner: 'learner',       // the session's SessionLearner (core/placement), absent until the child has said the age
    month: 'month',           // calendar month of the session, 0-11, set once before the scenes start (main.ts)
} as const;

/**
 * Task screen geometry in scene pixels, from the art pack kit (task-tiles.png,
 * task-keypad.png). Touch targets are listed in TASK_TOUCH_TARGETS.
 */
export const TASK_LAYOUT = {
    notebook: { left: 180, top: 204, width: 1560, height: 788, border: 16, radius: 40 },
    dots: { centerX: 960, y: 96, radius: 20, gap: 62, ringWidth: 4 },
    prompt: { x: 960, y: 290, maxWidth: 1300 },
    promptBeside: { x: 620, y: 290, maxWidth: 800 },   // sentence prompts left of the keypad
    expression: { x: 620, y: 456 },          // beside the keypad: kit .equation box (left 318, width 610, top 378, 112 px x 1.4), x aligned with promptBeside
    blank: { width: 64, height: 84, lineWidth: 8, radius: 12, gap: 24 },   // drawn "□" in an expression (DESIGN-GAP 8): about one digit of the expression font; gap = a word space
    expressionWide: { x: 960, y: 500 },      // above the tiles
    // tiles.top and bar.bottom sit 12 px higher than the kit so the bar keeps 16 px from the tiles and the notebook border.
    tiles: { left: 416, top: 712, width: 254, height: 136, gap: 24, radius: 28, border: 4 },
    keypad: { left: 1040, top: 342, width: 516, keyWidth: 156, keyHeight: 104, gap: 24, rowGap: 16, fieldHeight: 112, radius: 24 },
    bar: { height: 96, minWidth: 220, bottom: 960, radius: 24, padding: 24, border: 4, hintBorder: 3 },
    barSpan: { tiles: { x: 355, width: 1270 }, keypad: { x: 310, width: 710 } },   // under tiles / left of the keypad
    solution: { lineGap: 8, topGap: 16, minScale: 0.6, bottomGap: 12 },
    // Star counter top right (kit correct.png): ivory pill with a butter border, star and number.
    starCounter: { left: 1622, top: 46, width: 196, height: 100, radius: 28, border: 4, starRadius: 30, starGap: 20 },
} as const;

/**
 * HUD speaker button (kit screen.css .speaker / .hud button): 104 px square left of the star counter,
 * same ivory-to-butter fill, 5 px border and 32 px radius as the kit HUD buttons.
 * left = starCounter.left - 24 (kit HUD gap) - width.
 */
export const HUD_LAYOUT = {
    speaker: { left: 1494, top: 44, width: 104, height: 104, radius: 32, border: 5, fill: 0xfffdf2, pressed: 0xfff0cc, borderColor: 0xd3b77d, iconSize: 56 },
    // "Do pokoju" between tasks (FR-011), top left; same look as the speaker, a house icon and the label.
    roomSwitch: { left: 104, top: 44, width: 316, height: 104, radius: 32, border: 5, iconSize: 56, iconGap: 14 },
} as const;

/**
 * Round summary (kit summary.png, screen.css .page-title, .summary-star-row, .earned, .page-buttons, .page-button):
 * title, a row of one star per task, "star +N" and two page buttons, on the notebook.
 */
export const SUMMARY_LAYOUT = {
    title: { x: 960, y: 290 },                                  // kit .page-title: top 290, centred between left 310 and right 280 (about 975)
    stars: { left: 656, top: 420, gap: 26, size: 98, outline: 3 },
    earned: { centerX: 960, top: 578, starSize: 114, gap: 28 }, // kit .earned: 600 wide box at left 660, 124 px line
    bonus: { x: 960, y: 722 },                                  // DESIGN-GAP (docs/design-gaps.md row 9): below "+N", only with the clean-round bonus
    buttons: { left: 454, top: 816, gap: 36, width: 450, height: 128, radius: 32, border: 5, highlightBorder: 9 },
} as const;

/**
 * Welcome screen (kit welcome.png, screen.css .welcome-brand, .page-title, .age-buttons, .age-button): the brand,
 * the question and one square button per age on the notebook. The brand and question centre on x 960 (kit: left/right insets).
 * DESIGN-GAP (docs/design-gaps.md): the kit's sunflower and cushion (welcome-flower, welcome-cushion) wait for the art of S-16.
 */
export const WELCOME_LAYOUT = {
    brand: { x: 960, y: 64 },
    question: { x: 960, y: 290 },
    ages: { left: 363, top: 526, width: 218, height: 190, gap: 28, radius: 38, border: 5, shadow: 10 },
} as const;

/** Room scene placeholder (S-09 brings the real room): a floor panel with a caption and the way back to the notebook. */
export const ROOM_LAYOUT = {
    panel: { left: 180, top: 204, width: 1560, height: 840, radius: 40 },
    caption: { x: 960, y: 520 },
    resume: { left: 720, top: 892, width: 480, height: 116, radius: 32, border: 5 },   // kit .return-note button, DESIGN-GAP (docs/design-gaps.md row 12)
} as const;

/** Interactive rectangles of the HUD overlay, checked against MIN_TOUCH_TARGET. */
export const HUD_TOUCH_TARGETS = {
    speaker: { width: HUD_LAYOUT.speaker.width, height: HUD_LAYOUT.speaker.height },
    roomSwitch: { width: HUD_LAYOUT.roomSwitch.width, height: HUD_LAYOUT.roomSwitch.height },
} as const;

/** Interactive rectangle of the welcome screen, checked against MIN_TOUCH_TARGET. */
export const WELCOME_TOUCH_TARGETS = {
    age: { width: WELCOME_LAYOUT.ages.width, height: WELCOME_LAYOUT.ages.height },
} as const;

/** Every interactive rectangle of the task screen, checked against MIN_TOUCH_TARGET. */
export const TASK_TOUCH_TARGETS = {
    tile: { width: TASK_LAYOUT.tiles.width, height: TASK_LAYOUT.tiles.height },
    key: { width: TASK_LAYOUT.keypad.keyWidth, height: TASK_LAYOUT.keypad.keyHeight },
    barButton: { width: TASK_LAYOUT.bar.minWidth, height: TASK_LAYOUT.bar.height },
    pageButton: { width: SUMMARY_LAYOUT.buttons.width, height: SUMMARY_LAYOUT.buttons.height },
    resume: { width: ROOM_LAYOUT.resume.width, height: ROOM_LAYOUT.resume.height },
} as const;

/** Animation durations in milliseconds. */
export const ANIMATION = {
    shakeMs: 360,
    shakeDistance: 14,
    starFlightMs: 850,
    starPopMs: 150,        // the flying star grows first, then travels
    starPopScale: 1.6,
    starStartLift: 116,    // the star starts above the tapped tile (half a tile + popped star) so the answer stays readable
} as const;

/** Inset of the build id in the screen corner, in scene pixels. */
export const PLACEHOLDER_FRAME = {
    margin: 24,
} as const;
