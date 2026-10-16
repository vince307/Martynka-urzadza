import { pl } from '../data/pl';
import { createButton, createOverlay, createText } from '../ui/dom/overlay';
import { type Platform, shouldShowInstallHint } from './platform';

/** Chromium-only event; typed here because lib.dom does not ship it. */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<unknown>;
}

const instructionFor = (platform: Platform): string =>
    platform === 'ipad' ? pl.install.ipad : pl.install.android;

/**
 * "Add to home screen" hint (FR-001): shown on every launch from a browser tab
 * on iPad or Android until the game runs from its icon. "Play in the browser"
 * dismisses it for this launch only (decision: no local flag). While it is open the game gets no touch
 * (`suspend` holds the game's input switch), so a tap on the button cannot reach a tile underneath.
 */
export const mountInstallHint = (
    parent: HTMLElement,
    platform: Platform,
    standalone: boolean,
    suspend?: () => () => void,
): void => {
    if (!shouldShowInstallHint(platform, standalone)) {
        return;
    }

    // Chrome fires beforeinstallprompt asynchronously, before or after the
    // hint is shown, or never (engagement heuristics): keep the event and add
    // the install button to the visible overlay whenever it arrives.
    let installPrompt: BeforeInstallPromptEvent | null = null;
    let onPromptAvailable: (() => void) | null = null;
    const onBeforeInstall = (event: Event): void => {
        event.preventDefault();
        installPrompt = event as BeforeInstallPromptEvent;
        onPromptAvailable?.();
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const actions = document.createElement('div');
    actions.className = 'overlay-actions';
    const overlay = createOverlay('overlay-install', [
        createText('h1', pl.install.title),
        createText('p', instructionFor(platform)),
        createText('p', pl.install.afterInstall, 'overlay-muted'),
        actions,
    ]);
    const release = suspend?.();
    const dismiss = (): void => {
        overlay.remove();
        release?.();
        onPromptAvailable = null;
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);   // F4: no more preventDefault() after "Graj w przeglądarce"
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
