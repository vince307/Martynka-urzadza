import type { GameObjects } from 'phaser';
import { HUD_PILL, LIPS } from '../../data/layout';
import type { Rect } from './geometry';
import { drawLip, fillPaper, hexToNumber } from './kitDraw';

export interface HudPillOptions {
    /** The darker face of a held button (the speaker and "Do pokoju"); the lip is not affected. */
    pressed?: boolean;
    /** Draw the static lip too. A `ChunkyFace` draws its own lip, so its widgets leave this off. */
    lip?: boolean;
    /** Corner radius when it differs from `HUD_PILL.radius` (the gear is 96 px high). */
    radius?: number;
}

/** Colour of a held pill: the kit gradient's lower tint, a step darker (the speaker's former pressed fill). */
const PRESSED_FILL = 0xfff0cc;

/**
 * The kit HUD pill (screen.css `.hud button, .stars`): butter face, a 5 px border in `HUD_PILL.borderColor` and a lip
 * 7 px under it. One drawing for the speaker, "Do pokoju", the star counter and the parent's gear.
 */
export const drawHudPill = (g: GameObjects.Graphics, rect: Rect, options: HudPillOptions = {}): void => {
    const radius = options.radius ?? HUD_PILL.radius;
    if (options.lip) {
        drawLip(g, rect, radius, LIPS.hud);
    }
    if (options.pressed) {
        g.fillStyle(PRESSED_FILL, 1);
        g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    } else {
        fillPaper(g, rect, radius, hexToNumber(HUD_PILL.top), hexToNumber(HUD_PILL.bottom));
    }
    g.lineStyle(HUD_PILL.border, hexToNumber(HUD_PILL.borderColor), 1);
    g.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
};
