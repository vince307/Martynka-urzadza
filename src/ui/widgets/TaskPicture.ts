import type { GameObjects, Scene } from 'phaser';
import type { TaskVisual } from '../../core/tasks/visual';
import { PLACEHOLDER_COLORS } from '../../data/layout';
import { ClockFace } from './ClockFace';
import type { Rect } from './geometry';
import { Ruler } from './Ruler';
import { textStyle } from './textStyle';

/** The drawing of a task: picks the widget of its kind and draws it in the given rectangle. */
export class TaskPicture {
    private readonly clock: ClockFace;
    private readonly ruler: Ruler;
    // Placeholder frame for the kinds whose widgets arrive in phase 5 (blocks, bars): a labelled box, never shown by the game data before then.
    private readonly frame: GameObjects.Graphics;
    private readonly frameLabel: GameObjects.Text;
    private area: Rect | null = null;

    constructor(scene: Scene) {
        this.clock = new ClockFace(scene);
        this.ruler = new Ruler(scene);
        this.frame = scene.add.graphics().setVisible(false);
        this.frameLabel = scene.add.text(0, 0, '', textStyle('prompt')).setOrigin(0.5).setVisible(false);
    }

    /** Draws `visual` in `rect`; null hides the picture. */
    render(visual: TaskVisual | null, rect: Rect): void {
        this.hide();
        if (!visual) {
            return;
        }
        this.area = rect;
        switch (visual.kind) {
            case 'clock':
                this.clock.render(visual.hour, visual.minute, rect);
                break;
            case 'ruler':
                this.ruler.render(visual.unit, visual.lengthCm, visual.fromMm, visual.toMm, rect);
                break;
            default:
                this.drawFrame(visual.kind, rect);
        }
    }

    hide(): void {
        this.area = null;
        this.clock.setVisible(false);
        this.ruler.setVisible(false);
        this.frame.clear().setVisible(false);
        this.frameLabel.setVisible(false);
    }

    /** The rectangle the picture was drawn in, null while hidden (e2e hook). */
    bounds(): Rect | null {
        return this.area ? { ...this.area } : null;
    }

    private drawFrame(label: string, rect: Rect): void {
        this.frame.clear().setVisible(true);
        this.frame.lineStyle(4, PLACEHOLDER_COLORS.tileBorder, 1);
        this.frame.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 24);
        this.frameLabel.setText(label).setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2).setVisible(true);
    }
}
