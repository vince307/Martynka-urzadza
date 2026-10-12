// Polish number notation: four-digit numbers are written without a space,
// from 10 000 up the digits are grouped by three with a no-break space.
const NBSP = '\u00A0';

/** Regex source of one number as `formatNumber` writes it (grouped or plain). */
export const NUMBER_SOURCE = '\\d{1,3}(?:\\u00A0\\d{3})+|\\d+';

export const formatNumber = (n: number): string => {
    const digits = String(n);
    if (n < 10000) {
        return digits;
    }
    return digits.replace(/\B(?=(\d{3})+$)/g, NBSP);
};

export const parseNumber = (text: string): number => Number(text.replace(/\u00A0/g, ''));
