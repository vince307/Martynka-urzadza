import type { GameObjects, Scene } from 'phaser';
import { keypadDisplay, keypadInput, type KeypadKey } from '../../core/round/keypad';
import { staggerDelays } from '../../core/motion';
import { ANIMATION, LIPS, PLACEHOLDER_COLORS, TASK_LAYOUT, TEXT_COLOR } from '../../data/layout';
import { textStyle } from './textStyle';
import { pl } from '../../data/pl';
import { ChunkyFace } from './chunky';
import { keypadGrid, type Rect } from './geometry';


interface Button {
    key: KeypadKey;
    rect: Rect;
    chunky: ChunkyFace;
    graphics: GameObjects.Graphics;
    pressed: boolean;
}

const labelOf = (key: KeypadKey): string => (key === 'delete' ? pl.round.deleteKey : key === 'ok' ? pl.round.okKey : key);

/** Entry field and 12 keys. The buffer logic lives in core (keypadInput); the widget only draws it. */
export class Keypad {
    private buffer = '';
    private active = false;
    private correct = false;
    private keyMode = false;   // the keys go to the scene (digit boxes), the entry field stays hidden
    private visible = true;
    private readonly buttons: Button[] = [];
    private readonly field: Rect;
    private readonly fieldGraphics: GameObjects.Graphics;
    private readonly fieldText: GameObjects.Text;
    private readonly fieldBox: GameObjects.Container;   // centre container of the entry field: what bounces or wobbles
    private readonly objects: GameObjects.GameObject[] = [];
    private readonly chunkies: ChunkyFace[] = [];

    constructor(
        scene: Scene,
        private readonly maxDigits: number,
        private readonly onSubmit: (value: number) => void,
        private readonly onKey?: (key: KeypadKey) => void,
    ) {
        const grid = keypadGrid(TASK_LAYOUT.keypad);
        this.field = grid.field;
        this.fieldGraphics = scene.add.graphics();
        this.fieldText = scene.add
            .text(this.field.x + this.field.width / 2, this.field.y + this.field.height / 2, '', textStyle('answer'))
            .setOrigin(0.5);
        // Outer container at the field centre, inner one at minus the centre: the field keeps drawing in scene coordinates.
        const inner = scene.add.container(-(this.field.x + this.field.width / 2), -(this.field.y + this.field.height / 2), [this.fieldGraphics, this.fieldText]);
        this.fieldBox = scene.add.container(this.field.x + this.field.width / 2, this.field.y + this.field.height / 2, [inner]);
        this.objects.push(this.fieldBox);
        for (const { key, rect } of grid.keys) {
            const graphics = scene.add.graphics();
            const label = scene.add
                .text(rect.x + rect.width / 2, rect.y + rect.height / 2, labelOf(key), textStyle(key === 'delete' || key === 'ok' ? 'keyLabel' : 'key'))
                .setOrigin(0.5);
            const zone = scene.add.zone(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height).setInteractive();
            const chunky = new ChunkyFace(scene, rect, LIPS.key, TASK_LAYOUT.keypad.radius);
            chunky.add(graphics, label);
            const button: Button = { key, rect, chunky, graphics, pressed: false };
            zone.on('pointerdown', () => this.press(button));
            zone.on('pointerup', () => this.release(button));
            zone.on('pointerout', () => this.release(button));
            this.buttons.push(button);
            this.objects.push(zone);
            this.chunkies.push(chunky);
            this.paintButton(button);
        }
        this.paintField();
    }

    setActive(active: boolean): void {
        this.active = active;
    }

    /** Key mode (the 'digits' task): every key is handed to `onKey`, the entry field is not drawn. */
    setKeyMode(on: boolean): void {
        if (on === this.keyMode) {
            return;   // render() calls this on every redraw; only a change of mode clears what was typed
        }
        this.keyMode = on;
        this.buffer = '';
        this.paintField();
        this.setVisible(this.visible);
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.chunkies.forEach((c) => c.setVisible(visible));
        this.objects.forEach((o) => {
            const shown = visible && !(this.keyMode && o === this.fieldBox);
            (o as GameObjects.GameObject & { setVisible(v: boolean): unknown }).setVisible(shown);
            if (o.input) {
                o.input.enabled = visible;
            }
        });
    }

    /** Entrance stagger of the keys for a new task (zones stay live, a tap settles the key); the entry field stays at rest. */
    enter(): void {
        const delays = staggerDelays(this.chunkies.length, ANIMATION.entranceSpanMs, ANIMATION.entranceItemMs);
        this.chunkies.forEach((c, i) => c.enter(delays[i]));
    }

    /** The entry field as one container, for the bounce and wobble of the answer and the star's start. */
    entryFace(): GameObjects.Container {
        return this.fieldBox;
    }

    /** Centre of the entry field in scene space (where the flying star starts). */
    entryTarget(): { x: number; y: number } {
        return { x: this.field.x + this.field.width / 2, y: this.field.y + this.field.height / 2 };
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
        button.chunky.press();
        if (this.keyMode) {
            this.onKey?.(button.key);
            return;
        }
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
            button.chunky.release();
        }
    }

    private paintButton({ key, rect, graphics, pressed }: Button): void {
        const { radius } = TASK_LAYOUT.keypad;
        const fill = key === 'ok' ? PLACEHOLDER_COLORS.next : key === 'delete' ? PLACEHOLDER_COLORS.hint : PLACEHOLDER_COLORS.tile;
        graphics.clear();
        graphics.fillStyle(pressed ? PLACEHOLDER_COLORS.pressed : fill, 1);
        graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
        graphics.lineStyle(TASK_LAYOUT.keypad.keyBorder, key === 'ok' ? PLACEHOLDER_COLORS.nextBorder : PLACEHOLDER_COLORS.tileBorder, 1);
        graphics.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, radius);
    }

    private paintField(): void {
        const { x, y, width, height } = this.field;
        this.fieldGraphics.clear();
        this.fieldGraphics.fillStyle(this.correct ? PLACEHOLDER_COLORS.correct : PLACEHOLDER_COLORS.field, 1);
        this.fieldGraphics.fillRoundedRect(x, y, width, height, TASK_LAYOUT.keypad.radius);
        this.fieldGraphics.lineStyle(TASK_LAYOUT.keypad.fieldBorder, this.correct ? PLACEHOLDER_COLORS.dotDone : PLACEHOLDER_COLORS.tileBorder, 1);
        this.fieldGraphics.strokeRoundedRect(x, y, width, height, TASK_LAYOUT.keypad.radius);
        // Grouped like every number on screen (visual gate S-14c: "220000" against "220 000" in the solution); a long number shrinks to the field.
        this.fieldText.setScale(1).setText(this.buffer === '' ? '?' : keypadDisplay(this.buffer));
        this.fieldText.setScale(Math.min(1, (width - 2 * TASK_LAYOUT.keypad.fieldPadding) / this.fieldText.width));
        this.fieldText.setColor(this.buffer === '' ? `#${PLACEHOLDER_COLORS.fieldPlaceholder.toString(16)}` : TEXT_COLOR);
    }
}
