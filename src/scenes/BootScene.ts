import { Scene } from 'phaser';
import { needsPlacement, type SessionLearner } from '../core/placement';
import { FONT_KEY, FONT_URL, FONT_WEIGHT_RANGE, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';

/**
 * Loads the task screen font from public/fonts (precached, so it also works
 * offline) and hands over: to the welcome screen while the session has no learner,
 * otherwise to the task scene. Nothing is drawn here.
 */
export class BootScene extends Scene {
    constructor() {
        super(SCENE_KEYS.boot);
    }

    preload(): void {
        this.load.font(FONT_KEY, FONT_URL, 'truetype', { weight: FONT_WEIGHT_RANGE });
    }

    create(): void {
        const learner = (this.registry.get(REGISTRY_KEYS.learner) as SessionLearner | undefined) ?? null;
        this.scene.start(needsPlacement(learner) ? SCENE_KEYS.welcome : SCENE_KEYS.task);
    }
}
