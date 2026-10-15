import { describe, expect, it } from 'vitest';
import { blankAsText, fitPieces, layoutPieces, splitBlanks, wrapBlankLines } from '../src/core/round/promptBlank';

const width = (t: string): number => t.length * 10;

describe('promptBlank', () => {
    it('splits with the blank last, middle and first', () => {
        expect(splitBlanks('2 + 9 = □')).toEqual([{ kind: 'text', text: '2 + 9 =' }, { kind: 'blank' }]);
        expect(splitBlanks('4 − □ = 1')).toEqual([
            { kind: 'text', text: '4 −' }, { kind: 'blank' }, { kind: 'text', text: '= 1' },
        ]);
        expect(splitBlanks('□ + 5 = 12')).toEqual([{ kind: 'blank' }, { kind: 'text', text: '+ 5 = 12' }]);
    });

    it('keeps a prompt without a blank as one text piece', () => {
        expect(splitBlanks('38 + 27')).toEqual([{ kind: 'text', text: '38 + 27' }]);
    });

    it('lays the row out centred, with the box between the texts', () => {
        const { placed, width: total } = layoutPieces(splitBlanks('4 − □ = 1'), width, 60, 20);
        expect(total).toBe(30 + 60 + 30 + 40);
        expect(placed.map((p) => p.left)).toEqual([-80, -30, 50]);
        expect(placed[1].piece.kind).toBe('blank');
        expect(placed[1].width).toBe(60);
    });

    it('wraps a sentence with a box into centred lines, the box kept as a box', () => {
        // 10 px per character, box 40, space 10, line limit 260
        const lines = wrapBlankLines('Uzupełnij ciąg: 80, □, 60, 50', width, 40, 10, 260);
        expect(lines).toHaveLength(2);
        const [first, second] = lines;
        expect(first.placed.map((p) => p.piece)).toEqual([{ kind: 'text', text: 'Uzupełnij ciąg: 80,' }, { kind: 'blank' }, { kind: 'text', text: ',' }]);
        expect(first.width).toBe(190 + 10 + 40 + 10);
        expect(first.placed[0].left).toBe(-first.width / 2);
        expect(first.placed[1].left).toBe(-first.width / 2 + 190 + 10);
        expect(first.placed[2].left).toBe(first.placed[1].left + 40);   // the comma is glued to the box
        expect(second.placed.map((p) => p.piece)).toEqual([{ kind: 'text', text: '60, 50' }]);
    });

    it('keeps a single over-long word on its own line', () => {
        expect(wrapBlankLines('abcdefghijklmnopqrstuvwxyz □', width, 40, 10, 100)).toHaveLength(2);
    });

    // Visual gate S-14c: a hint or solution line is plain text, and the font has no "□" (gap 8), so the INEQUALITY hint
    // "2 = 7 − □" showed a tiny system glyph; the text widgets write the blank as "?" (gap 99).
    it('writes every blank of a hint or solution line as a question mark', () => {
        expect(blankAsText('Najpierw znajdź równość: 2 = 7 − □.')).toBe('Najpierw znajdź równość: 2 = 7 − ?.');
        expect(blankAsText('□ + 3 = 8, □ = 5')).toBe('? + 3 = 8, ? = 5');
        expect(blankAsText('7 − 5 = 2')).toBe('7 − 5 = 2');
    });

    // Visual gate S-14c: "6618 = 6000 + 600 + □ + 8" (E6.9) ran off the notebook and under the keypad at the full expression size.
    it('shrinks an expression wider than its room and keeps a short one at full size', () => {
        const pieces = splitBlanks('6618 = 6000 + 600 + □ + 8');   // text 19 + 3 characters, one box
        const full = fitPieces(pieces, width, 40, 10, 1000);
        expect(full.scale).toBe(1);
        expect(full.width).toBe(190 + 30 + 40 + 2 * 10);
        const fit = fitPieces(pieces, width, 40, 10, 140);
        expect(fit.scale).toBeCloseTo(0.5);
        expect(fit.width).toBeCloseTo(140);
        expect(fit.placed[1].width).toBeCloseTo(20);   // the box shrinks with the text
        expect(fit.placed[0].left).toBeCloseTo(-140 / 2);
    });
});
