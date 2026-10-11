// Minimal DOM helpers for full-screen overlays drawn above the Phaser canvas.
// Overlays never stop event propagation: Phaser unlocks Web Audio on the first
// touch that reaches document.body.

export const createOverlay = (className: string, children: HTMLElement[]): HTMLDivElement => {
    const overlay = document.createElement('div');
    overlay.className = `overlay ${className}`;
    overlay.append(...children);
    return overlay;
};

export const createText = (tag: 'h1' | 'p', text: string, className?: string): HTMLElement => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
        element.className = className;
    }
    return element;
};

export const createButton = (label: string, onTap: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onTap);
    return button;
};
