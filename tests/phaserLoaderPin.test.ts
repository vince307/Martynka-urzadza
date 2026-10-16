import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/scenes/loaderCut.ts reaches into Phaser 4.2.1 loader internals. This is a tripwire for the version, not a proof of behaviour.
describe('phaser loader pin', () => {
    it('is the Phaser version src/scenes/loaderCut.ts was written against', () => {
        const { version } = JSON.parse(readFileSync('node_modules/phaser/package.json', 'utf8')) as { version: string };
        expect(version, 'src/scenes/loaderCut.ts relies on loader internals: re-verify e2e #15 stallall, then update this pin').toBe('4.2.1');
    });

    it('keeps the audio decode path cutLoad relies on', () => {
        const audio = readFileSync('node_modules/phaser/src/loader/filetypes/AudioFile.js', 'utf8');
        const file = readFileSync('node_modules/phaser/src/loader/File.js', 'utf8');
        const hint = 're-verify cutLoad for audio, then update the pin';
        expect(audio, hint).toContain('decodeAudioData');
        expect(audio, hint).toContain('_this.onProcessComplete()');
        expect(audio, hint).toContain('_this.onProcessError()');
        expect(file, hint).toMatch(/onProcessError: function \(\)[\s\S]*?this\.loader\.fileProcessComplete\(this\)/);
    });
});
