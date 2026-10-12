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
} as const satisfies Record<keyof typeof FONT_SIZES, number>;

/** Weight range of the variable font, declared on its FontFace so canvas text uses the real weights. */
export const FONT_WEIGHT_RANGE = '200 800';

/** Task screen font: Atkinson Hyperlegible Next, loaded from public/fonts and precached. */
export const FONT_FAMILY = 'AtkinsonHyperlegibleNext, sans-serif';
export const FONT_KEY = 'AtkinsonHyperlegibleNext';
export const FONT_URL = 'fonts/AtkinsonHyperlegibleNext.ttf';

/** Scene keys. */
export const SCENE_KEYS = { boot: 'Boot', task: 'Task', ui: 'UI' } as const;

/** Keys of the game registry shared by scenes (the UI overlay listens to `changedata-<key>`). */
export const REGISTRY_KEYS = {
    stars: 'stars',
    narration: 'narration',   // text the speaker reads in the current phase, or null
    narrator: 'narrator',     // the game's Narrator (src/ui/narrator.ts), set before the scenes start
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
} as const;

/** Interactive rectangles of the HUD overlay, checked against MIN_TOUCH_TARGET. */
export const HUD_TOUCH_TARGETS = {
    speaker: { width: HUD_LAYOUT.speaker.width, height: HUD_LAYOUT.speaker.height },
} as const;

/** Every interactive rectangle of the task screen, checked against MIN_TOUCH_TARGET. */
export const TASK_TOUCH_TARGETS = {
    tile: { width: TASK_LAYOUT.tiles.width, height: TASK_LAYOUT.tiles.height },
    key: { width: TASK_LAYOUT.keypad.keyWidth, height: TASK_LAYOUT.keypad.keyHeight },
    barButton: { width: TASK_LAYOUT.bar.minWidth, height: TASK_LAYOUT.bar.height },
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
