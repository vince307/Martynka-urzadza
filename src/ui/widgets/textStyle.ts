import type { Types } from 'phaser';
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, TEXT_COLOR } from '../../data/layout';

/** Phaser text style of one text role: the task font at the kit's size and weight. */
export const textStyle = (role: keyof typeof FONT_SIZES, color: string = TEXT_COLOR): Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: `${FONT_SIZES[role]}px`,
    fontStyle: String(FONT_WEIGHTS[role]),
    color,
});
