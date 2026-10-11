import { pl } from '../data/pl';
import { createButton, createOverlay, createText } from '../ui/dom/overlay';
import { type Platform, shouldShowInstallHint } from './platform';

/** Chromium-only event; typed here because lib.dom does not ship it. */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<unknown>;
}

// Captured as early as possible: Chrome may fire it before or after the hint
// is shown, or never (engagement heuristics), so the install button is added
// to the visible overlay whenever the event arrives.
let installPrompt: BeforeInstallPromptEvent | null = null;
let onPromptAvailable: (() => void) | null = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    onPromptAvailable?.();
});

const instructionFor = (platform: Platform): string =>
    platform === 'ipad' ? pl.install.ipad : pl.install.android;

/**
 * "Add to home screen" hint (FR-001): shown on every launch from a browser tab
 * on iPad or Android until the game runs from its icon. "Play in the browser"
 * dismisses it for this launch only (decision: no local flag).
 */
export const mountInstallHint = (parent: HTMLElement, platform: Platform, standalone: boolean): void => {
    if (!shouldShowInstallHint(platform, standalone)) {
        return;
    }

    const actions = document.createElement('div');
    actions.className = 'overlay-actions';
    const overlay = createOverlay('overlay-install', [
        createText('h1', pl.install.title),
        createText('p', instructionFor(platform)),
        createText('p', pl.install.afterInstall, 'overlay-muted'),
        actions,
    ]);
    const dismiss = (): void => {
        overlay.remove();
        onPromptAvailable = null;
    };

    const addInstallButton = (): void => {
        if (!installPrompt || actions.querySelector('.overlay-install-button')) {
            return;
        }
        const button = createButton(pl.install.installButton, () => {
            const prompt = installPrompt;
            installPrompt = null;
            button.remove();
            prompt?.prompt().catch(() => undefined);
        });
        button.className = 'overlay-install-button';
        actions.prepend(button);
    };

    actions.append(createButton(pl.install.continueButton, dismiss));
    addInstallButton();
    onPromptAvailable = addInstallButton;
    window.addEventListener('appinstalled', dismiss, { once: true });
    parent.append(overlay);
};
