// DESIGN-GAP 64 (docs/design-gaps.md): the kit thermometer frame has one scale of −30…+30.
import type { GameObjects, Scene } from 'phaser';
import { CELSIUS, formatScaleMark } from '../../core/text/measure';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { THERMOMETER } from '../../data/measures';
import { ART_KEYS } from '../../data/taskArt';
import { ArtImage } from './ArtImage';
import { thermometerLayout, thermometerMarks } from './artLayout';
import type { Rect } from './geometry';
import { textStyle } from './textStyle';

const INK = PLACEHOLDER_COLORS.deepTeal;
const LIQUID = PLACEHOLDER_COLORS.turquoise;
const LABELS = (THERMOMETER.max - THERMOMETER.min) / 10 + 1;   // a label every 10 degrees: -30, -20 ... +30

/**
 * A thermometer: the kit's housing image with the tube, the liquid, the ticks and the labels painted over it in code
 * (kit reference/thermometer-face.js), so the column can stand at any temperature (S-14).
 */
export class Thermometer {
    private readonly frame: ArtImage;
    private readonly face: GameObjects.Graphics;
    private readonly labels: GameObjects.Text[];
    private readonly unit: GameObjects.Text;
    private area: Rect = { x: 0, y: 0, width: 0, height: 0 };

    constructor(scene: Scene) {
        this.frame = new ArtImage(scene);
        this.face = scene.add.graphics().setVisible(false);
        this.labels = Array.from({ length: LABELS }, () => scene.add.text(0, 0, '', textStyle('thermoLabel')).setVisible(false));
        this.unit = scene.add.text(0, 0, '', textStyle('thermoLabel')).setOrigin(0.5).setVisible(false);
    }

    render(celsius: number, rect: Rect): void {
        this.setVisible(false);
        this.area = rect;
        const t = TASK_LAYOUT.thermometer;
        const { frame, scale: s } = thermometerLayout(rect, { frameWidth: THERMOMETER.frame.width, frameHeight: THERMOMETER.frame.height });
        this.frame.show(ART_KEYS.thermometerFrame, frame);
        const x = (u: number): number => frame.x + u * s;
        const y = (u: number): number => frame.y + u * s;
        const yOf = (value: number): number => y(THERMOMETER.yForMinus30 - (value - THERMOMETER.min) * THERMOMETER.pixelsPerDegree);
        const g = this.face;
        g.clear().setVisible(true);
        g.fillStyle(INK, t.tube.fillAlpha).fillRoundedRect(x(t.tube.x), y(t.tube.y), t.tube.width * s, t.tube.height * s, t.tube.radius * s);
        g.lineStyle(t.tube.border * s, INK, 1).strokeRoundedRect(x(t.tube.x), y(t.tube.y), t.tube.width * s, t.tube.height * s, t.tube.radius * s);
        g.fillStyle(LIQUID, 1).fillRoundedRect(x(t.liquid.x), yOf(celsius), t.liquid.width * s, (y(t.liquid.bottom) - yOf(celsius)), t.liquid.radius * s);
        g.fillCircle(x(t.bulb.x), y(t.bulb.y), t.bulb.radius * s);
        g.lineStyle(t.tube.border * s, INK, 1).strokeCircle(x(t.bulb.x), y(t.bulb.y), t.bulb.radius * s);
        const marks = thermometerMarks(THERMOMETER.min, THERMOMETER.max, THERMOMETER.pixelsPerDegree * s, t.minGapPx);
        const fontSize = `${Math.max(t.label.size * s, t.minLabelPx)}px`;
        let label = 0;
        for (const mark of marks) {
            const major = mark.kind === 'major';
            const end = major ? t.tick.major : mark.kind === 'five' ? t.tick.five : t.tick.minor;
            g.lineStyle(Math.max((major ? t.tick.majorWidth : t.tick.width) * s, t.tick.minWidthPx), INK, 1);
            g.lineBetween(x(t.tick.start), yOf(mark.value), x(end), yOf(mark.value));
            const text = major ? this.labels[label] : undefined;
            if (text) {
                label += 1;
                // Centred on x 301 as in the kit (textAlign 'center'); a label held at minLabelPx on a small thermometer is wider than the
                // kit's, so it never starts closer than `label.gap` to the major tick (visual gate S-14).
                text.setText(formatScaleMark(mark.value)).setFontSize(fontSize).setOrigin(0, 0.5);
                text.setPosition(Math.max(x(t.label.x) - text.width / 2, x(t.tick.major + t.label.gap)), yOf(mark.value)).setVisible(true);
            }
        }
        this.unit.setText(CELSIUS).setFontSize(fontSize).setPosition(x(t.unit.x), y(t.unit.y)).setVisible(true);
    }

    setVisible(visible: boolean): void {
        if (!visible) {
            this.frame.hide();
            this.face.setVisible(false);
            this.labels.forEach((text) => text.setVisible(false));
            this.unit.setVisible(false);
        }
    }

    /** The housing and the painted face are both on screen (a housing alone, or a face alone, is not a thermometer). */
    shown(): boolean {
        return this.frame.state() !== null && this.face.visible && this.unit.visible;
    }

    art(): { key: string; loaded: boolean }[] {
        const state = this.frame.state();
        return state ? [state] : [];
    }

    bounds(): Rect {
        return this.area;
    }
}
