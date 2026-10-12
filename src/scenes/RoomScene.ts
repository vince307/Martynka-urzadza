import { Scene } from 'phaser';
import { PLACEHOLDER_COLORS, ROOM_LAYOUT, SCENE_KEYS } from '../data/layout';
import { pl } from '../data/pl';
import { PageButton } from '../ui/widgets/PageButton';
import { textStyle } from '../ui/widgets/textStyle';

/**
 * Placeholder room (the real one comes with S-09): a panel drawn in code, a caption and "Wróć do notesu".
 * It keeps no round state: the task scene sleeps underneath and wakes exactly as it was left.
 * DESIGN-GAP (docs/design-gaps.md row 12): the kit has the button only; the caption is ours.
 */
export class RoomScene extends Scene {
    private resume: PageButton | undefined;

    constructor() {
        super(SCENE_KEYS.room);
    }

    create(): void {
        const { panel, caption, resume } = ROOM_LAYOUT;
        const graphics = this.add.graphics();
        graphics.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
        graphics.fillRoundedRect(panel.left, panel.top, panel.width, panel.height, panel.radius);
        this.add.text(caption.x, caption.y, pl.room.caption, textStyle('summaryTitle')).setOrigin(0.5);
        const button = new PageButton(this, () => this.scene.switch(SCENE_KEYS.task));
        this.resume = button;
        button.show(pl.room.resume, resume.left, resume.top, 'primary', false, resume);
        // A wake re-arms the button: a press that began before the switch must not count.
        this.events.on('wake', () => button.show(pl.room.resume, resume.left, resume.top, 'primary', false, resume));
    }

    /** Centre of "Wróć do notesu" in scene space, for the e2e hook. */
    resumeTarget(): { x: number; y: number } | null {
        return this.resume ? this.resume.target() : null;
    }
}
