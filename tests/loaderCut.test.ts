import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ Loader: { FILE_ERRORED: 16 } }));

import { cutLoad } from '../src/scenes/loaderCut';

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
