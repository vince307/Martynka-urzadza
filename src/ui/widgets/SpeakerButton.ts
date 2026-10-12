import type { GameObjects, Scene } from 'phaser';
import { HUD_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';

type Point = [number, number];

// Kit speaker icon (preview.js speakerSVG, viewBox 64): a cone and two sound arcs.
const CONE: Point[] = [[9, 24], [20, 24], [35, 12], [35, 52], [20, 40], [9, 40]];
const ARCS: [Point, Point, Point][] = [
    [[44, 22], [55, 32], [44, 42]],   // q11 10 0 20
    [[51, 13], [71, 32], [51, 51]],   // q20 19 0 38
];
const ICON_VIEWBOX = 64;
const ARC_STEPS = 12;
const ICON_LINE = 4;

const quadratic = ([a, c, b]: [Point, Point, Point]): Point[] =>
    Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
        const t = i / ARC_STEPS;
        const u = 1 - t;
        return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
    });

/**
 * HUD button that reads the current task aloud. It speaks on pointerup (a touch end is a user
 * activation for speech; pointerdown is not), and has no label: the icon is the kit's.
 */
export class SpeakerButton {
    private readonly graphics: GameObjects.Graphics;
    private readonly zone: GameObjects.Zone;
    private shown = false;

    constructor(scene: Scene, onTap: () => void) {
        const { left, top, width, height } = HUD_LAYOUT.speaker;
        this.graphics = scene.add.graphics();
        this.zone = scene.add.zone(left + width / 2, top + height / 2, width, height).setInteractive();
        this.zone.on('pointerdown', () => this.draw(true));
        this.zone.on('pointerout', () => this.draw(false));
        this.zone.on('pointerup', () => {
            this.draw(false);
            if (this.shown) {
                onTap();
            }
        });
        this.setVisible(false);
    }

    setVisible(on: boolean): void {
        this.shown = on;
        this.graphics.setVisible(on);
        if (this.zone.input) {
            this.zone.input.enabled = on;
        }
        if (on) {
            this.draw(false);
        }
    }

    /** Centre of the button in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        const { left, top, width, height } = HUD_LAYOUT.speaker;
        return this.shown ? { x: left + width / 2, y: top + height / 2 } : null;
    }

    private draw(pressed: boolean): void {
        const { left, top, width, height, radius, border, fill, pressed: pressedFill, borderColor, iconSize } = HUD_LAYOUT.speaker;
        const g = this.graphics;
        g.clear();
        g.fillStyle(pressed ? pressedFill : fill, 1);
        g.fillRoundedRect(left, top, width, height, radius);
        g.lineStyle(border, borderColor, 1);
        g.strokeRoundedRect(left, top, width, height, radius);
        const scale = iconSize / ICON_VIEWBOX;
        const originX = left + (width - iconSize) / 2;
        const originY = top + (height - iconSize) / 2;
        const place = ([x, y]: Point): Point => [originX + x * scale, originY + y * scale];
        g.lineStyle(ICON_LINE * scale, PLACEHOLDER_COLORS.deepTeal, 1);
        g.beginPath();
        CONE.map(place).forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
        g.closePath();
        g.strokePath();
        for (const arc of ARCS) {
            g.beginPath();
            quadratic(arc).map(place).forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
            g.strokePath();
        }
    }
}
