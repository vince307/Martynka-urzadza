import { defineConfig, mergeConfig } from 'vite';
import { sharedConfig } from './config.shared.mjs';
import { e2eHookGuard } from './e2eHookGuard.mjs';

export default defineConfig(
    mergeConfig(sharedConfig, {
        logLevel: 'warning',
        plugins: [e2eHookGuard()],
        build: {
            minify: 'terser',
            terserOptions: {
                compress: {
                    passes: 2,
                },
                mangle: true,
                format: {
                    comments: false,
                },
            },
        },
    }),
);
