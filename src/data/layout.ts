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
} as const;

/** Same ivory as a CSS colour, for the page background and game config. */
export const PAGE_BACKGROUND = '#FFF5DF';

/** Font sizes in scene pixels (style guide: prompts 64, calculations 112). */
export const FONT_SIZES = {
    title: 112,
    subtitle: 48,
    caption: 32,
    prompt: 64,
    answer: 90,
    key: 58,
    keyLabel: 36,
    expression: 112,
    hint: 32,
} as const;

/** Task screen font: Atkinson Hyperlegible Next, loaded from public/fonts and precached. */
export const FONT_FAMILY = 'AtkinsonHyperlegibleNext, sans-serif';
export const FONT_KEY = 'AtkinsonHyperlegibleNext';
export const FONT_URL = 'fonts/AtkinsonHyperlegibleNext.ttf';

/** Scene keys. */
export const SCENE_KEYS = { boot: 'Boot', task: 'Task' } as const;

/**
 * Task screen geometry in scene pixels, from the art pack kit (task-tiles.png,
 * task-keypad.png). Touch targets are listed in TASK_TOUCH_TARGETS.
 */
export const TASK_LAYOUT = {
    notebook: { left: 180, top: 204, width: 1560, height: 788, border: 16, radius: 40 },
    dots: { centerX: 960, y: 96, radius: 20, gap: 62, ringWidth: 4 },
    prompt: { x: 960, y: 290, maxWidth: 1300 },
    promptBeside: { x: 620, y: 290, maxWidth: 800 },   // sentence prompts left of the keypad
    expression: { x: 560, y: 560 },          // beside the keypad
    expressionWide: { x: 960, y: 500 },      // above the tiles
    tiles: { left: 416, top: 724, width: 254, height: 136, gap: 24, radius: 28, border: 4 },
    keypad: { left: 1040, top: 342, width: 516, keyWidth: 156, keyHeight: 104, gap: 24, rowGap: 16, fieldHeight: 112, radius: 24 },
    bar: { height: 96, minWidth: 220, bottom: 960 },
    dotCount: 5,
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
} as const;

/** Placeholder frame thickness and inset, in scene pixels. */
export const PLACEHOLDER_FRAME = {
    width: 8,
    margin: 24,
} as const;
