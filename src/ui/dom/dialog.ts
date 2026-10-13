import { createOverlay } from './overlay';

export interface DomDialog {
    dialog: HTMLDivElement;
    /** Removes the overlay and its listeners and gives the focus back; safe to call twice. */
    close: () => void;
}

const FOCUSABLE = 'button:not(:disabled)';

/**
 * Modal dialog above the canvas: role="dialog", aria-modal, labelled by `title`, focus on the first
 * button, Tab kept inside, Escape calls `onEscape`. `onKey` sees every other keydown on the document.
 */
export const openDialog = (
    parent: HTMLElement,
    title: HTMLElement,
    body: HTMLElement[],
    onEscape: () => void,
    onKey?: (event: KeyboardEvent) => void,
): DomDialog => {
    const dialog = document.createElement('div');
    dialog.className = 'parent-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    title.id = `dialog-title-${Math.random().toString(36).slice(2)}`;
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(title, ...body);
    const overlay = createOverlay('overlay-parent', [dialog]);
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let closed = false;

    const handleKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onEscape();
            return;
        }
        if (event.key === 'Tab') {
            const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
            if (items.length === 0) {
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (!dialog.contains(active)) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
            return;
        }
        onKey?.(event);
    };
    document.addEventListener('keydown', handleKey);
    parent.append(overlay);
    dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return {
        dialog,
        close: () => {
            if (closed) {
                return;
            }
            closed = true;
            document.removeEventListener('keydown', handleKey);
            overlay.remove();
            previous?.focus();
        },
    };
};
