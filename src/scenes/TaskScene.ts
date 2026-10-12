import { Scene } from 'phaser';
import { createRng } from '../core/rng';
import { startRound, type RoundState } from '../core/round';
import { isExpression } from '../core/round/prompt';
import { buildRound } from '../core/round/pick';
import { roundView } from '../core/round/view';
import { getStage } from '../data/curriculum';
import { balance } from '../data/balance';
import {
    FONT_FAMILY,
    FONT_SIZES,
    GAME_HEIGHT,
    PLACEHOLDER_COLORS,
    PLACEHOLDER_FRAME,
    SCENE_KEYS,
    TASK_LAYOUT,
} from '../data/layout';
import { pl } from '../data/pl';
import { ProgressDots } from '../ui/widgets/ProgressDots';

const toCssColor = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

/**
 * One round of tasks. The scene keeps a RoundState from core and draws
 * roundView(state); input arrives in the next phases.
 */
export class TaskScene extends Scene {
    private state!: RoundState;
    private dots!: ProgressDots;

    constructor() {
        super(SCENE_KEYS.task);
    }

    create(): void {
        const stage = getStage(balance.defaultStage);
        if (!stage) {
            throw new Error(`Unknown default stage ${balance.defaultStage}`);
        }
        const rng = createRng(Date.now() >>> 0);
        this.state = startRound(buildRound(stage, rng, balance.round, balance.tiles.count), balance.round);
        this.drawNotebook();
        this.dots = new ProgressDots(this);
        this.drawTask();

        // Build id in the corner: the only way to see on a tablet that a silent
        // PWA update has landed. Technical identifier, not player-facing text.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, {
                fontFamily: FONT_FAMILY,
                fontSize: `${FONT_SIZES.caption}px`,
                color: toCssColor(PLACEHOLDER_COLORS.deepTeal),
            })
            .setOrigin(0, 1);
    }

    private drawNotebook(): void {
        const { left, top, width, height, border, radius } = TASK_LAYOUT.notebook;
        const graphics = this.add.graphics();
        graphics.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
        graphics.fillRoundedRect(left, top, width, height, radius);
        graphics.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        graphics.fillRoundedRect(left + border, top + border, width - 2 * border, height - 2 * border, radius - border / 2);
    }

    private drawTask(): void {
        const view = roundView(this.state, pl.round.resultLine);
        this.dots.update(view.dots);

        const task = this.state.tasks[this.state.index];
        const color = toCssColor(PLACEHOLDER_COLORS.deepTeal);
        const { prompt, expression } = TASK_LAYOUT;
        if (isExpression(task.prompt)) {
            this.add
                .text(prompt.x, prompt.y, pl.round.calculate, { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.prompt}px`, color })
                .setOrigin(0.5);
            this.add
                .text(expression.x, expression.y, task.prompt, { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZES.expression}px`, color })
                .setOrigin(0.5);
        } else {
            this.add
                .text(prompt.x, prompt.y, task.prompt, {
                    fontFamily: FONT_FAMILY,
                    fontSize: `${FONT_SIZES.prompt}px`,
                    color,
                    align: 'center',
                    wordWrap: { width: prompt.maxWidth },
                })
                .setOrigin(0.5, 0);
        }
    }
}
