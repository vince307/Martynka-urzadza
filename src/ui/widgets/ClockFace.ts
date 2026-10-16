import type { GameObjects, Scene } from 'phaser';
import { clockHandAngles, dialGeometry } from '../../core/round/pictureLayout';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

/** Dial geometry of the kit's reference/clock.svg in its own units (outer radius 150), the one source in TASK_LAYOUT.clockSet; everything is scaled from there. */
const DIAL = TASK_LAYOUT.clockSet.dial;

const TEAL = PLACEHOLDER_COLORS.deepTeal;

/** A 12-hour dial with an hour and a minute hand, drawn in code (kit reference/clock.svg). Reads `hour % 12`, so 15.00 shows 3. */
export class ClockFace {
    private readonly graphics: GameObjects.Graphics;
    private readonly digits: GameObjects.Text[];
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.graphics = scene.add.graphics();
        this.digits = Array.from({ length: 12 }, (_, i) => scene.add.text(0, 0, String(i + 1), textStyle('clockDigit')).setOrigin(0.5));
        this.setVisible(false);
    }

    /** Draws the dial centred in `rect`, as large as fits. */
    render(hour: number, minute: number, rect: Rect): void {
        this.area = rect;
        const { centre: { x: cx, y: cy }, scale: s, polar } = dialGeometry(rect, DIAL);
        const g = this.graphics;
        g.clear();
        g.fillStyle(PLACEHOLDER_COLORS.oak, 1);
        g.fillCircle(cx, cy, DIAL.outer * s);
        g.lineStyle(DIAL.border * s, TEAL, 1);
        g.strokeCircle(cx, cy, DIAL.outer * s);
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        g.fillCircle(cx, cy, DIAL.inner * s);
        g.strokeCircle(cx, cy, DIAL.inner * s);
        for (let minuteMark = 0; minuteMark < 60; minuteMark++) {
            const tick = minuteMark % 5 === 0 ? DIAL.hourTick : DIAL.minuteTick;
            const from = polar(minuteMark * 6, tick.from);
            const to = polar(minuteMark * 6, tick.to);
            g.lineStyle(tick.width * s, TEAL, 1);
            g.lineBetween(from.x, from.y, to.x, to.y);
        }
        this.digits.forEach((digit, i) => {
            const at = polar((i + 1) * 30, DIAL.digitRadius);
            digit.setPosition(at.x, at.y).setScale(s);
        });
        const angles = clockHandAngles(hour, minute);
        const hand = (angle: number, spec: { length: number; width: number }, color: number): void => {
            const tip = polar(angle, spec.length);
            g.lineStyle(spec.width * s, color, 1);
            g.lineBetween(cx, cy, tip.x, tip.y);
        };
        hand(angles.hour, { length: DIAL.hourLength, width: DIAL.hourWidth }, TEAL);
        hand(angles.minute, { length: DIAL.minuteLength, width: DIAL.minuteWidth }, PLACEHOLDER_COLORS.turquoise);
        g.fillStyle(PLACEHOLDER_COLORS.butter, 1);
        g.fillCircle(cx, cy, DIAL.hub.radius * s);
        g.lineStyle(DIAL.hub.border * s, TEAL, 1);
        g.strokeCircle(cx, cy, DIAL.hub.radius * s);
        this.setVisible(true);
    }

    setVisible(visible: boolean): void {
        this.graphics.setVisible(visible);
        this.digits.forEach((d) => d.setVisible(visible));
        if (!visible) {
            this.graphics.clear();
        }
    }

    /** True while the drawing is on screen (the e2e hook reads it, not the rectangle). */
    shown(): boolean {
        return this.graphics.visible;
    }

    /** The rectangle the dial was drawn in, for the e2e hook. */
    bounds(): Rect {
        return this.area;
    }
}
