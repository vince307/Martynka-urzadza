import { describe, expect, it } from 'vitest';
import { isFatalSignal, type ErrorSignal } from '../src/core/errorSignal';

const sig = (over: Partial<ErrorSignal>): ErrorSignal => ({ kind: 'error', message: 'boom', hasError: true, foreign: false, ...over });

describe('isFatalSignal', () => {
    it('treats an error carrying an error object as a failure', () => {
        expect(isFatalSignal(sig({}))).toBe(true);
        expect(isFatalSignal(sig({ name: 'TypeError', message: 'x is undefined' }))).toBe(true);
    });

    it('ignores ResizeObserver noise that has no error object', () => {
        for (const message of ['ResizeObserver loop completed with undelivered notifications', 'ResizeObserver loop limit exceeded']) {
            expect(isFatalSignal(sig({ message, hasError: false })), message).toBe(false);
        }
    });

    it('keeps the same message a failure when it carries an error object', () => {
        expect(isFatalSignal(sig({ message: 'ResizeObserver loop limit exceeded', hasError: true }))).toBe(true);
    });

    it('ignores empty and opaque cross-origin messages', () => {
        expect(isFatalSignal(sig({ message: 'Script error.', hasError: false }))).toBe(false);
        expect(isFatalSignal(sig({ message: '', hasError: false }))).toBe(false);
    });

    it('ignores signals from foreign files', () => {
        expect(isFatalSignal(sig({ foreign: true }))).toBe(false);
        expect(isFatalSignal(sig({ kind: 'rejection', foreign: true }))).toBe(false);
    });

    it('treats rejections of any value as failures except autoplay and abort ones', () => {
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'Error' }))).toBe(true);
        expect(isFatalSignal(sig({ kind: 'rejection', message: 'oops', hasError: false }))).toBe(true);
        expect(isFatalSignal(sig({ kind: 'rejection', message: '', hasError: false }))).toBe(true);
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'TypeError' }))).toBe(true);
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'AbortError' }))).toBe(false);
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'NotAllowedError' }))).toBe(false);
    });

    it('treats unhandled audio decode rejections as noise, not as a failure', () => {
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'EncodingError' }))).toBe(false);
        expect(isFatalSignal(sig({ kind: 'rejection', name: 'NotSupportedError' }))).toBe(false);
    });

    it('keeps the audio names fatal for error events (only rejections are quiet)', () => {
        expect(isFatalSignal(sig({ kind: 'error', name: 'EncodingError' }))).toBe(true);
    });
});
