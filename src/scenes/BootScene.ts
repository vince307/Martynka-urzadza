import { Scene } from 'phaser';
import { FONT_KEY, FONT_URL, SCENE_KEYS } from '../data/layout';

/**
 * Loads the task screen font from public/fonts (precached, so it also works
 * offline) and hands over to the task scene. Nothing is drawn here.
 */
export class BootScene extends Scene {
    constructor() {
        super(SCENE_KEYS.boot);
    }

    preload(): void {
        this.load.font(FONT_KEY, FONT_URL, 'truetype');
    }

    create(): void {
        this.scene.start(SCENE_KEYS.task);
    }
}
