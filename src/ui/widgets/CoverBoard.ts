import type { GameObjects, Scene } from 'phaser';
import { coverBoardCells, type CoverCell } from '../../core/minigames/dice';
import { MINIGAME_LAYOUT, PLACEHOLDER_COLORS } from '../../data/layout';
import { textStyle } from './textStyle';

interface Field {
    cell: CoverCell;
    graphics: GameObjects.Graphics;
    label: GameObjects.Text;
    zone: GameObjects.Zone;
    pressed: boolean;
}

/**
 * The board of "Zakrywanka" (kit .result-grid): fields 0..12. A tap on an uncovered field is an answer; a covered field
 * (green, with a check) ignores touches. It draws what it is given and decides nothing (core/round judges the answer).
 */
export class CoverBoard {
    private readonly fields: Field[];
    private covered = new Set<number>();
    private hint: number | null = null;
    private active = false;
    private visible = false;

    constructor(scene: Scene, count: number, private readonly onPick: (value: number) => void) {
        this.fields = coverBoardCells(MINIGAME_LAYOUT.board, count).map((cell) => {
            const graphics = scene.add.graphics();
            const label = scene.add.text(cell.x + cell.width / 2, cell.y + cell.height / 2, String(cell.value), textStyle('result')).setOrigin(0.5);
            const zone = scene.add.zone(cell.x + cell.width / 2, cell.y + cell.height / 2, cell.width, cell.height).setInteractive();
            const field: Field = { cell, graphics, label, zone, pressed: false };
            zone.on('pointerdown', () => this.press(field));
            zone.on('pointerup', () => this.release(field));
            zone.on('pointerout', () => this.release(field));
            return field;
        });
        this.setVisible(false);
    }

    /** `covered` are the results already done; `hint` outlines the field of the answer while the child retypes it. */
    show(covered: readonly number[], hint: number | null): void {
        this.covered = new Set(covered);
        this.hint = hint;
        this.setVisible(true);
        this.fields.forEach((f) => this.paint(f));
    }

    hide(): void {
        this.setVisible(false);
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    /** Centres of the fields that still take a tap, for the e2e hook. */
    targets(): { value: number; x: number; y: number }[] {
        if (!this.visible) {
            return [];
        }
        return this.fields
            .filter((f) => !this.covered.has(f.cell.value))
            .map((f) => ({ value: f.cell.value, x: f.cell.x + f.cell.width / 2, y: f.cell.y + f.cell.height / 2 }));
    }

    /** The covered results, sorted; for the e2e hook. */
    coveredValues(): number[] {
        return [...this.covered].sort((a, b) => a - b);
    }

    private setVisible(visible: boolean): void {
        this.visible = visible;
        this.fields.forEach((f) => {
            f.graphics.setVisible(visible);
            f.label.setVisible(visible);
            if (f.zone.input) {
                f.zone.input.enabled = visible;
            }
        });
    }

    private press(field: Field): void {
        if (!this.active || !this.visible || this.covered.has(field.cell.value)) {
            return;
        }
        field.pressed = true;
        this.paint(field);   // synchronous: the highlight comes before any tween
        this.onPick(field.cell.value);
    }

    private release(field: Field): void {
        if (field.pressed) {
            field.pressed = false;
            this.paint(field);
        }
    }

    private paint(field: Field): void {
        const { x, y, width, height } = field.cell;
        const { radius, border, shadow, checkSize } = MINIGAME_LAYOUT.board;
        const done = this.covered.has(field.cell.value);
        const hinted = !done && this.hint === field.cell.value;
        const g = field.graphics;
        g.clear();
        g.fillStyle(PLACEHOLDER_COLORS.resultShadow, 1);
        g.fillRoundedRect(x, y + shadow, width, height, radius);
        g.fillStyle(done ? PLACEHOLDER_COLORS.resultCovered : field.pressed ? PLACEHOLDER_COLORS.pressed : PLACEHOLDER_COLORS.result, 1);
        g.fillRoundedRect(x, y, width, height, radius);
        g.lineStyle(hinted ? border * 2 : border, done ? PLACEHOLDER_COLORS.resultCoveredBorder : hinted ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.resultBorder, 1);
        g.strokeRoundedRect(x, y, width, height, radius);
        if (done) {
            // The check sits in the top right corner (kit .result.covered:after), drawn as two strokes: the font has no U+2713.
            const right = x + width - 9;
            const top = y + 5;
            g.lineStyle(5, PLACEHOLDER_COLORS.resultCoveredBorder, 1);
            g.beginPath();
            g.moveTo(right - checkSize, top + checkSize * 0.55);
            g.lineTo(right - checkSize * 0.62, top + checkSize * 0.9);
            g.lineTo(right, top + checkSize * 0.1);
            g.strokePath();
        }
    }
}
