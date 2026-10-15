import { defineConfig } from 'vitest/config';

// Standalone test config: the app's Vite configs (vite/config.*.mjs) carry the
// PWA plugin and build-time defines, which unit tests of src/core never need.
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        // Draw-heavy tests (MONEY_PAY wallets, every skill of every stage) take 2-3 s locally and over 5 s on a loaded CI
        // runner; the default 5 s limit failed the Deploy run twice (2026-10-15).
        testTimeout: 30_000,
    },
});
