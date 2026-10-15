// DESIGN-GAP (docs/design-gaps.md row 100): the kit has no figure on an answer tile; faces are drawn in code, outline 4 px, colour from FACE_COLORS.
import { Math as PhaserMath, type GameObjects } from 'phaser';
import type { Face } from '../../core/tasks/faces';
import { FACE_COLORS, FACE_LOOK, PLACEHOLDER_COLORS } from '../../data/layout';
import type { FigureId } from '../../data/shapes';
import type { Rect } from './geometry';

const vec = (pts: readonly { x: number; y: number }[]): PhaserMath.Vector2[] => pts.map((p) => new PhaserMath.Vector2(p.x, p.y));

/** Corner points of a five-pointed star centred on (cx, cy). */
export const starPoints = (cx: number, cy: number, outer: number): { x: number; y: number }[] =>
    Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? outer : outer * 0.45;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

/** One figure of radius `r` centred on (cx, cy), filled and outlined with the styles already set on `g`. */
export const drawShape = (g: GameObjects.Graphics, figure: FigureId, cx: number, cy: number, r: number): void => {
    switch (figure) {
        case 'circle':
            g.fillCircle(cx, cy, r);
            g.strokeCircle(cx, cy, r);
            break;
        case 'square':
            g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
            g.strokeRect(cx - r, cy - r, 2 * r, 2 * r);
            break;
        case 'rectangle': {
            const w = r * FACE_LOOK.rectangleWidth;
            const h = r * FACE_LOOK.rectangleHeight;
            g.fillRect(cx - w, cy - h, 2 * w, 2 * h);
            g.strokeRect(cx - w, cy - h, 2 * w, 2 * h);
            break;
        }
        case 'triangle': {
            const pts = [
                { x: cx, y: cy - r },
                { x: cx + r, y: cy + r * 0.85 },
                { x: cx - r, y: cy + r * 0.85 },
            ];
            g.fillPoints(vec(pts), true);
            g.strokePoints(vec(pts), true);
            break;
        }
        case 'star': {
            const pts = starPoints(cx, cy, r * 1.1);
            g.fillPoints(vec(pts), true);
            g.strokePoints(vec(pts), true);
            break;
        }
        case 'heart': {
            const lobe = r * 0.55;
            g.fillCircle(cx - lobe, cy - lobe * 0.5, lobe);
            g.fillCircle(cx + lobe, cy - lobe * 0.5, lobe);
            const pts = [
                { x: cx - r * 1.04, y: cy - lobe * 0.2 },
                { x: cx + r * 1.04, y: cy - lobe * 0.2 },
                { x: cx, y: cy + r },
            ];
            g.fillPoints(vec(pts), true);
            g.lineBetween(cx - r * 1.04, cy - lobe * 0.2, cx, cy + r);
            g.lineBetween(cx + r * 1.04, cy - lobe * 0.2, cx, cy + r);
            g.strokeCircle(cx - lobe, cy - lobe * 0.5, lobe);
            g.strokeCircle(cx + lobe, cy - lobe * 0.5, lobe);
            break;
        }
        default: {
            const unreachable: never = figure;
            throw new Error(`unknown figure ${String(unreachable)}`);
        }
    }
};

/** A face centred on (cx, cy): the big one fills `FACE_LOOK.bigFill` of the box's short side, the small one `smallRatio` of that. */
export const drawFace = (g: GameObjects.Graphics, face: Face, cx: number, cy: number, box: Pick<Rect, 'width' | 'height'>): void => {
    const big = (Math.min(box.width, box.height) * FACE_LOOK.bigFill) / 2;
    g.fillStyle(FACE_COLORS[face.colour], 1);
    g.lineStyle(FACE_LOOK.outline, PLACEHOLDER_COLORS.deepTeal, 1);
    drawShape(g, face.figure, cx, cy, face.size === 'big' ? big : big * FACE_LOOK.smallRatio);
};
