import { fileKeyCompleteEvent } from '../src/core/loaderEvent';
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

    it('emits the per-file event as FILE_KEY_COMPLETE + type + "-" + key, which fileKeyCompleteEvent mirrors', () => {
        const file = readFileSync('node_modules/phaser/src/loader/File.js', 'utf8');
        const events = readFileSync('node_modules/phaser/src/loader/events/FILE_KEY_COMPLETE_EVENT.js', 'utf8');
        const hint = 're-verify src/core/loaderEvent.ts against File.pendingDestroy';
        expect(file, hint).toContain("Events.FILE_KEY_COMPLETE + type + '-' + key");
        expect(events, hint).toContain("'filecomplete-'");
        expect(fileKeyCompleteEvent('filecomplete-', 'image', 'ui/loading-background')).toBe('filecomplete-image-ui/loading-background');
    });

    it('copies the per-file limit in an ADD listener registered before BootScene queues its first file', () => {
        // Phaser emits ADD synchronously from addFile, so a file queued before the listener keeps the xhr timeout of 0
        // (impl-review S-16c: the two loading pictures were queued first and had no per-file limit).
        const plugin = readFileSync('node_modules/phaser/src/loader/LoaderPlugin.js', 'utf8');
        expect(plugin, 're-verify that ADD is still emitted inside addFile').toMatch(/addFile: function[\s\S]*?this\.emit\(Events\.ADD/);
        const boot = readFileSync('src/scenes/BootScene.ts', 'utf8');
        const listener = boot.indexOf('this.load.on(Loader.Events.ADD');
        const firstQueued = boot.search(/this\.load\.(image|font|audio|spritesheet)\(/);
        expect(listener).toBeGreaterThan(-1);
        expect(firstQueued).toBeGreaterThan(-1);
        expect(listener, 'register the ADD listener before the first this.load.<type>() call in BootScene.preload').toBeLessThan(firstQueued);
    });
});
