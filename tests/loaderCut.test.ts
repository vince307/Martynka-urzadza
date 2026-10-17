import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ Loader: { FILE_ERRORED: 16 } }));

import { cutLoad, pendingKeys } from '../src/scenes/loaderCut';

beforeAll(() => {
    vi.stubGlobal('HTMLImageElement', class {});
});

interface FakeFile {
    key: string;
    data?: unknown;
    state: number;
    retryAttempts: number;
    xhrLoader?: undefined;
    onProcessComplete: () => void;
    onProcessError: () => void;
}

// Like Phaser's File: a late decode callback (either one) ends the file through the loader.
const lateLoader: { fileProcessComplete: (file: FakeFile) => void } = { fileProcessComplete: () => undefined };

const makeLoader = (queued: FakeFile[]) => {
    const fileProcessComplete = vi.fn();
    lateLoader.fileProcessComplete = fileProcessComplete;
    const loader = {
        isLoading: () => true,
        list: new Set<FakeFile>(),
        inflight: new Set<FakeFile>(),
        queue: new Set<FakeFile>(queued),
        fileProcessComplete,
        nextFile: vi.fn(),
    };
    return { loader, fileProcessComplete };
};

const audioFile = (key: string): FakeFile => {
    const file: FakeFile = {
        key,
        state: 0,
        retryAttempts: 1,
        onProcessComplete: () => lateLoader.fileProcessComplete(file),
        onProcessError: () => lateLoader.fileProcessComplete(file),
    };
    return file;
};

describe('cutLoad on a file being decoded', () => {
    it('late decode error does not finish the load twice', () => {
        const file = audioFile('sounds/pop');
        const { loader, fileProcessComplete } = makeLoader([file]);
        const keys = cutLoad(loader as never);
        expect(keys).toEqual(['sounds/pop']);
        expect(fileProcessComplete).toHaveBeenCalledTimes(1);
        file.onProcessError();
        expect(fileProcessComplete).toHaveBeenCalledTimes(1);
    });

    it('late decode success does not finish the load twice', () => {
        const file = audioFile('sounds/pop');
        const { loader, fileProcessComplete } = makeLoader([file]);
        cutLoad(loader as never);
        file.onProcessComplete();
        expect(fileProcessComplete).toHaveBeenCalledTimes(1);
    });

    it('marks the file errored', () => {
        const file = audioFile('sounds/pop');
        const { loader } = makeLoader([file]);
        cutLoad(loader as never);
        expect(file.state).toBe(16);
    });
});

describe('pendingKeys', () => {
    it('names, before the cut, exactly the keys the cut ends (create() may run inside cutLoad and reads them)', () => {
        const waiting = audioFile('tasks/money/coin-1zl');
        const decoding = audioFile('sounds/pop');
        const { loader } = makeLoader([decoding]);
        loader.list.add(waiting);
        const before = pendingKeys(loader as never);
        expect(before).toEqual(['tasks/money/coin-1zl', 'sounds/pop']);
        expect(cutLoad(loader as never)).toEqual(before);
    });

    it('is empty when nothing is loading', () => {
        const { loader } = makeLoader([audioFile('sounds/pop')]);
        loader.isLoading = () => false;
        expect(pendingKeys(loader as never)).toEqual([]);
    });
});
