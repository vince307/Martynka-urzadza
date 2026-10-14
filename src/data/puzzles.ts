// LOGIC puzzle pool for E3-E4 (original, hand-written; ZADANIA section 4). Minus is U+2212.
// Hint line 1 teaches the method without the result; hint line 2 is the full solution ending with the answer.
import type { PuzzleDef } from '../core/puzzles';

export const PUZZLES: readonly PuzzleDef[] = [
    {
        id: 'floors-up', kind: 'floors', stage: 'E3', answer: 5, choices: [4, 5, 6],
        prompt: 'Kasia mieszka na drugim piętrze. Bartek mieszka 3 piętra wyżej niż Kasia. Na którym piętrze mieszka Bartek?',
        hint: ['Zacznij od piętra Kasi i idź 3 piętra w górę.', '2 + 3 = 5. Bartek mieszka na piątym piętrze.'],
    },
    {
        id: 'floors-chain', kind: 'floors', stage: 'E3', answer: 2, choices: [1, 2, 3],
        prompt: 'Zosia mieszka na czwartym piętrze. Igor mieszka piętro niżej niż Zosia, a Ania piętro niżej niż Igor. Na którym piętrze mieszka Ania?',
        hint: ['Zejdź od Zosi o 1 piętro do Igora, a potem o 1 piętro do Ani.', '4 − 1 = 3, 3 − 1 = 2. Ania mieszka na drugim piętrze.'],
    },
    {
        id: 'floors-lift', kind: 'floors', stage: 'E4', answer: 4,
        prompt: 'Winda ruszyła z parteru. Pojechała 7 pięter w górę, a potem 3 piętra w dół. Na którym piętrze stanęła?',
        hint: ['Parter to 0. Najpierw jedź w górę, potem w dół.', '0 + 7 = 7, 7 − 3 = 4.'],
    },
    {
        id: 'train-bear', kind: 'train', stage: 'E3', answer: 9, choices: [8, 9, 10],
        prompt: 'Pociąg wiezie zabawki. Wagon z misiem jest czwarty od początku i szósty od końca. Ile wagonów ma pociąg?',
        hint: ['Przed misiem są 3 wagony, a za nim 5 wagonów.', '3 + 1 + 5 = 9. Pociąg ma 9 wagonów.'],
    },
    {
        id: 'train-queue', kind: 'train', stage: 'E4', answer: 12, choices: [11, 12, 13],
        prompt: 'Janek stoi w kolejce do kasy. Jest ósmy od przodu i piąty od tyłu. Ile osób stoi w kolejce?',
        hint: ['Przed Jankiem stoi 7 osób, a za nim 4 osoby.', '7 + 1 + 4 = 12. W kolejce stoi 12 osób.'],
    },
    {
        id: 'number-tens', kind: 'number', stage: 'E3', answer: 25,
        prompt: 'Mam 2 dziesiątki. Moja cyfra jedności jest o 3 większa niż cyfra dziesiątek. Jaką jestem liczbą?',
        hint: ['2 dziesiątki to 20. Ile jedności trzeba dodać?', 'Jedności: 2 + 3 = 5. Jestem liczbą 25.'],
    },
    {
        id: 'number-odd', kind: 'number', stage: 'E3', answer: 17, choices: [17, 18, 19],
        prompt: 'Jestem liczbą nieparzystą. Jestem większa od 16 i mniejsza od 20, ale nie jestem 19. Jaką jestem liczbą?',
        hint: ['Liczby między 16 a 20 to 17, 18 i 19.', 'Nieparzyste są 17 i 19. Bez 19 zostaje 17.'],
    },
    {
        id: 'number-times', kind: 'number', stage: 'E4', answer: 8,
        prompt: 'Gdy pomnożysz mnie przez 5, otrzymasz 40. Jaką jestem liczbą?',
        hint: ['Szukasz liczby: □ · 5 = 40. Pomoże dzielenie.', '40 : 5 = 8. Jestem liczbą 8.'],
    },
    {
        id: 'number-digits', kind: 'number', stage: 'E4', answer: 63,
        prompt: 'Jestem liczbą dwucyfrową. Suma moich cyfr to 9, a cyfra dziesiątek jest 2 razy większa od cyfry jedności. Jaką jestem liczbą?',
        hint: ['Sprawdzaj cyfry jedności po kolei: 1, 2, 3… i podwajaj je.', 'Jedności 3, dziesiątki 6, a 6 + 3 = 9. Jestem liczbą 63.'],
    },
    {
        id: 'scale-parcels', kind: 'scale', stage: 'E3', answer: 5,
        prompt: 'Na jednej szalce leżą 2 jednakowe paczki, a na drugiej odważnik 10 kg. Waga jest w równowadze. Ile kilogramów waży jedna paczka?',
        hint: ['W równowadze obie szalki ważą tyle samo: 2 paczki ważą razem 10 kg.', '10 : 2 = 5. Jedna paczka waży 5 kg.'],
    },
    {
        id: 'scale-fruit', kind: 'scale', stage: 'E3', answer: 4, choices: [2, 3, 4],
        prompt: 'Jedno jabłko waży tyle, co 2 śliwki. Jedna gruszka waży tyle, co 2 jabłka. Ile śliwek waży tyle, co jedna gruszka?',
        hint: ['Zamień gruszkę na 2 jabłka, a każde jabłko na śliwki.', '2 + 2 = 4. Gruszka waży tyle, co 4 śliwki.'],
    },
    {
        id: 'scale-pumpkin', kind: 'scale', stage: 'E4', answer: 6,
        prompt: 'Na lewej szalce leży dynia i odważnik 2 kg, a na prawej odważniki 5 kg i 3 kg. Waga jest w równowadze. Ile kilogramów waży dynia?',
        hint: ['Prawa szalka waży 5 kg + 3 kg. Lewa waży tyle samo.', '5 + 3 = 8, 8 − 2 = 6. Dynia waży 6 kg.'],
    },
    {
        id: 'water-pour', kind: 'water', stage: 'E3', answer: 2, choices: [2, 3, 8],
        prompt: 'Duży dzbanek mieści 5 litrów, a mały 3 litry. Napełniasz duży i przelewasz z niego wodę do małego, aż mały będzie pełny. Ile litrów wody zostanie w dużym dzbanku?',
        hint: ['Z dużego dzbanka ubyło tyle wody, ile zmieścił mały.', '5 − 3 = 2. W dużym dzbanku zostaną 2 litry.'],
    },
    {
        id: 'water-bucket', kind: 'water', stage: 'E3', answer: 4,
        prompt: 'Mały dzbanek mieści 2 litry. Ile razy trzeba go napełnić i wylać do wiadra, żeby w wiadrze było 8 litrów?',
        hint: ['Za każdym razem w wiadrze przybywają 2 litry. Licz dwójkami aż do 8.', '2, 4, 6, 8: to 4 razy. 8 : 2 = 4.'],
    },
    {
        id: 'water-empty', kind: 'water', stage: 'E4', answer: 3,
        prompt: 'Duży dzbanek mieści 7 litrów, a mały 4 litry. Napełniasz duży, przelewasz z niego wodę do małego aż do pełna, a potem wylewasz wodę z małego. Ile litrów zostało w dużym dzbanku?',
        hint: ['Mały zabrał z dużego tyle wody, ile mieści.', '7 − 4 = 3. W dużym dzbanku zostały 3 litry.'],
    },
];
