// Face codes of tile choices (S-14d): parsing, round trip and the words a parent or the narrator hears.
import { describe, expect, it } from 'vitest';
import { faceKey, faceLabel, faceText, isFace, parseFace } from '../src/core/tasks/faces';
import { COLOUR_IDS, FIGURE_IDS, SIZE_IDS } from '../src/data/shapes';

describe('parseFace / faceKey / isFace', () => {
    it('reads the code into figure, colour and size', () => {
        expect(parseFace('shape:triangle:red:big')).toEqual({ figure: 'triangle', colour: 'red', size: 'big' });
    });

    it('round-trips every combination', () => {
        for (const figure of FIGURE_IDS) {
            for (const colour of COLOUR_IDS) {
                for (const size of SIZE_IDS) {
                    const code = faceKey({ figure, colour, size });
                    expect(code).toBe(`shape:${figure}:${colour}:${size}`);
                    expect(parseFace(code)).toEqual({ figure, colour, size });
                    expect(isFace(code)).toBe(true);
                }
            }
        }
    });

    it('refuses anything that is not a face', () => {
        for (const value of ['shape:cube:red:big', 'shape:circle:pink:big', 'shape:circle:red:huge', 'shape:circle:red', 'circle', 'parzysta', '7', 7, null, undefined, ['shape:circle:red:big']]) {
            expect(parseFace(value), String(value)).toBeNull();
            expect(isFace(value), String(value)).toBe(false);
        }
    });
});

describe('faceLabel', () => {
    it('says size, colour and figure with the gender of the figure', () => {
        expect(faceLabel('shape:triangle:red:big')).toBe('duży czerwony trójkąt');
        expect(faceLabel('shape:circle:blue:small')).toBe('małe niebieskie koło');
        expect(faceLabel('shape:star:yellow:big')).toBe('duża żółta gwiazdka');
        expect(faceLabel('shape:heart:green:small')).toBe('małe zielone serce');
        expect(faceLabel('shape:rectangle:green:big')).toBe('duży zielony prostokąt');
    });

    it('can leave the size out', () => {
        expect(faceLabel('shape:triangle:red:big', { size: false })).toBe('czerwony trójkąt');
        expect(faceLabel('shape:star:blue:small', { size: false })).toBe('niebieska gwiazdka');
    });

    it('never contains the code', () => {
        for (const figure of FIGURE_IDS) {
            expect(faceLabel(faceKey({ figure, colour: 'red', size: 'big' }))).not.toContain('shape');
        }
    });

    it('throws for a value that is not a face', () => {
        expect(() => faceLabel('parzysta')).toThrow(TypeError);
    });
});

describe('faceText', () => {
    it('turns a face into its words and leaves other values alone', () => {
        expect(faceText('shape:square:green:small')).toBe('mały zielony kwadrat');
        expect(faceText('parzysta')).toBe('parzysta');
        expect(faceText(12)).toBe(12);
    });
});
