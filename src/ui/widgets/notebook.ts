import type { Scene } from 'phaser';
import { notebookGeometry } from '../../core/notebookGeometry';
import { NOTEBOOK, TASK_LAYOUT } from '../../data/layout';
import { fillPaper, hexToNumber } from './kitDraw';

const SHADOW_STEPS = 6;

/** The kit notebook (soft shadow, darker bottom edge, turquoise frame, ivory face, margin line, stitch marks, butter ribbon) that task, summary and welcome screens are drawn on. */
export const drawNotebook = (scene: Scene): void => {
    const { left, top, width, height, radius, border } = TASK_LAYOUT.notebook;
    const geo = notebookGeometry();
    const g = scene.add.graphics();

    // Soft shadow: stacked translucent rounded rects growing from the offset position, approximating `0 22px 36px`.
    const sh = NOTEBOOK.shadow;
    g.fillStyle(hexToNumber(sh.color), sh.alpha / SHADOW_STEPS);
    for (let i = 0; i < SHADOW_STEPS; i++) {
        const grow = (sh.blur / 2) * ((i + 1) / SHADOW_STEPS);
        g.fillRoundedRect(geo.shadow.x - grow, geo.shadow.y - grow / 2, geo.shadow.width + 2 * grow, geo.shadow.height + grow, radius + grow);
    }

    // Darker thick bottom edge, then the frame over it.
    g.fillStyle(hexToNumber(NOTEBOOK.edge.color), 1);
    g.fillRoundedRect(left, top + NOTEBOOK.edge.height, width, height - NOTEBOOK.edge.height, radius);
    g.fillStyle(hexToNumber(NOTEBOOK.frame), 1);
    g.fillRoundedRect(left, top, width, height - NOTEBOOK.edge.height, radius);

    fillPaper(g, geo.face, radius - border / 2, hexToNumber(NOTEBOOK.faceTop), hexToNumber(NOTEBOOK.faceBottom));

    g.fillStyle(hexToNumber(NOTEBOOK.margin.color), 1);
    g.fillRect(geo.margin.x, geo.margin.y, geo.margin.width, geo.margin.height);

    for (const s of geo.stitches) {
        g.fillStyle(0xffffff, 0.55);
        g.fillRoundedRect(s.x, s.y + 2, s.width, s.height, s.height / 2);
        g.fillStyle(hexToNumber(NOTEBOOK.stitches.color), 1);
        g.fillRoundedRect(s.x, s.y, s.width, s.height, s.height / 2);
    }

    g.fillStyle(hexToNumber(NOTEBOOK.ribbon.color), 1);
    const [a, b, c, d, e] = geo.ribbon;
    // A pentagon with a notch as three triangles (Graphics.fillPoints wants Vector2s).
    g.fillTriangle(a.x, a.y, b.x, b.y, d.x, d.y);
    g.fillTriangle(a.x, a.y, d.x, d.y, e.x, e.y);
    g.fillTriangle(b.x, b.y, c.x, c.y, d.x, d.y);
};
