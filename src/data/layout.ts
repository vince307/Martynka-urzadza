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
} as const;

/** Same ivory as a CSS colour, for the page background and game config. */
export const PAGE_BACKGROUND = '#FFF5DF';

/** Font sizes in scene pixels (style guide: prompts 64, calculations 112). */
export const FONT_SIZES = {
    title: 112,
    subtitle: 48,
    caption: 32,
} as const;

/** Placeholder frame thickness and inset, in scene pixels. */
export const PLACEHOLDER_FRAME = {
    width: 8,
    margin: 24,
} as const;
