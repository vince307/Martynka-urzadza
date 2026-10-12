import { describe, expect, it } from 'vitest';
import { bundlesFromHtml, cacheControlCheck, compareBundles, contentTypeCheck, hasBuildId, precacheFromSw } from '../scripts/deploy-check/parse';

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
});
