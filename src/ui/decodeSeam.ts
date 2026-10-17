export interface DecodeFile {
    key: string;
    config?: { context?: unknown } | null;
}

interface DecodingContext {
    decodeAudioData(data: unknown, ok?: (buffer: unknown) => void, fail?: (error: unknown) => void): unknown;
}

const isDecoding = (value: unknown): value is DecodingContext =>
    typeof value === 'object' && value !== null && typeof (value as { decodeAudioData?: unknown }).decodeAudioData === 'function';

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';

const GUARDED = Symbol('decodeGuarded');

/**
 * Names a sound that failed to decode at its source (audit S-2). Phaser 4.2.1 drops the promise that
 * `decodeAudioData` returns, so a bad file rejects unhandled (and the error boundary can only call it noise). The
 * file gets its OWN context object whose `decodeAudioData` calls the real one and catches that promise; the real
 * AudioContext is never changed. A file without a Web Audio context (HTML5 audio) is left alone. The callback form
 * Phaser uses still gets both callbacks. Relies on `AudioFile.onProcess` (pinned in tests/phaserLoaderPin.test.ts).
 */
export function guardDecode(file: DecodeFile, warn: (line: string) => void): void {
    const config = file.config;
    const real = config?.context;
    if (!config || !isDecoding(real) || (real as { [GUARDED]?: boolean })[GUARDED]) return;
    const guarded: DecodingContext & { [GUARDED]: true } = {
        [GUARDED]: true,
        decodeAudioData: (data, ok, fail) => {
            const result = real.decodeAudioData(data, ok, fail);
            if (isThenable(result)) {
                result.then(undefined, (error: unknown) => {
                    const name = error instanceof Error ? error.name : (error as { name?: unknown } | null)?.name;
                    warn(`Sound decode failed: ${file.key} (${typeof name === 'string' ? name : 'unnamed'})`);
                });
            }
            return result;
        },
    };
    file.config = { ...config, context: guarded };
}
