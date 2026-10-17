import { describe, expect, it } from 'vitest';
import {
    bundlesFromHtml,
    cacheControlCheck,
    compareBundles,
    contentTypeCheck,
    entryVerdict,
    failLine,
    hasBuildId,
    isLocalHost,
    precacheCovers,
    precacheFromSw,
    precacheServed,
    roomArtCheck,
} from '../scripts/deploy-check/parse';

const html = `<!doctype html><html lang="pl"><head><link rel="manifest" href="/manifest.webmanifest"><script type="module" crossorigin src="/_app/index-dt_hHSYl.js"></script><link rel="stylesheet" crossorigin href="/_app/index-D-QdC4-j.css"></head><body></body></html>`;
const sw = `precacheAndRoute([{url:"manifest.webmanifest",revision:"0fc4"},{url:"index.html",revision:"abc"},{url:"_app/phaser-B9cGCB07.js",revision:null},{url:"_app/index-dt_hHSYl.js",revision:null},{url:"_app/index-D-QdC4-j.css",revision:null}])`;

describe('deploy check parsers', () => {
    it('finds hashed bundles in index.html once each', () => {
        expect(bundlesFromHtml(html)).toEqual(['/_app/index-dt_hHSYl.js', '/_app/index-D-QdC4-j.css']);
        expect(bundlesFromHtml('<html></html>')).toEqual([]);
    });

    it('reads the precache list with a leading slash', () => {
        expect(precacheFromSw(sw)).toContain('/_app/phaser-B9cGCB07.js');
        expect(precacheFromSw(sw)).toContain('/index.html');
        expect(precacheFromSw('')).toEqual([]);
    });

    it('requires every html bundle to be precached', () => {
        expect(compareBundles(bundlesFromHtml(html), precacheFromSw(sw)).ok).toBe(true);
        const stale = compareBundles(['/_app/index-NEW.js'], precacheFromSw(sw));
        expect(stale.ok).toBe(false);
        expect(stale.detail).toContain('/_app/index-NEW.js');
        expect(compareBundles([], precacheFromSw(sw)).ok).toBe(false);
    });

    it('matches the build id literal', () => {
        expect(hasBuildId('const x="4e52179";', '4e52179')).toBe(true);
        expect(hasBuildId('const x="4e52179";', '0000000')).toBe(false);
    });

    it('judges cache-control and content-type headers', () => {
        expect(cacheControlCheck('/', 'no-cache', 'no-cache').ok).toBe(true);
        expect(cacheControlCheck('/', null, 'no-cache').ok).toBe(false);
        expect(cacheControlCheck('/_app/a.js', 'public, max-age=31536000, immutable', 'immutable').ok).toBe(true);
        expect(cacheControlCheck('/_app/a.js', 'public, max-age=60, immutable', 'immutable').ok).toBe(false);
        expect(contentTypeCheck('/m', 'application/manifest+json; charset=utf-8', 'application/manifest+json').ok).toBe(true);
        expect(contentTypeCheck('/m', null, 'application/manifest+json').ok).toBe(false);
    });

    it('requires every room picture to be precached', () => {
        const expected = ['assets/rooms/salon/a.webp', 'assets/rooms/salon/b.webp'];
        const ok = roomArtCheck(['/assets/rooms/salon/a.webp', '/assets/rooms/salon/b.webp', '/index.html'], expected);
        expect(ok.ok).toBe(true);
        expect(ok.detail).toContain('2 of 2');
        const missing = roomArtCheck(['/assets/rooms/salon/a.webp'], expected);
        expect(missing.ok).toBe(false);
        expect(missing.detail).toContain('1 of 2');
        expect(missing.detail).toContain('assets/rooms/salon/b.webp');
    });

    it('tolerates a leading slash on the expected urls and fails on an empty list', () => {
        expect(roomArtCheck(['/assets/rooms/salon/a.webp'], ['/assets/rooms/salon/a.webp']).ok).toBe(true);
        expect(roomArtCheck(['/assets/rooms/salon/a.webp'], []).ok).toBe(false);
    });
});

