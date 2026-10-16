// PIC-02 / GRD-03 wiring, read as source text: TaskScene feeds the reducers only through rawToDragEvent and both "OK"
// buttons ask canSubmit. This proves the wiring; the reducers are proven in trayDrag/clockSet/dragEvents tests.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('gesture wiring', () => {
    it('the four TaskScene pointer listeners go through rawToDragEvent', () => {
        const scene = read('../src/scenes/TaskScene.ts');
        for (const kind of ['down', 'move', 'up', 'upoutside']) {
            expect(scene).toMatch(new RegExp(`rawToDragEvent\\('${kind}'`));
        }
        expect(scene).not.toMatch(/pointerupoutside', \(\) =>/);
    });

    it('the coin wallet "OK", the block mat "OK" and the clock "OK" ask canSubmit', () => {
        expect(read('../src/ui/widgets/CoinWallet.ts')).toMatch(/canSubmit\(this\.state\)/);
        expect(read('../src/scenes/TaskScene.ts')).toMatch(/canSubmit\(this\.clockState\)/);
        expect(read('../src/scenes/TaskScene.ts')).toMatch(/new BlockMat\(this, \(value\) => \{ if \(canSubmit\(this\.dragState\)\)/);
    });
});
