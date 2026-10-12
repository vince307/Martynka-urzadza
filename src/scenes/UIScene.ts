import { Scene } from 'phaser';
import { REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { StarCounter } from '../ui/widgets/StarCounter';

/**
 * Overlay above the task scene: the star counter. It reads the registry key
 * the task scene keeps up to date and takes no input.
 */
export class UIScene extends Scene {
    private counter!: StarCounter;

    constructor() {
        super(SCENE_KEYS.ui);
    }

    create(): void {
        const stars = (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
        this.counter = new StarCounter(this, stars);
        const onStars = (_parent: unknown, value: number): void => this.counter.setValue(value);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        this.events.once('shutdown', () => this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars));
        this.input.enabled = false;
    }
}
