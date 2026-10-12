// Polish number words for 0–1000 ("dwadzieścia trzy", "sto pięć", "tysiąc"),
// used by NUMBER_WORDS tasks and the narrator. Pure function, no state.

const UNITS = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
const TEENS = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
const TENS = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
const HUNDREDS = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

export const MAX_NUMBER_WORD = 1000;

export const numberToWords = (n: number): string => {
    if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER_WORD) {
        throw new RangeError(`numberToWords() supports 0..${MAX_NUMBER_WORD}, got ${n}`);
    }
    if (n === 0) {
        return UNITS[0];
    }
    if (n === 1000) {
        return 'tysiąc';
    }
    const parts: string[] = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds > 0) {
        parts.push(HUNDREDS[hundreds]);
    }
    if (rest >= 10 && rest < 20) {
        parts.push(TEENS[rest - 10]);
    } else {
        const tens = Math.floor(rest / 10);
        const units = rest % 10;
        if (tens > 0) {
            parts.push(TENS[tens]);
        }
        if (units > 0) {
            parts.push(UNITS[units]);
        }
    }
    return parts.join(' ');
};
