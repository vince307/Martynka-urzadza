import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS } from '../../data/layout';
import { pl } from '../../data/pl';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/** Geometry of the kit's reference/ruler.svg in its own units: a butter body, the 0 mark 34 units from its left edge, 56 units per cm. */
const RULER = {
    cmStep: 56,
    zeroInset: 34,
    endInset: 64,        // after the last cm mark: room for the unit label
    bodyHeight: 104,
    radius: 18,
    border: 4,
    cmTick: { length: 34, width: 4 },
    halfTick: { length: 20, width: 2 },
    mmTick: { length: 10, width: 2 },
    digitDrop: 80,       // digit baseline below the body top
    unitX: 27,           // "cm" label centre, after the last mark
    // DESIGN-GAP (docs/design-gaps.md row 56): the kit draws no measured segment; it floats above the ruler on a lead line to each end.
    segment: { gap: 44, width: 8, cap: 26 },
    lead: { width: 2, alpha: 0.35 },
} as const;
const TOTAL_HEIGHT = RULER.segment.gap + RULER.segment.cap + RULER.bodyHeight;

const TEAL = PLACEHOLDER_COLORS.deepTeal;

/** A ruler of `lengthCm` with the measured segment drawn above it (millimetres from the 0 mark). */
export class Ruler {
    private readonly graphics: GameObjects.Graphics;
    private digits: GameObjects.Text[] = [];
    private readonly unit: GameObjects.Text;
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(private readonly scene: Scene) {
        this.graphics = scene.add.graphics();
        this.unit = scene.add.text(0, 0, '', textStyle('rulerUnit')).setOrigin(0.5);
        this.setVisible(false);
    }

    render(unit: 'cm' | 'mm', lengthCm: number, fromMm: number, toMm: number, rect: Rect): void {
        this.area = rect;
        this.digits.forEach((d) => d.destroy());
        this.digits = [];
        const widthUnits = RULER.zeroInset + lengthCm * RULER.cmStep + RULER.endInset;
        const s = Math.min(rect.width / widthUnits, rect.height / TOTAL_HEIGHT);
        const left = rect.x + (rect.width - widthUnits * s) / 2;
        const top = rect.y + (rect.height - TOTAL_HEIGHT * s) / 2;
        const bodyTop = top + (RULER.segment.gap + RULER.segment.cap) * s;
        const zeroX = left + RULER.zeroInset * s;
        const xOfMm = (mm: number): number => zeroX + (mm / 10) * RULER.cmStep * s;
        const g = this.graphics;
        g.clear();
        g.fillStyle(PLACEHOLDER_COLORS.butter, 1);
        g.fillRoundedRect(left, bodyTop, widthUnits * s, RULER.bodyHeight * s, RULER.radius * s);
        g.lineStyle(RULER.border * s, TEAL, 1);
        g.strokeRoundedRect(left, bodyTop, widthUnits * s, RULER.bodyHeight * s, RULER.radius * s);
        const mark = (mm: number, tick: { length: number; width: number }): void => {
            g.lineStyle(tick.width * s, TEAL, 1);
            g.lineBetween(xOfMm(mm), bodyTop + 4 * s, xOfMm(mm), bodyTop + (4 + tick.length) * s);
        };
        for (let mm = 0; mm <= lengthCm * 10; mm++) {
            if (mm % 10 === 0) {
                mark(mm, RULER.cmTick);
                this.digits.push(
                    this.scene.add
                        .text(xOfMm(mm), bodyTop + RULER.digitDrop * s, String(mm / 10), textStyle('rulerDigit'))
                        .setOrigin(0.5)
                        .setScale(s),
                );
            } else if (mm % 5 === 0) {
                mark(mm, RULER.halfTick);
            } else if (unit === 'mm') {
                mark(mm, RULER.mmTick);
            }
        }
        this.unit.setText(pl.tasks.rulerUnitLabel).setPosition(xOfMm(lengthCm * 10) + RULER.unitX * s, bodyTop + RULER.digitDrop * s + 2 * s).setScale(s);
        // The segment above the ruler, with a lead line from each end down to the body.
        const y = top + RULER.segment.cap * s / 2;
        const [x1, x2] = [xOfMm(fromMm), xOfMm(toMm)];
        g.lineStyle(RULER.lead.width * s, TEAL, RULER.lead.alpha);
        for (const x of [x1, x2]) {
            g.lineBetween(x, y, x, bodyTop);
        }
        g.lineStyle(RULER.segment.width * s, PLACEHOLDER_COLORS.turquoise, 1);
        g.lineBetween(x1, y, x2, y);
        g.lineStyle(RULER.border * s, TEAL, 1);
        for (const x of [x1, x2]) {
            g.lineBetween(x, y - (RULER.segment.cap * s) / 2, x, y + (RULER.segment.cap * s) / 2);
        }
        this.unit.setVisible(true);
        this.graphics.setVisible(true);
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        this.unit.setVisible(visible);
        this.digits.forEach((d) => d.setVisible(visible));
        if (!visible) {
            this.graphics.clear();
        }
    }

    /** True while the drawing is on screen (the e2e hook reads it, not the rectangle). */
    shown(): boolean {
        return this.graphics.visible;
    }

    bounds(): Rect {
        return this.area;
    }
}
