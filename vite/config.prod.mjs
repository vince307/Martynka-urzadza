import { defineConfig, mergeConfig } from 'vite';
import { sharedConfig } from './config.shared.mjs';

export default defineConfig(
    mergeConfig(sharedConfig, {
        logLevel: 'warning',
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
