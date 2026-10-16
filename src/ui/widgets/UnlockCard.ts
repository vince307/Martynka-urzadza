import type { GameObjects, Scene } from 'phaser';
import { firstLoaded } from '../../core/artPick';
import { ART_KEYS } from '../../data/taskArt';
import { UI_ART_KEYS } from '../../data/uiArt';
import { PLACEHOLDER_COLORS, UNLOCK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { ArtImage } from './ArtImage';
import { PageButton } from './PageButton';
import { textStyle } from './textStyle';

/**
 * The "Nowa umiejętność!" card on the notebook (kit unlock.png): a butter-framed card with the title, a book,
 * the name of the unlocked step and the "Dalej" button. It draws the name it is given and decides nothing.
 * The picture is the pack notebook, else the counting icon `book` (ArtImage keeps a Polish stand-in box when neither texture exists).
 */
export class UnlockCard {
    private readonly card: GameObjects.Graphics;
    private readonly book: ArtImage;
    private readonly title: GameObjects.Text;
    private readonly name: GameObjects.Text;
    private readonly next: PageButton;

    constructor(private readonly scene: Scene, onNext: () => void) {
        const { title, name } = UNLOCK_LAYOUT;
        this.card = scene.add.graphics();
        this.book = new ArtImage(scene);
        this.title = scene.add.text(title.x, title.y, pl.unlock.title, textStyle('unlockTitle')).setOrigin(0.5, 0);
        this.name = scene.add
            .text(name.x, name.y, '', { ...textStyle('unlockName'), align: 'center', wordWrap: { width: name.maxWidth } })
            .setOrigin(0.5, 0);
        this.next = new PageButton(scene, onNext);
        this.hide();
    }

    show(stepName: string): void {
        const { card, art, button } = UNLOCK_LAYOUT;
        this.card.setVisible(true).clear();
        this.card.fillStyle(PLACEHOLDER_COLORS.unlockCard, 1);
        this.card.fillRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        this.card.lineStyle(card.border, PLACEHOLDER_COLORS.unlockBorder, 1);
        this.card.strokeRoundedRect(card.left, card.top, card.width, card.height, card.radius);
        const bookKey = firstLoaded([UI_ART_KEYS.notebook, ART_KEYS.icon('book')], (key) => this.scene.textures.exists(key)) ?? ART_KEYS.icon('book');
        this.book.show(bookKey, { x: art.centerX - art.size / 2, y: art.top, width: art.size, height: art.size });
        this.title.setVisible(true);
        this.name.setText(stepName).setVisible(true);
        this.next.show(pl.unlock.next, button.left, button.top, 'primary', false, button);
    }

    hide(): void {
        this.card.setVisible(false);
        this.book.hide();
        this.title.setVisible(false);
        this.name.setVisible(false);
        this.next.hide();
    }

    /** Centre of "Dalej" in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        return this.next.target();
    }
}
