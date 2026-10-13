import { describe, expect, it } from 'vitest';
import { layoutPieces, splitBlanks, wrapBlankLines } from '../src/core/round/promptBlank';

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
});
