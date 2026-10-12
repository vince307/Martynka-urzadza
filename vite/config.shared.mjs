import { execSync } from 'node:child_process';
import { VitePWA } from 'vite-plugin-pwa';

// Shared part of the dev and prod Vite configs: paths, chunking, build id and
// the PWA plugin. Each config merges this with its own options (vite mergeConfig).

/** Must equal PAGE_BACKGROUND in src/data/layout.ts (manifest colours, splash). */
export const THEME_COLOR = '#FFF5DF';

/** Short commit SHA shown in the corner of the task screen (__BUILD_ID__). */
const buildId = () => {
    const sha = process.env.GITHUB_SHA;
    if (sha) {
        return sha.slice(0, 7);
    }
    try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return 'dev';
    }
};

const pwaOptions = {
    // New service worker activates at once (skipWaiting + clientsClaim) but the
    // open page is not reloaded: the next launch gets the new build silently.
    registerType: 'autoUpdate',
    // Registration lives in src/pwa/registerServiceWorker.ts (skipped in dev).
    injectRegister: null,
    manifest: {
        name: 'Martynka urządza',
        short_name: 'Martynka',
        lang: 'pl',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: THEME_COLOR,
        theme_color: THEME_COLOR,
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    },
    // Icons are already covered by the png glob below.
    includeManifestIcons: false,
    workbox: {
        // Precache the whole build: code, page, icons and future art/audio.
        globPatterns: ['**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}'],
        // Everything must be precached (no lazy loading): fail loudly, not at
        // the default 2 MiB, when a future asset grows.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        inlineWorkboxRuntime: true,
    },
};

export const sharedConfig = {
    base: '/',
    define: {
        __BUILD_ID__: JSON.stringify(buildId()),
        __E2E_HOOK__: JSON.stringify(process.env.E2E_HOOK === '1'),
    },
    build: {
        // Hashed bundles live under _app/ so Caddy can mark only them immutable;
        // unhashed art in public/assets/ keeps the default cache policy.
        assetsDir: '_app',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
    server: {
        port: 8080,
    },
    plugins: [VitePWA(pwaOptions)],
};
