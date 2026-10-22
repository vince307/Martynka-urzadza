import type { GameObjects, Scene } from 'phaser';
import { selectionAnswer, toggleSelected, type SelectValue } from '../../core/round/select';
import { parseFace } from '../../core/tasks/faces';
import { PLACEHOLDER_COLORS, TASK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ActionButton } from './ActionButton';
import { drawFace } from './faceDraw';
import { tileRow, type Rect } from './geometry';
import { textStyle } from './textStyle';

interface Tile {
    rect: Rect;
    graphics: GameObjects.Graphics;
    label: GameObjects.Text;
    zone: GameObjects.Zone;
    value: SelectValue;
}

/**
 * Multi-select answer: tiles like AnswerTiles that a tap marks and unmarks, and an "OK" that hands the marked numbers in.
 * DESIGN-GAP (docs/design-gaps.md row 54): the kit has a marked-tile look (`.answer.selected`) but no screen for it;
 * the row sits higher than the single-answer row to leave room for "OK" under it.
 */
export class SelectTiles {
    private tiles: Tile[] = [];
    private marked: SelectValue[] = [];
    private active = false;
    private visible = false;
    private correct: readonly SelectValue[] = [];
    private hint: readonly SelectValue[] = [];
    private readonly ok: ActionButton;

    constructor(
        private readonly scene: Scene,
        private readonly onSubmit: (value: SelectValue[]) => void,
    ) {
        this.ok = new ActionButton(scene, () => {
            if (this.active) {
                this.onSubmit(selectionAnswer(this.marked));
            }
        });
    }

    setChoices(choices: readonly SelectValue[]): void {
        this.destroyTiles();
        this.marked = [];
        this.correct = [];
        this.hint = [];
        const { notebook, tiles, select } = TASK_LAYOUT;
        const area: Rect = { x: notebook.left, y: select.top, width: notebook.width, height: tiles.height };
        this.tiles = tileRow(choices.length, area, { width: select.tileWidth, height: tiles.height, gap: tiles.gap }).map((rect, i) => {
            const value = choices[i];
            const graphics = this.scene.add.graphics();
            const label = this.scene.add.text(rect.x + rect.width / 2, rect.y + rect.height / 2, parseFace(value) ? '' : String(value), textStyle('answer')).setOrigin(0.5);
            const zone = this.scene.add.zone(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height).setInteractive();
            const tile: Tile = { rect, graphics, label, zone, value };
            zone.on('pointerdown', () => this.toggle(tile));
            return tile;
        });
        this.applyVisibility();
        this.repaint();
    }

    /** The tiles unmarked (after a wrong set, or a new task). */
    clear(): void {
        this.marked = [];
        this.repaint();
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.applyVisibility();
    }

    /** Colours the tiles of the correct set (the pale-green feedback colour). */
    markCorrect(values: readonly SelectValue[]): void {
        this.correct = values;
        this.repaint();
    }

    /** Outlines the tiles of the correct set in the hint colour while the child retypes the result. */
    markHint(values: readonly SelectValue[]): void {
        this.hint = values;
        this.repaint();
    }

    /** The marked values, in tile order. */
    selected(): readonly SelectValue[] {
        return [...this.marked];
    }

    /** Centres of the tiles in scene space, for the e2e hook. */
    targets(): { value: SelectValue; x: number; y: number }[] {
        return this.tiles.map((t) => ({ value: t.value, x: t.rect.x + t.rect.width / 2, y: t.rect.y + t.rect.height / 2 }));
    }

    /** Centre of "OK" for the hook and the flying star, null while hidden. */
    okTarget(): { x: number; y: number } | null {
        return this.ok.target();
    }

    /** The "OK" face container, for the bounce and wobble of the answer. */
    okFace(): GameObjects.Container {
        return this.ok.faceObject();
    }

    private toggle(tile: Tile): void {
        if (!this.active) {
            return;
        }
        this.marked = toggleSelected(this.marked, tile.value, this.tiles.map((t) => t.value));
        this.repaint();
    }

    private applyVisibility(): void {
        this.tiles.forEach((t) => {
            t.graphics.setVisible(this.visible);
            t.label.setVisible(this.visible);
            if (t.zone.input) {
                t.zone.input.enabled = this.visible;
            }
        });
        if (this.visible && this.tiles.length > 0) {
            const { notebook, select } = TASK_LAYOUT;
            this.ok.showCentered(pl.round.okKey, notebook.left + notebook.width / 2, select.okCenterY, PLACEHOLDER_COLORS.next, PLACEHOLDER_COLORS.nextBorder);
        } else {
            this.ok.hide();
        }
    }

    private repaint(): void {
        this.tiles.forEach((t) => this.paint(t));
    }

    private paint(tile: Tile): void {
        const { rect, graphics } = tile;
        const { radius, border } = TASK_LAYOUT.tiles;
        const marked = this.marked.includes(tile.value);
        const isCorrect = this.correct.includes(tile.value);
        const isHint = this.hint.includes(tile.value);
        graphics.clear();
        graphics.fillStyle(PLACEHOLDER_COLORS.dotDone, 0.5);          // soft lower edge
        graphics.fillRoundedRect(rect.x, rect.y + 8, rect.width, rect.height, radius);
        graphics.fillStyle(isCorrect ? PLACEHOLDER_COLORS.correct : marked ? PLACEHOLDER_COLORS.selected : PLACEHOLDER_COLORS.tile, 1);
        graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
        const color = isCorrect ? PLACEHOLDER_COLORS.dotDone : marked ? PLACEHOLDER_COLORS.selectedBorder : isHint ? PLACEHOLDER_COLORS.butter : PLACEHOLDER_COLORS.tileBorder;
        graphics.lineStyle(marked || isHint ? border * 2 : border, color, 1);
        graphics.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
        const face = parseFace(tile.value);
        if (face) {
            drawFace(graphics, face, rect.x + rect.width / 2, rect.y + rect.height / 2, rect);
        }
        if (marked) {
            // A check mark drawn in the corner (the font has no glyph to rely on): the mark shows without colour.
            const { markSize, markWidth } = TASK_LAYOUT.select;
            const x = rect.x + rect.width - markSize * 2;
            const y = rect.y + markSize * 1.6;
            graphics.lineStyle(markWidth, PLACEHOLDER_COLORS.selectedBorder, 1);
            graphics.beginPath();
            graphics.moveTo(x - markSize / 2, y);
            graphics.lineTo(x - markSize / 6, y + markSize / 2);
            graphics.lineTo(x + markSize / 2, y - markSize / 2);
            graphics.strokePath();
        }
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
