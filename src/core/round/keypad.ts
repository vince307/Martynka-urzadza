// Keypad buffer: pure, no leading zeros, bounded length.
import { formatNumber } from '../text/formatNumber';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'delete' | 'ok';

export interface KeypadResult {
    buffer: string;
    submit: number | null;   // the typed number after "ok", else null
}

export const keypadInput = (buffer: string, key: KeypadKey, maxDigits: number): KeypadResult => {
    if (key === 'ok') {
        return { buffer, submit: buffer === '' ? null : Number(buffer) };
    }
    if (key === 'delete') {
        return { buffer: buffer.slice(0, -1), submit: null };
    }
    const base = buffer === '0' ? '' : buffer;   // a typed digit replaces a lone zero
    return { buffer: base.length < maxDigits ? base + key : buffer, submit: null };
};

/** The typed number as the entry field shows it: grouped from 10 000 like every number on screen ("220 000"); '' while empty. */
export const keypadDisplay = (buffer: string): string => (buffer === '' ? '' : formatNumber(Number(buffer)));
