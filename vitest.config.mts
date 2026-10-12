import { defineConfig } from 'vitest/config';

// Standalone test config: the app's Vite configs (vite/config.*.mjs) carry the
// PWA plugin and build-time defines, which unit tests of src/core never need.
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
    },
});
