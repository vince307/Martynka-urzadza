import { GUIDE } from '../data/layout';
import type { Rect } from './geometry';

/** The scene rectangle the fox's visible body (the pack's silhouette) occupies; the image itself is larger and transparent around it. */
export const guideRect = (guide: typeof GUIDE = GUIDE): Rect => {
    const s = guide.displaySize / guide.sourceSize;
    const ox = guide.origin.x * guide.sourceSize;
    const oy = guide.origin.y * guide.sourceSize;
    const { left, top, right, bottom } = guide.silhouette;
    const x = guide.anchor.x + (left - ox) * s;
    const y = guide.anchor.y + (top - oy) * s;
    return { x, y, width: guide.anchor.x + (right - ox) * s - x, height: guide.anchor.y + (bottom - oy) * s - y };
};
