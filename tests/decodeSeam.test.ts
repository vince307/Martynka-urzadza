import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardDecode, type DecodeFile } from '../src/ui/decodeSeam';

type Decode = (data: unknown, ok?: (b: unknown) => void, err?: (e: unknown) => void) => unknown;

const fileWith = (decodeAudioData: Decode): { file: DecodeFile; real: { decodeAudioData: Decode } } => {
    const real = { decodeAudioData };
    return { file: { key: 'sfx-tap', config: { context: real } }, real };
};
const contextOf = (file: DecodeFile): { decodeAudioData: Decode } => (file.config as { context: { decodeAudioData: Decode } }).context;

const rejections: unknown[] = [];
const onRejection = (reason: unknown): void => { rejections.push(reason); };
process.on('unhandledRejection', onRejection);
afterEach(() => { rejections.length = 0; });

describe('guardDecode (audit S-2)', () => {
    it('names a rejected decode once, with the key and the error name, and leaves no unhandled rejection', async () => {
        const failure = Object.assign(new Error('Unable to decode audio data'), { name: 'EncodingError' });
        const { file } = fileWith(() => Promise.reject(failure));
        const warn = vi.fn();
        guardDecode(file, warn);
        contextOf(file).decodeAudioData(new ArrayBuffer(1), () => undefined, () => undefined);
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith('Sound decode failed: sfx-tap (EncodingError)');
        expect(rejections).toEqual([]);
    });
    it('still hands the buffer and both callbacks to the real context', () => {
        const real = vi.fn<Decode>(() => undefined);
        const { file } = fileWith(real);
        guardDecode(file, vi.fn());
        const ok = vi.fn();
        const err = vi.fn();
        const data = new ArrayBuffer(4);
        contextOf(file).decodeAudioData(data, ok, err);
        expect(real).toHaveBeenCalledWith(data, ok, err);
    });
    it('does not mutate the real context object', () => {
        const { file, real } = fileWith(() => undefined);
        const original = real.decodeAudioData;
        guardDecode(file, vi.fn());
        expect(real.decodeAudioData).toBe(original);
        expect(contextOf(file)).not.toBe(real);
    });
    it('leaves a file without a context untouched (HTML5 audio)', () => {
        const file: DecodeFile = { key: 'x', config: { instances: 1 } as never };
        const before = file.config;
        guardDecode(file, vi.fn());
        expect(file.config).toBe(before);
        const bare: DecodeFile = { key: 'y' };
        expect(() => guardDecode(bare, vi.fn())).not.toThrow();
        expect(bare.config).toBeUndefined();
    });
    it('a context whose decodeAudioData returns undefined does not throw', () => {
        const { file } = fileWith(() => undefined);
        guardDecode(file, vi.fn());
        expect(() => contextOf(file).decodeAudioData(new ArrayBuffer(1), () => undefined, () => undefined)).not.toThrow();
    });
    it('wrapping twice does not stack a second warning', async () => {
        const { file } = fileWith(() => Promise.reject(new Error('bad')));
        const warn = vi.fn();
        guardDecode(file, warn);
        guardDecode(file, warn);
        contextOf(file).decodeAudioData(new ArrayBuffer(1));
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(warn).toHaveBeenCalledTimes(1);
    });
});
