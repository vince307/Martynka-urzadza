import type { GameObjects, Scene } from 'phaser';
import { matValue, emptyMat, type BlockDragState, type BlockKind, type Mat } from '../../core/blockDrag';
import { interiorPoint, type DragLayout, type Rect } from '../../core/round/dragLayout';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';
import { drawBlock } from './BaseTenBlocks';
import { dashedRect } from './dashedRect';
import { textStyle } from './textStyle';

type Point = { x: number; y: number };

export interface BlockMatTargets {
    tray: Partial<Record<BlockKind, Point>>;
    mat: Point | null;
    ok: Point | null;
    matBlocks: (Point & { kind: BlockKind })[];
}

/**
 * Tray of blocks and the mat of the `drag` answer mode: the child drags a tens rod or a ones cube from the tray onto
 * the mat (or taps it) and "OK" hands in the number built. The gesture itself is core/blockDrag.ts; this widget only
 * draws the state the scene gives it and publishes the interior points the e2e hook aims at.
 * DESIGN-GAP (docs/design-gaps.md row 55): the kit has no tray, mat or drop-outside look; they are drawn in code.
 */
export class BlockMat {
    private readonly frame: GameObjects.Graphics;
    private readonly labels: GameObjects.Text[] = [];
    private readonly carried: GameObjects.Graphics;
    private readonly ok: ActionButton;
    private layout: DragLayout | null = null;
    private kinds: readonly BlockKind[] = [];
    private mat: Mat = emptyMat();
    private visible = false;
    private active = false;
    private trayShown = true;

    constructor(
        private readonly scene: Scene,
        private readonly onSubmit: (value: number) => void,
    ) {
        this.frame = scene.add.graphics().setVisible(false);
        this.carried = scene.add.graphics().setVisible(false);
        this.ok = new ActionButton(scene, () => {
            if (this.active) {
                this.onSubmit(matValue(this.mat));
            }
        });
    }

    /** The rectangles for the kinds of the open task; the labels under the tray blocks are made here. */
    setLayout(layout: DragLayout, kinds: readonly BlockKind[]): void {
        this.layout = layout;
        this.kinds = kinds;
        this.labels.forEach((t) => t.destroy());
        this.labels.length = 0;
        for (const kind of kinds) {
            const r = layout.tray[kind];
            if (r) {
                this.labels.push(
                    this.scene.add.text(r.x + r.width / 2, r.y + r.height - TASK_LAYOUT.drag.labelHeight / 2, pl.round.trayLabels[kind], textStyle('bar')).setOrigin(0.5).setVisible(false),
                );
            }
        }
    }

    /** `trayShown` false while the solution steps stand where the tray is. */
    render(state: BlockDragState, active: boolean, trayShown: boolean): void {
        this.mat = state.mat;
        this.active = active;
        this.trayShown = trayShown;
        this.paint(state);
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        if (!visible) {
            this.frame.clear().setVisible(false);
            this.carried.clear().setVisible(false);
            this.labels.forEach((t) => t.setVisible(false));
            this.ok.hide();
        }
    }

    /** Interior points (scene space) of the tray blocks, the mat, "OK" and the blocks lying on the mat, for the e2e hook. */
    targets(): BlockMatTargets {
        const layout = this.layout;
        if (!this.visible || !layout) {
            return { tray: {}, mat: null, ok: null, matBlocks: [] };
        }
        const tray: Partial<Record<BlockKind, Point>> = {};
        if (this.trayShown) {
            for (const kind of this.kinds) {
                const r = layout.tray[kind];
                if (r) tray[kind] = interiorPoint(r);
            }
        }
        const matBlocks: (Point & { kind: BlockKind })[] = [];
        for (const kind of this.kinds) {
            for (let i = 0; i < this.mat[kind]; i++) {
                matBlocks.push({ kind, ...interiorPoint(layout.matBlock(kind, i)) });
            }
        }
        return { tray, mat: interiorPoint(layout.mat), ok: this.ok.target(), matBlocks };
    }

