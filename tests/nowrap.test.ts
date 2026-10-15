// Origin: S-14b visual gate. Solution lines beside a written column wrapped inside an equation ("9 + / 3 = 12", "15 / − 8 = 7.")
// and left a lone number on the last line ("odejmij / 9."); the wrap only breaks at plain spaces, so the helper glues those with a no-break space.
import { describe, expect, it } from 'vitest';
import { keepTogether } from '../src/core/text/nowrap';

const NB = ' ';

describe('keepTogether', () => {
    it('glues an equation into one unbreakable piece', () => {
        expect(keepTogether('Jedności: 9 + 3 = 12. Piszę 2, 1 dalej.')).toBe(`Jedności: 9${NB}+${NB}3${NB}=${NB}12. Piszę 2, 1 dalej.`);
        expect(keepTogether('805 − 198 = 607')).toBe(`805${NB}−${NB}198${NB}=${NB}607`);
        expect(keepTogether('6 · 4 = 24, 12 : 3 = 4')).toBe(`6${NB}·${NB}4${NB}=${NB}24, 12${NB}:${NB}3${NB}=${NB}4`);
    });

    it('keeps a number that ends the line with the word before it', () => {
        expect(keepTogether('Idź pod prąd strzałki: od 12 odejmij 9.')).toBe(`Idź pod prąd strzałki: od 12 odejmij${NB}9.`);
    });

    it('leaves a colon after a word and ordinary words alone', () => {
        expect(keepTogether('Jedności: 5 − 8 nie da się.')).toBe(`Jedności: 5${NB}−${NB}8 nie da się.`);
        expect(keepTogether('Policz skoki i sprawdź, jak długi jest jeden skok.')).toBe('Policz skoki i sprawdź, jak długi jest jeden skok.');
    });
});