describe('precache entry verdicts (recorded responses)', () => {
    it('accepts 200 with the expected media type, ignoring parameters', () => {
        expect(entryVerdict('/a.webp', 200, 'image/webp', null).ok).toBe(true);
        expect(entryVerdict('/_app/a.css', 200, 'text/css; charset=utf-8', null).ok).toBe(true);
        expect(entryVerdict('/manifest.webmanifest', 200, 'application/manifest+json', null).ok).toBe(true);
        expect(entryVerdict('/assets/s.m4a', 200, 'audio/mp4', null).ok).toBe(true);
        expect(entryVerdict('/assets/s.ogg', 200, 'audio/ogg', null).ok).toBe(true);
        expect(entryVerdict('/f.ttf', 200, 'font/ttf', null).ok).toBe(true);
    });

    it('fails a 404 and an SPA fallback that answers text/html for a picture', () => {
        expect(entryVerdict('/a.webp', 404, 'text/html', null).ok).toBe(false);
        const fallback = entryVerdict('/a.webp', 200, 'text/html; charset=utf-8', null);
        expect(fallback.ok).toBe(false);
        expect(fallback.reason).toContain('text/html');
    });

    it('checks only the status for an extension without an expected type', () => {
        expect(entryVerdict('/f.woff2', 200, 'whatever', null).ok).toBe(true);
        expect(entryVerdict('/f.woff2', 404, 'font/woff2', null).ok).toBe(false);
    });

    it('tolerates a redirect to the root for index.html only', () => {
        expect(entryVerdict('/index.html', 200, 'text/html; charset=utf-8', null).ok).toBe(true);
        expect(entryVerdict('/index.html', 301, null, '/').ok).toBe(true);
        expect(entryVerdict('/index.html', 308, null, './').ok).toBe(true);
        expect(entryVerdict('/index.html', 301, null, '/x').ok).toBe(false);
        expect(entryVerdict('/a.webp', 301, null, '/').ok).toBe(false);
    });

    it('fails a timed-out entry with the reason timeout', () => {
        const v = entryVerdict('/a.webp', 0, null, null);
        expect(v.ok).toBe(false);
        expect(v.reason).toBe('timeout');
    });

    it('aggregates verdicts into one line and lists failures', () => {
        const verdicts = [
            entryVerdict('/a.webp', 200, 'image/webp', null),
            entryVerdict('/b.webp', 404, 'text/html', null),
            entryVerdict('/c.webp', 0, null, null),
        ];
        const r = precacheServed(verdicts);
        expect(r.ok).toBe(false);
        expect(r.name).toBe('precache served: 1/3');
        expect(r.detail).toContain('/b.webp 404 text/html');
        expect(r.detail).toContain('/c.webp');
        const all = precacheServed([verdicts[0]]);
        expect(all.ok).toBe(true);
        expect(all.name).toBe('precache served: 1/1');
        expect(precacheServed([]).ok).toBe(false);
    });
});

describe('table coverage, local host and failure line', () => {
    it('precacheCovers names the table and the first missing url', () => {
        const have = ['/assets/a.webp', '/assets/b.webp'];
        const ok = precacheCovers('task pictures', have, ['assets/a.webp', '/assets/b.webp']);
        expect(ok.ok).toBe(true);
        expect(ok.name).toContain('task pictures');
        const bad = precacheCovers('sounds', have, ['assets/a.webp', 'assets/zz.ogg']);
        expect(bad.ok).toBe(false);
        expect(bad.detail).toContain('1 of 2');
        expect(bad.detail).toContain('assets/zz.ogg');
        expect(precacheCovers('empty', have, []).ok).toBe(false);
    });

    it('recognises local hosts only', () => {
        expect(isLocalHost('http://localhost:4398')).toBe(true);
        expect(isLocalHost('http://127.0.0.1:8080/')).toBe(true);
        expect(isLocalHost('https://martynka-urzadza.pl')).toBe(false);
        expect(isLocalHost('https://localhost.example.com')).toBe(false);
    });

    it('failLine names the path and says the release is already live', () => {
        const line = failLine(new Error('/assets/a.webp: fetch failed'));
        expect(line).toContain('FAIL request error');
        expect(line).toContain('/assets/a.webp');
        expect(line).toContain('already live');
        expect(failLine('boom')).toContain('boom');
    });
});
