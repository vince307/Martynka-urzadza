// Roman numerals for 1–3999 (the game needs I–XII in E3/E5 and up to MM in E6).

const VALUES: readonly [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export const toRoman = (n: number): string => {
    if (!Number.isInteger(n) || n < 1 || n > 3999) {
        throw new RangeError(`toRoman() supports 1..3999, got ${n}`);
    }
    let rest = n;
    let out = '';
    for (const [value, glyph] of VALUES) {
        while (rest >= value) {
            out += glyph;
            rest -= value;
        }
    }
    return out;
};

export const fromRoman = (text: string): number => {
    const glyphs: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    if (!/^[IVXLCDM]+$/.test(text)) {
        throw new RangeError(`fromRoman() got an invalid numeral ${JSON.stringify(text)}`);
    }
    let total = 0;
    for (let i = 0; i < text.length; i += 1) {
        const value = glyphs[text[i]];
        const next = i + 1 < text.length ? glyphs[text[i + 1]] : 0;
        total += value < next ? -value : value;
    }
    if (toRoman(total) !== text) {
        throw new RangeError(`fromRoman() got a non-canonical numeral ${JSON.stringify(text)}`);
    }
    return total;
};

/**
 * Pieces of a numeral for hints: additive glyphs as "V = 5", subtractive
 * pairs as "IX = 10 − 1 = 9"; `sum` is the addition of the pieces
 * ("5 + 1 + 1 = 7"), or the single piece's value for IX / IV.
 */
export const romanBreakdown = (text: string): { steps: string[]; sum: string } => {
    const glyphs: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const steps: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < text.length; i += 1) {
        const value = glyphs[text[i]];
        const next = i + 1 < text.length ? glyphs[text[i + 1]] : 0;
        if (value < next) {
            steps.push(`${text[i]}${text[i + 1]} = ${next} − ${value} = ${next - value}`);
            values.push(next - value);
            i += 1;
        } else {
            steps.push(`${text[i]} = ${value}`);
            values.push(value);
        }
    }
    const total = values.reduce((x, y) => x + y, 0);
    return { steps, sum: values.length > 1 ? `${values.join(' + ')} = ${total}` : `${total}` };
};
