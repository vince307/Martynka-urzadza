import { describe, expect, it } from 'vitest';
import { APP_BASE, checkBuildPaths, htmlUrls, swPrecacheUrls } from '../scripts/build-check/paths';

// Synthetic build output for the game served under /graj/ (Task 9: landing at /, game at /graj/).
const manifest = JSON.stringify({
    name: 'Martynka urządza',
    start_url: '/graj/',
    scope: '/graj/',
    icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
});
const html = `<!doctype html><html><head><link rel="icon" href="/graj/favicon.png" /><link rel="apple-touch-icon" href="/graj/icons/apple-touch-icon-180.png" /><script type="module" crossorigin src="/graj/_app/index-a.js"></script><link rel="modulepreload" crossorigin href="/graj/_app/phaser-b.js"><link rel="stylesheet" crossorigin href="/graj/_app/index-c.css"><link rel="manifest" href="/graj/manifest.webmanifest"></head><body></body></html>`;
const sw = `precacheAndRoute([{url:"index.html",revision:"1"},{url:"_app/index-a.js",revision:null},{url:"icons/icon-192.png",revision:"2"}]);createHandlerBoundToURL("index.html")`;

const failing = (results: ReturnType<typeof checkBuildPaths>): string[] => results.filter((r) => !r.ok).map((r) => r.name);

describe('build output paths (game under /graj/)', () => {
    it('the game base is /graj/', () => {
        expect(APP_BASE).toBe('/graj/');
    });

    it('accepts a build whose every URL stays under the base', () => {
        const results = checkBuildPaths({ manifest, html, sw }, '/graj/');
        expect(failing(results)).toEqual([]);
        expect(results.length).toBeGreaterThanOrEqual(5);
    });

    it('rejects a build made for the host root (base "/")', () => {
        const rootManifest = JSON.stringify({ start_url: '/', scope: '/', icons: [{ src: '/icons/icon-192.png' }] });
        const rootHtml = html.replace(/\/graj\//g, '/');
        expect(failing(checkBuildPaths({ manifest: rootManifest, html: rootHtml, sw }, '/graj/'))).toEqual([
            'manifest start_url',
            'manifest scope',
            'manifest icons',
            'index.html URLs',
        ]);
    });

    it('rejects icons with a leading slash even when they point inside the base', () => {
        const pinned = JSON.stringify({ start_url: '/graj/', scope: '/graj/', icons: [{ src: '/graj/icons/icon-192.png' }] });
        expect(failing(checkBuildPaths({ manifest: pinned, html, sw }, '/graj/'))).toEqual(['manifest icons']);
    });

    it('rejects a manifest that is not JSON or has no icons', () => {
        expect(failing(checkBuildPaths({ manifest: 'nope', html, sw }, '/graj/'))).toEqual(['manifest start_url', 'manifest scope', 'manifest icons']);
        const bare = JSON.stringify({ start_url: '/graj/', scope: '/graj/' });
        expect(failing(checkBuildPaths({ manifest: bare, html, sw }, '/graj/'))).toEqual(['manifest icons']);
    });

    it('rejects an index.html with no URLs or one outside the base', () => {
        expect(failing(checkBuildPaths({ manifest, html: '<html></html>', sw }, '/graj/'))).toEqual(['index.html URLs']);
        const leak = html.replace('/graj/favicon.png', '/favicon.png');
        const result = checkBuildPaths({ manifest, html: leak, sw }, '/graj/').find((r) => r.name === 'index.html URLs');
        expect(result?.ok).toBe(false);
        expect(result?.detail).toContain('/favicon.png');
    });

    it('rejects a precache that is empty or names a path outside the base', () => {
        expect(failing(checkBuildPaths({ manifest, html, sw: '' }, '/graj/'))).toEqual(['sw.js precache', 'sw.js navigation fallback']);
        const rooted = sw.replace('url:"_app/index-a.js"', 'url:"/_app/index-a.js"');
        expect(failing(checkBuildPaths({ manifest, html, sw: rooted }, '/graj/'))).toEqual(['sw.js precache']);
        const foreign = sw.replace('url:"index.html"', 'url:"https://cdn.example/x.js"');
        expect(failing(checkBuildPaths({ manifest, html, sw: foreign }, '/graj/'))).toEqual(['sw.js precache']);
        const inside = sw.replace('url:"index.html"', 'url:"/graj/index.html"');
        expect(failing(checkBuildPaths({ manifest, html, sw: inside }, '/graj/'))).toEqual([]);
    });

    it('rejects a navigation fallback outside the base', () => {
        const rootFallback = sw.replace('createHandlerBoundToURL("index.html")', 'createHandlerBoundToURL("/index.html")');
        expect(failing(checkBuildPaths({ manifest, html, sw: rootFallback }, '/graj/'))).toEqual(['sw.js navigation fallback']);
        // The minified form vite-plugin-pwa emits: the URL goes through a variable.
        const minified = sw.replace('createHandlerBoundToURL("index.html")', '((j="index.html",E().createHandlerBoundToURL(j)))');
        expect(failing(checkBuildPaths({ manifest, html, sw: minified }, '/graj/'))).toEqual([]);
        expect(failing(checkBuildPaths({ manifest, html, sw: minified.replace('j="index.html"', 'j="/index.html"') }, '/graj/'))).toEqual(['sw.js navigation fallback']);
        expect(failing(checkBuildPaths({ manifest, html, sw: 'precacheAndRoute([{url:"index.html"}])' }, '/graj/'))).toEqual(['sw.js navigation fallback']);
    });

    it('lists src/href URLs of index.html and precache URLs of sw.js', () => {
        expect(htmlUrls(html)).toContain('/graj/_app/index-a.js');
        expect(htmlUrls(html)).toHaveLength(6);
        expect(swPrecacheUrls(sw)).toEqual(['index.html', '_app/index-a.js', 'icons/icon-192.png']);
    });
});
