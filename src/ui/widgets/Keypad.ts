import type { GameObjects, Scene } from 'phaser';
import { keypadInput, type KeypadKey } from '../../core/round/keypad';
import { FONT_FAMILY, FONT_SIZES, PLACEHOLDER_COLORS, PAGE_BACKGROUND, TASK_LAYOUT, TEXT_COLOR } from '../../data/layout';
import { pl } from '../../data/pl';
import { keypadGrid, type Rect } from './geometry';


interface Button {
    key: KeypadKey;
    rect: Rect;
    graphics: GameObjects.Graphics;
    pressed: boolean;
}

const labelOf = (key: KeypadKey): string => (key === 'delete' ? pl.round.deleteKey : key === 'ok' ? pl.round.okKey : key);

/** Entry field and 12 keys. The buffer logic lives in core (keypadInput); the widget only draws it. */
export class Keypad {
    private buffer = '';
    private active = false;
    private correct = false;
    private readonly buttons: Button[] = [];
    private readonly field: Rect;
    private readonly fieldGraphics: GameObjects.Graphics;
    private readonly fieldText: GameObjects.Text;
    private readonly objects: GameObjects.GameObject[] = [];

    constructor(
        scene: Scene,
        private readonly maxDigits: number,
        private readonly onSubmit: (value: number) => void,
    ) {
        const grid = keypadGrid(TASK_LAYOUT.keypad);
        this.field = grid.field;
        this.fieldGraphics = scene.add.graphics();
        this.fieldText = scene.add
            .text(this.field.x + this.field.width / 2, this.field.y + this.field.height / 2, '', {
                fontFamily: FONT_FAMILY,
                fontSize: `${FONT_SIZES.answer}px`,
                color: TEXT_COLOR,
            })
            .setOrigin(0.5);
        this.objects.push(this.fieldGraphics, this.fieldText);
        for (const { key, rect } of grid.keys) {
            const graphics = scene.add.graphics();
            const label = scene.add
                .text(rect.x + rect.width / 2, rect.y + rect.height / 2, labelOf(key), {
                    fontFamily: FONT_FAMILY,
                    fontSize: `${key === 'delete' || key === 'ok' ? FONT_SIZES.keyLabel : FONT_SIZES.key}px`,
                    color: key === 'ok' ? PAGE_BACKGROUND : TEXT_COLOR,
                })
                .setOrigin(0.5);
            const zone = scene.add.zone(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height).setInteractive();
            const button: Button = { key, rect, graphics, pressed: false };
            zone.on('pointerdown', () => this.press(button));
            zone.on('pointerup', () => this.release(button));
            zone.on('pointerout', () => this.release(button));
            this.buttons.push(button);
            this.objects.push(graphics, label, zone);
            this.paintButton(button);
        }
        this.paintField();
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    setVisible(visible: boolean): void {
        this.objects.forEach((o) => {
            (o as GameObjects.GameObject & { setVisible(v: boolean): unknown }).setVisible(visible);
            if (o.input) {
                o.input.enabled = visible;
            }
        });
    }

    /** Clears the typed digits (new task or a wrong answer). */
    reset(): void {
        this.buffer = '';
        this.correct = false;
        this.paintField();
    }

    /** Turns the entry field the feedback colour; the typed number stays visible. */
    markCorrect(): void {
        this.correct = true;
        this.paintField();
    }

    /** Centres of the keys in scene space, for the e2e hook. */
    targets(): { key: KeypadKey; x: number; y: number }[] {
        return this.buttons.map((b) => ({ key: b.key, x: b.rect.x + b.rect.width / 2, y: b.rect.y + b.rect.height / 2 }));
    }

    private press(button: Button): void {
        if (!this.active) {
            return;
        }
        button.pressed = true;
        this.paintButton(button);   // synchronous highlight
        const result = keypadInput(this.buffer, button.key, this.maxDigits);
        this.buffer = result.buffer;
        this.paintField();
        if (result.submit !== null) {
            this.onSubmit(result.submit);
        }
    }

    private release(button: Button): void {
        if (button.pressed) {
            button.pressed = false;
            this.paintButton(button);
        }
    }

    private paintButton({ key, rect, graphics, pressed }: Button): void {
        const { radius } = TASK_LAYOUT.keypad;
        const fill = key === 'ok' ? PLACEHOLDER_COLORS.turquoise : key === 'delete' ? PLACEHOLDER_COLORS.hint : PLACEHOLDER_COLORS.tile;
        graphics.clear();
        graphics.fillStyle(PLACEHOLDER_COLORS.dotDone, 0.5);
        graphics.fillRoundedRect(rect.x, rect.y + 6, rect.width, rect.height, radius);
        graphics.fillStyle(pressed ? PLACEHOLDER_COLORS.pressed : fill, 1);
        graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
        graphics.lineStyle(3, key === 'ok' ? PLACEHOLDER_COLORS.deepTeal : PLACEHOLDER_COLORS.tileBorder, 1);
        graphics.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    }

    private paintField(): void {
        const { x, y, width, height } = this.field;
        this.fieldGraphics.clear();
        this.fieldGraphics.fillStyle(this.correct ? PLACEHOLDER_COLORS.correct : PLACEHOLDER_COLORS.field, 1);
        this.fieldGraphics.fillRoundedRect(x, y, width, height, TASK_LAYOUT.keypad.radius);
        this.fieldGraphics.lineStyle(4, this.correct ? PLACEHOLDER_COLORS.dotDone : PLACEHOLDER_COLORS.tileBorder, 1);
        this.fieldGraphics.strokeRoundedRect(x, y, width, height, TASK_LAYOUT.keypad.radius);
        this.fieldText.setText(this.buffer === '' ? '?' : this.buffer);
        this.fieldText.setColor(this.buffer === '' ? `#${PLACEHOLDER_COLORS.fieldPlaceholder.toString(16)}` : TEXT_COLOR);
    }
}
