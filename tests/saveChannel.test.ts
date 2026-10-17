import { describe, expect, it } from 'vitest';
import { createSaveChannel } from '../src/storage/saveChannel';

class FakeChannel {
    static all: FakeChannel[] = [];
    onmessage: ((e: { data: unknown }) => void) | null = null;
    closed = false;
    constructor(readonly name: string) {
        FakeChannel.all.push(this);
    }
    postMessage(data: unknown): void {
        for (const c of FakeChannel.all) if (c !== this && !c.closed) c.onmessage?.({ data });
    }
    close(): void {
        this.closed = true;
    }
}

describe('saveChannel (T-2): a hint between windows, never stored', () => {
    it('without BroadcastChannel every call is a no-op', () => {
        const ch = createSaveChannel(undefined);
        expect(() => {
            ch.onMessage(() => undefined);
            ch.post({ writer: 'A', generation: 1 });
            ch.close();
        }).not.toThrow();
    });

    it('a constructor that throws gives a no-op channel', () => {
        const ch = createSaveChannel(class {
            constructor() {
                throw new Error('denied');
            }
        } as never);
        expect(() => ch.post({ writer: 'A', generation: 1 })).not.toThrow();
    });

    it('a post reaches the other window\'s listener on the channel named martynka-save, not its own', () => {
        FakeChannel.all = [];
        const a = createSaveChannel(FakeChannel);
        const b = createSaveChannel(FakeChannel);
        const gotA: unknown[] = [];
        const gotB: unknown[] = [];
        a.onMessage((m) => void gotA.push(m));
        b.onMessage((m) => void gotB.push(m));
        a.post({ writer: 'A:1', generation: 4 });
        expect(gotB).toEqual([{ writer: 'A:1', generation: 4 }]);
        expect(gotA).toEqual([]);
        expect(FakeChannel.all[0]?.name).toBe('martynka-save');
    });

    it('a malformed message is dropped, a throwing postMessage is swallowed', () => {
        FakeChannel.all = [];
        const b = createSaveChannel(FakeChannel);
        const got: unknown[] = [];
        b.onMessage((m) => void got.push(m));
        for (const data of [null, 'x', { writer: 1, generation: 2 }, { writer: 'A', generation: -1 }, { writer: 'A', generation: 1.5 }]) FakeChannel.all[0]?.onmessage?.({ data });
        expect(got).toEqual([]);
        class Bad extends FakeChannel {
            override postMessage(): void {
                throw new Error('closed');
            }
        }
        expect(() => createSaveChannel(Bad as never).post({ writer: 'A', generation: 1 })).not.toThrow();
    });

    it('close closes the underlying channel', () => {
        FakeChannel.all = [];
        const a = createSaveChannel(FakeChannel);
        a.close();
        expect(FakeChannel.all[0]?.closed).toBe(true);
    });
});
