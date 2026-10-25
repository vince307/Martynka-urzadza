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

    it('emits FILE_LOAD on a fetched file and FILE_LOAD_ERROR only on a failed fetch; a decode failure goes to onProcessError', () => {
        // BootScene reads the cause of a missing texture from these events: a key seen in FILE_LOAD without a texture is a decode failure.
        const plugin = readFileSync('node_modules/phaser/src/loader/LoaderPlugin.js', 'utf8');
        const hint = 're-verify the cause classifier in src/scenes/BootScene.ts (artCauses) against LoaderPlugin.nextFile';
        expect(plugin, hint).toMatch(/nextFile: function[\s\S]*?if \(success\)[\s\S]*?this\.emit\(Events\.FILE_LOAD, file\);[\s\S]*?file\.onProcess\(\);[\s\S]*?else[\s\S]*?this\.emit\(Events\.FILE_LOAD_ERROR, file\)/);
        const image = readFileSync('node_modules/phaser/src/loader/filetypes/ImageFile.js', 'utf8');
        expect(image, hint).toMatch(/onProcess: function[\s\S]*?onerror = function[\s\S]*?onProcessError/);
    });
});

describe('phaser audio decode seam pin (src/ui/decodeSeam.ts)', () => {
    it('AudioFile.onProcess calls this.config.context.decodeAudioData with three arguments and then releases the context', () => {
        const audio = readFileSync('node_modules/phaser/src/loader/filetypes/AudioFile.js', 'utf8');
        const hint = 'src/ui/decodeSeam.ts wraps file.config.context: re-verify the wrapper against AudioFile.onProcess, then update the pin';
        expect(audio, hint).toMatch(/onProcess: function \(\)[\s\S]*?this\.config\.context\.decodeAudioData\(this\.xhrLoader\.response,\s*function \(audioBuffer\)[\s\S]*?function \(e\)[\s\S]*?this\.config\.context = null/);
    });
    it('the loader emits ADD from addFile and AudioFile.create builds its file with game.sound.context', () => {
        const plugin = readFileSync('node_modules/phaser/src/loader/LoaderPlugin.js', 'utf8');
        const audio = readFileSync('node_modules/phaser/src/loader/filetypes/AudioFile.js', 'utf8');
        const hint = 'the decode seam registers on addfile for audio files: re-verify against LoaderPlugin.addFile and AudioFile.create';
        expect(plugin, hint).toMatch(/addFile: function[\s\S]*?this\.emit\(Events\.ADD, item\.key, item\.type, this, item\)/);
        expect(audio, hint).toContain('new AudioFile(loader, key, urlConfig, xhrSettings, game.sound.context)');
    });
});

describe('phaser webgl restore pin (src/ui/widgets/SalonBackdrop.ts, e2e backdrop-restore.spec.ts)', () => {
    const read = (path: string): string => readFileSync(`node_modules/phaser/src/${path}`, 'utf8');
    it('names the restore event restorewebgl', () => {
        expect(read('renderer/events/RESTORE_WEBGL_EVENT.js'), 'TaskScene and WelcomeScene listen with Renderer.Events.RESTORE_WEBGL: re-verify the redraw').toContain("module.exports = 'restorewebgl'");
    });
    it('re-creates textures and framebuffers before it emits the event', () => {
        const src = read('renderer/webgl/WebGLRenderer.js');
        const start = src.indexOf('dispatchContextRestored: function');
        const body = src.slice(start, src.indexOf('\n    },', start));
        const hint = 'the backdrop is redrawn on the event: re-verify that textures are usable by then';
        expect(start).toBeGreaterThan(-1);
        expect(body.indexOf('ArrayEach(this.glFramebufferWrappers'), hint).toBeGreaterThan(-1);
        expect(body.indexOf('ArrayEach(this.glFramebufferWrappers'), hint).toBeLessThan(body.indexOf('this.emit(Events.RESTORE_WEBGL'));
        // The room pictures the redraw copies from are texture wrappers: they must be back before the event too.
        expect(body.indexOf('ArrayEach(this.glTextureWrappers'), hint).toBeGreaterThan(-1);
        expect(body.indexOf('ArrayEach(this.glTextureWrappers'), hint).toBeLessThan(body.indexOf('this.emit(Events.RESTORE_WEBGL'));
    });
    it('reads one pixel through snapshotArea with the pixel type', () => {
        expect(read('textures/DynamicTexture.js'), 'SalonBackdrop.pixel relies on it').toMatch(/snapshotPixel: function[\s\S]*?this\.snapshotArea\(x, y, 1, 1, callback, 'pixel'\)/);
    });
    it('destroys the filter camera with the game object', () => {
        expect(read('gameobjects/GameObject.js'), 'comment at holder.destroy in SalonBackdrop').toMatch(/if \(this\.filterCamera\)[\s\S]*?this\.filterCamera\.destroy\(\)/);
    });
});

describe('phaser colour matrix filter pin (src/ui/wornGrade.ts)', () => {
    const read = (path: string): string => readFileSync(`node_modules/phaser/src/${path}`, 'utf8');
    it('runs the internal filters of a camera from the first added upward', () => {
        const hint = 'applyWornGrade adds the soft matrix before the worn one and relies on this order: re-verify Camera.js';
        expect(read('renderer/webgl/renderNodes/Camera.js'), hint).toMatch(/for \(index = 0; index < internalFilters\.length; index\+\+\)\s*\{\s*filter = internalFilters\[index\];/);
    });
    it('stores the 20 values as given and divides the offsets 4, 9, 14 and 19 by 255 in getData', () => {
        const src = read('display/ColorMatrix.js');
        const hint = 'gradeMatrix gives offsets in 0-255: re-verify ColorMatrix#set and #getData';
        expect(src, hint).toMatch(/set: function \(value\)\s*\{\s*this\._matrix\.set\(value\);/);
        expect(src, hint).toMatch(/data\[4\] \/= 255;\s*data\[9\] \/= 255;\s*data\[14\] \/= 255;\s*data\[19\] \/= 255;/);
    });
    it('hands a filter its colorMatrix and leaves a Canvas game object without filters', () => {
        expect(read('filters/ColorMatrix.js'), 'applyWornGrade sets filter.colorMatrix').toContain('this.colorMatrix = new DisplayColorMatrix()');
    });
});
