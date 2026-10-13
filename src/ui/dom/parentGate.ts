import { checkAnswer, createChallenge, gateInput, type GateChallenge, type GateKey } from '../../core/parentGate';
import type { Rng } from '../../core/rng';
import { balance } from '../../data/balance';
import { pl } from '../../data/pl';
import { openDialog } from './dialog';
import { createButton, createText } from './overlay';

export interface ParentGateOptions {
    rng: Rng;
    onPass: () => void;
    onCancel: () => void;
    parent?: HTMLElement;
}

const DIGITS: readonly GateKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Adult gate: a multiplication a child cannot do, typed on a digit pad. A wrong answer gives a
 * new problem and a calm message; nothing counts attempts and nothing locks. The answer never
 * leaves this closure (no DOM attribute, no hook). Returns the function that closes the dialog.
 */
export const openParentGate = ({ rng, onPass, onCancel, parent = document.body }: ParentGateOptions): (() => void) => {
    const { parentGate } = balance;
    let challenge: GateChallenge = createChallenge(rng, parentGate);
    let digits = '';

    const prompt = createText('p', pl.parent.gatePrompt(challenge.a, challenge.b));
    const readout = createText('p', '', 'parent-readout');
    readout.setAttribute('aria-live', 'polite');
    readout.setAttribute('aria-label', pl.parent.gateAnswer);
    const message = createText('p', '', 'parent-message');
    message.setAttribute('role', 'status');

    const showDigits = (): void => {
        readout.textContent = digits;
    };
    const press = (key: GateKey): void => {
        digits = gateInput(digits, key, parentGate.maxDigits);
        showDigits();
    };
    const submit = (): void => {
        if (checkAnswer(challenge, digits)) {
            handle.close();
            onPass();
            return;
        }
        challenge = createChallenge(rng, parentGate);
        digits = '';
        prompt.textContent = pl.parent.gatePrompt(challenge.a, challenge.b);
        message.textContent = pl.parent.gateWrong;
        showDigits();
    };
    const cancel = (): void => {
        handle.close();
        onCancel();
    };

    const keys = document.createElement('div');
    keys.className = 'parent-keys';
    const digitButton = (key: GateKey): HTMLButtonElement => createButton(key, () => press(key));
    keys.append(
        ...DIGITS.map(digitButton),
        createButton('⌫', () => press('back')),
        digitButton('0'),
    );
    keys.children[9].setAttribute('aria-label', pl.parent.deleteKey);
    const ok = createButton(pl.parent.okKey, submit);
    ok.classList.add('parent-primary');
    const actions = document.createElement('div');
    actions.className = 'parent-actions';
    actions.append(ok, createButton(pl.parent.cancel, cancel));

    const handle = openDialog(
        parent,
        createText('h1', pl.parent.gateTitle),
        [prompt, readout, message, keys, actions],
        cancel,
        (event) => {
            if (event.key >= '0' && event.key <= '9' && event.key.length === 1) {
                press(event.key as GateKey);
            } else if (event.key === 'Backspace') {
                press('back');
            } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
                submit();
            }
        },
    );
    return handle.close;
};
