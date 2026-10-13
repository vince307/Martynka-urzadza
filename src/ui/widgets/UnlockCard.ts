import type { GameObjects, Scene } from 'phaser';
import { PLACEHOLDER_COLORS, UNLOCK_LAYOUT } from '../../data/layout';
import { pl } from '../../data/pl';
import { PageButton } from './PageButton';
import { textStyle } from './textStyle';

/**
 * The "Nowa umiejętność!" card on the notebook (kit unlock.png): a butter-framed card with the title, a book,
 * the name of the unlocked step and the "Dalej" button. It draws the name it is given and decides nothing.
 * DESIGN-GAP (docs/design-gaps.md row 22): the kit's book art (assets/icons/book.png) waits for S-16; a book is drawn in code.
 */
export class UnlockCard {
    private readonly card: GameObjects.Graphics;
    private readonly book: GameObjects.Graphics;
    private readonly title: GameObjects.Text;
    private readonly name: GameObjects.Text;
    private readonly next: PageButton;

    constructor(scene: Scene, onNext: () => void) {
        const { title, name } = UNLOCK_LAYOUT;
        this.card = scene.add.graphics();
        this.book = scene.add.graphics();
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
        this.drawBook(art.centerX - art.size / 2, art.top, art.size);
        this.title.setVisible(true);
        this.name.setText(stepName).setVisible(true);
        this.next.show(pl.unlock.next, button.left, button.top, 'primary', false, button);
    }

    /** Placeholder book: a closed cover with a spine band and a page edge, in the art pack palette. */
    private drawBook(left: number, top: number, size: number): void {
        const g = this.book.setVisible(true);
        g.clear();
        const width = size * 0.8;
        const x = left + (size - width) / 2;
        g.fillStyle(PLACEHOLDER_COLORS.turquoise, 1);
        g.fillRoundedRect(x, top, width, size, 16);
        g.lineStyle(4, PLACEHOLDER_COLORS.deepTeal, 1);
        g.strokeRoundedRect(x, top, width, size, 16);
        g.fillStyle(PLACEHOLDER_COLORS.deepTeal, 1);
        g.fillRect(x + 4, top + 4, width * 0.14, size - 8);
        g.fillStyle(PLACEHOLDER_COLORS.ivory, 1);
        g.fillRoundedRect(x + width * 0.3, top + size * 0.2, width * 0.55, size * 0.3, 8);
    }

    hide(): void {
        this.card.setVisible(false);
        this.book.setVisible(false);
        this.title.setVisible(false);
        this.name.setVisible(false);
        this.next.hide();
    }

    /** Centre of "Dalej" in scene space, for the e2e hook; null while hidden. */
    target(): { x: number; y: number } | null {
        return this.next.target();
    }
}