    okTarget(): Point | null {
        return this.ok.target();
    }

    private paint(state: BlockDragState): void {
        const layout = this.layout;
        const g = this.frame;
        g.clear();
        this.carried.clear();
        if (!this.visible || !layout) {
            return;
        }
        g.setVisible(true);
        this.carried.setVisible(true);
        const { drag, blocks } = TASK_LAYOUT;
        const teal = PLACEHOLDER_COLORS.deepTeal;

        // The mat: a pale field with a dashed outline.
        g.fillStyle(PLACEHOLDER_COLORS.field, 1);
        g.fillRoundedRect(layout.mat.x, layout.mat.y, layout.mat.width, layout.mat.height, TASK_LAYOUT.drag.radius);
        dashedRect(g, layout.mat, teal);

        // Blocks on the mat, one cell each; a block lifted from the mat is drawn under the finger instead.
        const lifted = state.carrying && state.carrying.from === 'mat' ? state.carrying.kind : null;
        const scale = this.cellScale(layout);
        for (const kind of this.kinds) {
            const count = this.mat[kind] - (kind === lifted ? 1 : 0);
            for (let i = 0; i < count; i++) {
                drawBlock(g, this.fitted(kind, layout.matBlock(kind, i), scale), scale);
            }
        }

        // The tray.
        this.labels.forEach((t) => t.setVisible(this.trayShown));
        if (this.trayShown) {
            for (const kind of this.kinds) {
                const r = layout.tray[kind];
                if (!r) continue;
                g.fillStyle(PLACEHOLDER_COLORS.tile, 1);
                g.fillRoundedRect(r.x, r.y, r.width, r.height, TASK_LAYOUT.drag.radius);
                g.lineStyle(blocks.border, PLACEHOLDER_COLORS.tileBorder, 1);
                g.strokeRoundedRect(r.x, r.y, r.width, r.height, TASK_LAYOUT.drag.radius);
                const area: Rect = { x: r.x, y: r.y, width: r.width, height: r.height - drag.labelHeight };
                drawBlock(g, this.fitted(kind, area, drag.trayScale), drag.trayScale);
            }
        }

        // The block under the finger, above everything, with a short shadow.
        const c = state.carrying;
        if (c?.moved) {
            const size = this.fitted(c.kind, { x: c.x, y: c.y, width: 0, height: 0 }, drag.trayScale);
            this.carried.fillStyle(teal, 0.25);
            this.carried.fillRoundedRect(size.x + drag.shadow, size.y + drag.shadow, size.width, size.height, blocks[c.kind].radius * drag.trayScale);
            drawBlock(this.carried, size, drag.trayScale);
        }

        if (this.trayShown && this.visible) {
            this.ok.showCentered(pl.round.okKey, layout.ok.x + layout.ok.width / 2, layout.ok.y + layout.ok.height / 2, PLACEHOLDER_COLORS.next, PLACEHOLDER_COLORS.nextBorder);
        } else {
            this.ok.hide();
        }
    }

    /** One scale for every kind on the mat, so a rod stays ten cubes long: the rod must fit a cell. */
    private cellScale(layout: DragLayout): number {
        const kind = this.kinds[0] ?? 'ten';
        const cell = layout.matBlock(kind, 0);
        return Math.min(...(['hundred', 'ten', 'one'] as const).filter((k) => this.kinds.includes(k)).map((k) => Math.min(cell.width / TASK_LAYOUT.blocks[k].width, cell.height / TASK_LAYOUT.blocks[k].height)), TASK_LAYOUT.blocks.maxScale);
    }

    /** The rectangle of a block of `kind` at `scale`, centred in `area` (a zero-size area is a point). */
    private fitted(kind: BlockKind, area: Rect, scale: number): { kind: BlockKind; x: number; y: number; width: number; height: number } {
        const width = TASK_LAYOUT.blocks[kind].width * scale;
        const height = TASK_LAYOUT.blocks[kind].height * scale;
        return { kind, x: area.x + (area.width - width) / 2, y: area.y + (area.height - height) / 2, width, height };
    }
}
