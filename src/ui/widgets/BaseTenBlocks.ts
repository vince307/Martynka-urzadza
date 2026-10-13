import type { GameObjects, Scene } from 'phaser';
import type { BlockKind } from '../../core/blockDrag';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { Rect } from './geometry';

export type { BlockKind };

export interface PlacedBlock {
    kind: BlockKind;
    x: number;       // left, scene pixels
    y: number;       // top
    width: number;
    height: number;
}

export interface BlocksLayout {
    scale: number;
    blocks: PlacedBlock[];
}

const KINDS: readonly BlockKind[] = ['hundred', 'ten', 'one'];

/** The size of one block of `kind` at `scale` (the cell size of the mat in phase 9 comes from here). */
export const blockSize = (kind: BlockKind, scale = 1): { width: number; height: number } => ({
    width: TASK_LAYOUT.blocks[kind].width * scale,
    height: TASK_LAYOUT.blocks[kind].height * scale,
});

/** Flows the blocks (hundreds, then tens, then ones) into rows of at most `wrap` own units; returns the placement in own units and the size used. */
const flow = (counts: Record<BlockKind, number>, wrap: number): { placed: PlacedBlock[]; width: number; height: number } | null => {
    const spec = TASK_LAYOUT.blocks;
    const placed: PlacedBlock[] = [];
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let width = 0;
    let first = true;
    for (const kind of KINDS) {
        for (let i = 0; i < counts[kind]; i++) {
            const size = spec[kind];
            const gap = first ? 0 : i === 0 ? spec.groupGap : spec.gap;
            if (x > 0 && x + gap + size.width > wrap) {
                y += rowHeight + spec.rowGap;
                x = 0;
                rowHeight = 0;
            } else if (x > 0) {
                x += gap;
            }
            if (size.width > wrap) {
                return null;
            }
            placed.push({ kind, x, y, width: size.width, height: size.height });
            x += size.width;
            rowHeight = Math.max(rowHeight, size.height);
            width = Math.max(width, x);
            first = false;
        }
    }
    return { placed, width, height: y + rowHeight };
};

/**
 * Places the blocks inside `rect`: the wrap width that allows the largest scale wins, the group is centred. Pure (no Phaser), so the mat of
 * the build task can share it.
 */
export const blocksLayout = (hundreds: number, tens: number, ones: number, rect: Rect): BlocksLayout => {
    const counts = { hundred: hundreds, ten: tens, one: ones };
    let best: { scale: number; flowed: NonNullable<ReturnType<typeof flow>> } | null = null;
    for (let wrap = TASK_LAYOUT.blocks.hundred.width; wrap <= 4000; wrap += 10) {
        const flowed = flow(counts, wrap);
        if (!flowed || flowed.width <= 0) {
            continue;
        }
        const scale = Math.min(rect.width / flowed.width, rect.height / flowed.height, TASK_LAYOUT.blocks.maxScale);
        if (!best || scale > best.scale + 1e-9) {
            best = { scale, flowed };
        }
    }
    if (!best) {
        return { scale: 1, blocks: [] };
    }
    const { scale, flowed } = best;
    const left = rect.x + (rect.width - flowed.width * scale) / 2;
    const top = rect.y + (rect.height - flowed.height * scale) / 2;
    return {
        scale,
        blocks: flowed.placed.map((b) => ({ kind: b.kind, x: left + b.x * scale, y: top + b.y * scale, width: b.width * scale, height: b.height * scale })),
    };
};

/** One block (flat, rod or cube) in its rectangle; `scale` is the factor from the own units of TASK_LAYOUT.blocks (line widths and radii follow it). */
export const drawBlock = (g: GameObjects.Graphics, b: PlacedBlock, scale: number): void => {
    const spec = TASK_LAYOUT.blocks;
    const teal = PLACEHOLDER_COLORS.deepTeal;
    const fill = b.kind === 'hundred' ? PLACEHOLDER_COLORS.blockHundred : b.kind === 'ten' ? PLACEHOLDER_COLORS.blockTen : PLACEHOLDER_COLORS.butter;
    g.fillStyle(fill, 1);
    g.fillRoundedRect(b.x, b.y, b.width, b.height, spec[b.kind].radius * scale);
    g.lineStyle(spec.line * scale, teal, 1);
    if (b.kind === 'hundred') {
        for (let i = 1; i < spec.cells; i++) {
            const dx = (b.width * i) / spec.cells;
            const dy = (b.height * i) / spec.cells;
            g.lineBetween(b.x + dx, b.y, b.x + dx, b.y + b.height);
            g.lineBetween(b.x, b.y + dy, b.x + b.width, b.y + dy);
        }
    } else if (b.kind === 'ten') {
        for (let i = 1; i < spec.cells; i++) {
            const dy = (b.height * i) / spec.cells;
            g.lineBetween(b.x, b.y + dy, b.x + b.width, b.y + dy);
        }
    }
    g.lineStyle(spec.border * scale, teal, 1);
    g.strokeRoundedRect(b.x, b.y, b.width, b.height, spec[b.kind].radius * scale);
};

/** Hundreds flats (10 x 10 grid), tens rods (10 cells) and ones cubes, drawn in code (kit reference/base-ten.svg). */
export class BaseTenBlocks {
    private readonly graphics: GameObjects.Graphics;
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.graphics = scene.add.graphics().setVisible(false);
    }

    render(hundreds: number, tens: number, ones: number, rect: Rect): void {
        this.area = rect;
        const { scale, blocks } = blocksLayout(hundreds, tens, ones, rect);
        const g = this.graphics;
        g.clear().setVisible(true);
        for (const b of blocks) {
            drawBlock(g, b, scale);
        }
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        if (!visible) {
            this.graphics.clear();
        }
    }

    bounds(): Rect {
        return this.area;
    }
}
