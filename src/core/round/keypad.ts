// Keypad buffer: pure, no leading zeros, bounded length.
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
