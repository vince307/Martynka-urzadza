// Polish noun forms (one / few / many) for word problems and the task validator.
// Grows with the WORD templates (roadmap S-02); the validator only checks
// nouns listed here.
import type { PluralForms } from '../core/text/plural';

export const nouns: Readonly<Record<string, PluralForms>> = {
    jabłko: ['jabłko', 'jabłka', 'jabłek'],
    gruszka: ['gruszka', 'gruszki', 'gruszek'],
    rogalik: ['rogalik', 'rogaliki', 'rogalików'],
    książka: ['książka', 'książki', 'książek'],
    kredka: ['kredka', 'kredki', 'kredek'],
    filiżanka: ['filiżanka', 'filiżanki', 'filiżanek'],
    klocek: ['klocek', 'klocki', 'klocków'],
    gwiazdka: ['gwiazdka', 'gwiazdki', 'gwiazdek'],
    złoty: ['złoty', 'złote', 'złotych'],
    grosz: ['grosz', 'grosze', 'groszy'],
    cyfra: ['cyfra', 'cyfry', 'cyfr'],
    dziesiątka: ['dziesiątka', 'dziesiątki', 'dziesiątek'],
    jedność: ['jedność', 'jedności', 'jedności'],
    ciastko: ['ciastko', 'ciastka', 'ciastek'],
    kwiatek: ['kwiatek', 'kwiatki', 'kwiatków'],
    poduszka: ['poduszka', 'poduszki', 'poduszek'],
    talerz: ['talerz', 'talerze', 'talerzy'],
    pudełko: ['pudełko', 'pudełka', 'pudełek'],
    półka: ['półka', 'półki', 'półek'],
    naklejka: ['naklejka', 'naklejki', 'naklejek'],
    rok: ['rok', 'lata', 'lat'],
};
