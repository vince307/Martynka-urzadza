import { Scene } from 'phaser';
import { placeByChild } from '../core/placement';
import { GAME_HEIGHT, PLACEHOLDER_FRAME, REGISTRY_KEYS, SCENE_KEYS, WELCOME_LAYOUT } from '../data/layout';
import { pl } from '../data/pl';
import { placementData } from '../data/placement';
import { AgeButton } from '../ui/widgets/AgeButton';
import { drawNotebook } from '../ui/widgets/notebook';
import { textStyle } from '../ui/widgets/textStyle';

/**
 * First screen of a cold start: the brand, "Ile masz lat?" and one button per age. The child taps
 * the age; core/placement turns age and the session's month into the learner (stage), which goes
 * to the registry, and the task scene starts. The scene decides nothing itself.
 */
export class WelcomeScene extends Scene {
    private buttons: { age: number; button: AgeButton }[] = [];
    private chosen = false;

    constructor() {
        super(SCENE_KEYS.welcome);
    }

    create(): void {
        // A restarted scene keeps its fields: start from a clean slate.
        this.buttons = [];
        this.chosen = false;
        drawNotebook(this);
        this.add.text(WELCOME_LAYOUT.brand.x, WELCOME_LAYOUT.brand.y, pl.title, textStyle('brand')).setOrigin(0.5, 0);
        this.add.text(WELCOME_LAYOUT.question.x, WELCOME_LAYOUT.question.y, pl.welcome.question, textStyle('summaryTitle')).setOrigin(0.5, 0);
        const { left, top, width, gap } = WELCOME_LAYOUT.ages;
        placementData.ages.forEach((age, i) => {
            const button = new AgeButton(this, String(age), left + i * (width + gap), top, () => this.choose(age));
            this.buttons.push({ age, button });
        });
        // Build id in the corner, like the task screen: shows on a tablet that a silent update has landed.
        this.add
            .text(PLACEHOLDER_FRAME.margin, GAME_HEIGHT - PLACEHOLDER_FRAME.margin, __BUILD_ID__, textStyle('caption'))
            .setOrigin(0, 1);
    }

    private choose(age: number): void {
        if (this.chosen) {
            return;
        }
        const month = this.registry.get(REGISTRY_KEYS.month) as number | undefined;
        if (month === undefined) {
            throw new Error('Session month is not set (main.ts sets it before the scenes start)');
        }
        this.chosen = true;
        this.registry.set(REGISTRY_KEYS.learner, placeByChild(age, month, placementData));
        this.scene.start(SCENE_KEYS.task);
    }

    /** Centres of the age buttons in 1920x1080 scene space, for the e2e hook. */
    targets(): { ages: readonly { age: number; x: number; y: number }[] } {
        return Object.freeze({ ages: Object.freeze(this.buttons.map(({ age, button }) => Object.freeze({ age, ...button.target() }))) });
    }
}
