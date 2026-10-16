// Origin: save-truth phase 7 (audit T-3). A reload is the same tab: its writer id is `<tabId>:<nonce>`, the tab id lives in
// sessionStorage, and a document that ends records its nonce so the next document can tell "my previous page" from "another window".
import { describe, expect, it } from 'vitest';
import { createWriterId } from '../src/storage/writerId';

const memory = (initial: Record<string, string> = {}) => {
    const map = new Map(Object.entries(initial));
    return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
};
const counter = () => {
    let n = 0;
    return () => `r${++n}`;
};
const shared = counter();   // one sequence across the loads of a test, like real randomness

describe('createWriterId', () => {
    it('a first load has a tab id, a nonce and nothing ended', () => {
        const id = createWriterId(memory(), counter());
        expect(id.writer).toBe('r1:r2');
        expect(id.endedWriters).toEqual([]);
    });

    it('a reload keeps the tab id, takes a new nonce and lists the ended document', () => {
        const storage = memory();
        const first = createWriterId(storage, shared);
        first.end();
        const second = createWriterId(storage, shared);
        expect(second.writer.split(':')[0]).toBe(first.writer.split(':')[0]);
        expect(second.writer).not.toBe(first.writer);
        expect(second.endedWriters).toEqual([first.writer]);
    });

    it('a document that never ended is not listed', () => {
        const storage = memory();
        const first = createWriterId(storage, shared);
        const second = createWriterId(storage, shared);
        expect(second.endedWriters).toEqual([]);
        expect(second.writer).not.toBe(first.writer);
    });

    it('keeps the last 8 ended documents', () => {
        const storage = memory();
        const writers: string[] = [];
        let n = 0;
        for (let i = 0; i < 11; i++) {
            const id = createWriterId(storage, () => `x${++n}`);
            writers.push(id.writer);
            id.end();
        }
        const last = createWriterId(storage, () => `x${++n}`);
        expect(last.endedWriters).toEqual(writers.slice(-8));
    });

    it('a duplicated tab copies the storage, but never the original\'s live nonce as ended', () => {
        const storage = memory();
        const original = createWriterId(storage, shared);
        const copy = memory(Object.fromEntries(storage.map));
        const duplicate = createWriterId(copy, shared);
        expect(duplicate.endedWriters).not.toContain(original.writer);
        expect(duplicate.writer).not.toBe(original.writer);
    });

    it('end() twice records the nonce once', () => {
        const storage = memory();
        const id = createWriterId(storage, shared);
        id.end();
        id.end();
        expect(createWriterId(storage, shared).endedWriters).toEqual([id.writer]);
    });

    it('a storage that throws gives a fresh id with no ended list, and end() does not throw', () => {
        const broken = {
            getItem: () => {
                throw new DOMException('denied', 'SecurityError');
            },
            setItem: () => {
                throw new DOMException('full', 'QuotaExceededError');
            },
        };
        const a = createWriterId(broken, shared);
        const b = createWriterId(broken);
        expect(a.endedWriters).toEqual([]);
        expect(a.writer).not.toBe(b.writer);
        expect(() => a.end()).not.toThrow();
    });

    it('stored text that is not the expected shape is ignored', () => {
        for (const junk of ['not json', '{"tabId":7}', '{"tabId":"t","ended":"x"}', 'null']) {
            const id = createWriterId(memory({ 'martynka:writer': junk }), shared);
            expect(id.endedWriters).toEqual([]);
            expect(id.writer).toMatch(/^[^:]+:[^:]+$/);
        }
    });
});
