import { describe, expect, it } from 'vitest';
import { isExpression } from '../src/core/round/prompt';
import { placementData } from '../src/data/placement';
import { FONT_SIZES, FONT_WEIGHT_RANGE, FONT_WEIGHTS, GAME_HEIGHT, GAME_WIDTH, HUD_LAYOUT, HUD_TOUCH_TARGETS, MIN_TOUCH_TARGET, PLACEHOLDER_COLORS, ROOM_LAYOUT, SUMMARY_LAYOUT, TASK_LAYOUT, TASK_TOUCH_TARGETS, UNLOCK_LAYOUT, WELCOME_LAYOUT, WELCOME_TOUCH_TARGETS } from '../src/data/layout';

describe('task screen layout constants', () => {
    it('keeps every touch target at least the minimum size', () => {
        for (const [name, size] of Object.entries(TASK_TOUCH_TARGETS)) {
            expect(size.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(size.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
    });

    it('keeps the HUD speaker a touch target, inside the screen and clear of the star counter', () => {
        for (const [name, size] of Object.entries(HUD_TOUCH_TARGETS)) {
            expect(size.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(size.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        const { speaker } = HUD_LAYOUT;
        const counter = TASK_LAYOUT.starCounter;
        expect(speaker.left).toBeGreaterThanOrEqual(0);
        expect(speaker.top).toBeGreaterThanOrEqual(0);
        expect(speaker.left + speaker.width).toBeLessThanOrEqual(GAME_WIDTH);
        expect(speaker.top + speaker.height).toBeLessThanOrEqual(GAME_HEIGHT);
        expect(speaker.left + speaker.width).toBeLessThanOrEqual(counter.left);   // no overlap with the counter
        expect(speaker.top).toBeLessThanOrEqual(counter.top + counter.height);
    });

    it('keeps the HUD room switch a touch target in the top left, clear of the progress dots and the speaker', () => {
        const { roomSwitch, speaker } = HUD_LAYOUT;
        expect(HUD_TOUCH_TARGETS.roomSwitch).toEqual({ width: roomSwitch.width, height: roomSwitch.height });
        expect(roomSwitch.left).toBeGreaterThanOrEqual(0);
        expect(roomSwitch.top).toBeGreaterThanOrEqual(0);
        expect(roomSwitch.left + roomSwitch.width).toBeLessThanOrEqual(speaker.left);
        const dots = TASK_LAYOUT.dots;
        const dotsLeft = dots.centerX - (2 * dots.gap + dots.radius + dots.ringWidth);   // five dots, centred
        expect(roomSwitch.left + roomSwitch.width).toBeLessThanOrEqual(dotsLeft);
    });

    it('keeps the summary page buttons touch targets, side by side without overlap, inside the notebook', () => {
        const { width, height, left, gap, top } = SUMMARY_LAYOUT.buttons;
        expect(TASK_TOUCH_TARGETS.pageButton).toEqual({ width, height });
        const notebook = TASK_LAYOUT.notebook;
        expect(gap).toBeGreaterThan(0);                                   // the two buttons do not overlap
        expect(left + 2 * width + gap).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        const { stars } = SUMMARY_LAYOUT;
        expect(stars.top + stars.size).toBeLessThan(SUMMARY_LAYOUT.earned.top);   // star row sits above "+N"
    });

    it('keeps the unlock card button a touch target, centred inside the card, which sits inside the notebook', () => {
        const { card, button, art, name } = UNLOCK_LAYOUT;
        expect(TASK_TOUCH_TARGETS.unlockNext).toEqual({ width: button.width, height: button.height });
        expect(button.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(button.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(button.left + button.width / 2).toBe(card.left + card.width / 2);
        expect(button.top + button.height).toBeLessThanOrEqual(card.top + card.height - card.border);
        expect(art.top + art.size).toBeLessThan(name.y);                          // the art sits above the name
        expect(name.y + FONT_SIZES.unlockName).toBeLessThan(button.top);          // the name sits above the button
        const notebook = TASK_LAYOUT.notebook;
        expect(card.left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(card.left + card.width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(card.top + card.height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
    });

    it('keeps the room placeholder\'s way back a touch target inside the room panel', () => {
        const { resume, panel } = ROOM_LAYOUT;
        expect(TASK_TOUCH_TARGETS.resume).toEqual({ width: resume.width, height: resume.height });
        expect(resume.left).toBeGreaterThanOrEqual(panel.left);
        expect(resume.left + resume.width).toBeLessThanOrEqual(panel.left + panel.width);
        expect(resume.top + resume.height).toBeLessThanOrEqual(panel.top + panel.height);
    });

    it('keeps the welcome age buttons touch targets, side by side without overlap, inside the notebook', () => {
        const { left, top, width, height, gap } = WELCOME_LAYOUT.ages;
        expect(WELCOME_TOUCH_TARGETS.age).toEqual({ width, height });
        expect(WELCOME_TOUCH_TARGETS.age.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(WELCOME_TOUCH_TARGETS.age.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(gap).toBeGreaterThan(0);
        const notebook = TASK_LAYOUT.notebook;
        const count = placementData.ages.length;
        expect(left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(left + count * width + (count - 1) * gap).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height + WELCOME_LAYOUT.ages.shadow).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        expect(WELCOME_LAYOUT.question.y + FONT_SIZES.summaryTitle).toBeLessThan(top);   // the question sits above the buttons
    });

    it('keeps the welcome parent button a touch target, inside the notebook and clear of the age buttons', () => {
        const { left, top, width, height } = WELCOME_LAYOUT.parent;
        expect(WELCOME_TOUCH_TARGETS.parent).toEqual({ width, height });
        expect(WELCOME_TOUCH_TARGETS.parent.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(WELCOME_TOUCH_TARGETS.parent.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        // Visual gate S-06: the button used to straddle the notebook's bottom-right border; it sits inside, like the kit's page buttons.
        const notebook = TASK_LAYOUT.notebook;
        expect(left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(left + width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        const ages = WELCOME_LAYOUT.ages;
        expect(top).toBeGreaterThanOrEqual(ages.top + ages.height + ages.shadow);
    });

    it('uses the kit tile height of 136 px, not smaller', () => {
        expect(TASK_LAYOUT.tiles.height).toBeGreaterThanOrEqual(136);
    });

    it('keeps the prompt font at 64 px or more', () => {
        expect(FONT_SIZES.prompt).toBeGreaterThanOrEqual(64);
    });

    it('uses the style guide weights (650-750) for every kit text role, inside the font range', () => {
        const [min, max] = FONT_WEIGHT_RANGE.split(' ').map(Number);
        for (const [role, weight] of Object.entries(FONT_WEIGHTS)) {
            expect(weight, role).toBeGreaterThanOrEqual(min);
            expect(weight, role).toBeLessThanOrEqual(max);
            if (role !== 'caption' && role !== 'brand' && role !== 'unlockTitle') {   // the build id is technical; the kit brand line and the unlock title are 800 (.welcome-brand, .unlock-card h2)
                expect(weight, role).toBeGreaterThanOrEqual(650);
                expect(weight, role).toBeLessThanOrEqual(750);
            }
        }
    });

    it('fits four tiles and the keypad inside the notebook', () => {
        const { tiles, keypad, notebook } = TASK_LAYOUT;
        const tilesRight = tiles.left + 4 * tiles.width + 3 * tiles.gap;
        expect(tilesRight).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(keypad.left + keypad.width).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(3 * keypad.keyWidth + 2 * keypad.gap).toBe(keypad.width);
    });

    it('keeps the solution lines (expression centre, bar width) inside the notebook and left of the keypad', () => {
        const { notebook, keypad, barSpan, expression, expressionWide } = TASK_LAYOUT;
        const inner = { left: notebook.left + notebook.border, right: notebook.left + notebook.width - notebook.border };
        for (const [centre, width, right] of [
            [expressionWide.x, barSpan.tiles.width, inner.right],
            [expression.x, barSpan.keypad.width, keypad.left],
        ] as const) {
            expect(centre - width / 2).toBeGreaterThanOrEqual(inner.left);
            expect(centre + width / 2).toBeLessThanOrEqual(right);
        }
    });

    it('draws colours from the palette as valid RGB numbers', () => {
        for (const color of Object.values(PLACEHOLDER_COLORS)) {
            expect(Number.isInteger(color) && color >= 0 && color <= 0xffffff).toBe(true);
        }
    });
});

describe('isExpression', () => {
    it('recognises bare calculations and rejects sentences', () => {
        expect(isExpression('38 + 27')).toBe(true);
        expect(isExpression('17 − 8 = □')).toBe(true);
        expect(isExpression('Ile jest filiżanek?')).toBe(false);
        expect(isExpression('Liczba 3 jest parzysta czy nieparzysta?')).toBe(false);
    });
});
