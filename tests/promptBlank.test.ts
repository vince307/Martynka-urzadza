import { describe, expect, it } from 'vitest';
import { layoutPieces, splitBlanks } from '../src/core/round/promptBlank';

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
});
