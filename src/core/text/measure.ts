// Amounts with a unit (S-14): money in grosze and temperatures, written as the school does ("3 zł 40 gr", "−5 °C")
// and spoken in words for the narrator. Only the short unit signs appear on screen; the validator does not inflect them.
import { numberToWords } from './numberWords';
import { inflect, type PluralForms } from './plural';

const MINUS = '−';
const ZLOTY: PluralForms = ['złoty', 'złote', 'złotych'];
const GROSZ: PluralForms = ['grosz', 'grosze', 'groszy'];
const STOPIEN: PluralForms = ['stopień', 'stopnie', 'stopni'];

const wholeAmount = (grosze: number): void => {
    if (!Number.isInteger(grosze) || grosze < 0) {
        throw new RangeError(`an amount needs whole non-negative grosze, got ${grosze}`);
    }
};

const wholeDegrees = (celsius: number): void => {
    if (!Number.isInteger(celsius)) {
        throw new RangeError(`a temperature needs whole degrees, got ${celsius}`);
    }
};

/** "5 zł", "40 gr", "3 zł 40 gr"; 0 is "0 zł". */
export const formatMoney = (grosze: number): string => {
    wholeAmount(grosze);
    const zl = Math.floor(grosze / 100);
    const gr = grosze % 100;
    if (gr === 0) {
        return `${zl} zł`;
    }
    return zl === 0 ? `${gr} gr` : `${zl} zł ${gr} gr`;
};

/** "−5 °C" with the real minus sign, no plus sign. */
export const formatCelsius = (celsius: number): string => {
    wholeDegrees(celsius);
    return `${celsius < 0 ? MINUS : ''}${Math.abs(celsius)} °C`;
};

/** "trzy złote czterdzieści groszy" */
export const spokenMoney = (grosze: number): string => {
    wholeAmount(grosze);
    const zl = Math.floor(grosze / 100);
    const gr = grosze % 100;
    const parts: string[] = [];
    if (zl > 0 || gr === 0) {
        parts.push(`${numberToWords(zl)} ${inflect(zl, ZLOTY)}`);
    }
    if (gr > 0) {
        parts.push(`${numberToWords(gr)} ${inflect(gr, GROSZ)}`);
    }
    return parts.join(' ');
};

/** "minus pięć stopni"; the agreement follows the absolute value. */
export const spokenCelsius = (celsius: number): string => {
    wholeDegrees(celsius);
    const n = Math.abs(celsius);
    return `${celsius < 0 ? 'minus ' : ''}${numberToWords(n)} ${inflect(n, STOPIEN)}`;
};

/** A label on the thermometer scale: "+10", "0", "−20" (a plus on warm marks, the real minus sign). */
export const formatScaleMark = (celsius: number): string => (celsius > 0 ? `+${celsius}` : celsius < 0 ? `${MINUS}${-celsius}` : '0');
