/// <reference types="vite/client" />

/** Short commit SHA injected at build time (vite/config.shared.mjs `define`). */
declare const __BUILD_ID__: string;

/** True only in the e2e build (E2E_HOOK=1): installs the read-only test hook. */
declare const __E2E_HOOK__: boolean;
