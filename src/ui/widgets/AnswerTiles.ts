import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { textStyle } from './textStyle';
import { tileRow, type Rect } from './geometry';

export type Choice = number | string;


interface Tile {
    rect: Rect;
    graphics: GameObjects.Graphics;
    label: GameObjects.Text;
    zone: GameObjects.Zone;
    value: Choice;
    pressed: boolean;
}

/** 3-4 answer tiles in one row; the tap highlights in pointerdown and emits the value. */
export class AnswerTiles {
    private tiles: Tile[] = [];
    private active = false;
    private correctValue: Choice | null = null;
    private hintValue: Choice | null = null;

    constructor(
        private readonly scene: Scene,
        private readonly onPick: (value: Choice) => void,
    ) {}

    /** `row` moves the row's centre span (a tall drawing beside the tiles); by default the tiles centre in the notebook. */
    setChoices(choices: readonly Choice[], row?: { x: number; width: number }): void {
        this.destroyTiles();
        this.correctValue = null;
        this.hintValue = null;
        const { notebook, tiles } = TASK_LAYOUT;
        const area: Rect = { x: row?.x ?? notebook.left, y: tiles.top, width: row?.width ?? notebook.width, height: tiles.height };
        this.tiles = tileRow(choices.length, area, tiles).map((rect, i) => {
            const value = choices[i];
            const graphics = this.scene.add.graphics();
            const label = this.scene.add
                .text(rect.x + rect.width / 2, rect.y + rect.height / 2, String(value), textStyle('answer'))
                .setOrigin(0.5);
            const zone = this.scene.add
                .zone(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height)
                .setInteractive();
            const tile: Tile = { rect, graphics, label, zone, value, pressed: false };
            zone.on('pointerdown', () => this.press(tile));
            zone.on('pointerup', () => this.release(tile));
            zone.on('pointerout', () => this.release(tile));
            this.paint(tile);
            return tile;
        });
        // Words and long numbers shrink to stay inside the tile, all labels by the same factor so the row reads evenly.
        const room = (this.tiles[0]?.rect.width ?? 0) - 2 * tiles.border - 24;
        const scale = Math.min(1, ...this.tiles.map((t) => room / t.label.width));
        this.tiles.forEach((t) => t.label.setScale(scale));
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    setVisible(visible: boolean): void {
        this.tiles.forEach((t) => {
            t.graphics.setVisible(visible);
            t.label.setVisible(visible);
            if (t.zone.input) {
                t.zone.input.enabled = visible;
            }
        });
    }

    /** Colours the tile of the correct answer (the pale-green feedback colour). */
    markCorrect(value: Choice | null): void {
        this.correctValue = value;
        this.tiles.forEach((t) => this.paint(t));
    }

    /** Outlines the tile of the answer in the hint colour while the child retypes the result. */
    markHint(value: Choice | null): void {
        this.hintValue = value;
        this.tiles.forEach((t) => this.paint(t));
    }

    /** Centres of the tiles in scene space, for the e2e hook. */
    targets(): { value: Choice; x: number; y: number }[] {
        return this.tiles.map((t) => ({ value: t.value, x: t.rect.x + t.rect.width / 2, y: t.rect.y + t.rect.height / 2 }));
    }

    private press(tile: Tile): void {
        if (!this.active) {
            return;
        }
        tile.pressed = true;
        this.paint(tile);          // synchronous: the highlight comes before any tween
        this.onPick(tile.value);
    }

    private release(tile: Tile): void {
        if (tile.pressed) {
            tile.pressed = false;
            this.paint(tile);
        }
    }

    private paint(tile: Tile): void {
        const { rect, graphics } = tile;
        const { radius, border } = TASK_LAYOUT.tiles;
        const isCorrect = this.correctValue !== null && tile.value === this.correctValue;
        graphics.clear();
        graphics.fillStyle(PLACEHOLDER_COLORS.dotDone, 0.5);          // soft lower edge
        graphics.fillRoundedRect(rect.x, rect.y + 8, rect.width, rect.height, radius);
        graphics.fillStyle(tile.pressed ? PLACEHOLDER_COLORS.pressed : isCorrect ? PLACEHOLDER_COLORS.correct : PLACEHOLDER_COLORS.tile, 1);
        graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
        const isHint = this.hintValue !== null && tile.value === this.hintValue;
        graphics.lineStyle(isHint ? border * 2 : border, isCorrect ? PLACEHOLDER_COLORS.dotDone : isHint ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.tileBorder, 1);
        graphics.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    }

    private destroyTiles(): void {
        this.tiles.forEach((t) => {
            t.graphics.destroy();
            t.label.destroy();
            t.zone.destroy();
        });
        this.tiles = [];
    }
}
