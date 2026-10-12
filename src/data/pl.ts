// All player-facing Polish strings live here. Scenes and generators reference
// keys, never literals. Task prompts that need a number are functions.
export const pl = {
    title: 'Martynka urządza',
    bootPlaceholder: 'Szkielet gry',
    overlay: {
        rotate: 'Obróć tablet',
        rotateHint: 'Gra działa w poziomie.',
    },
    install: {
        title: 'Zainstaluj grę na tablecie',
        ipad: 'Stuknij Udostępnij (kwadrat ze strzałką), potem „Do ekranu początkowego”.',
        android: 'Stuknij menu ⋮ w prawym górnym rogu, potem „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”.',
        afterInstall: 'Potem uruchamiaj grę z ikony. Działa też bez internetu.',
        installButton: 'Zainstaluj',
        continueButton: 'Zagraj w przeglądarce',
    },
    tasks: {
        missing: 'Jaka liczba pasuje w okienku?',
        missingHint: (inverse: string) => `Policz w drugą stronę: ${inverse}`,
        complement: (n: number, target: number) => `Ile brakuje od ${n} do ${target}?`,
        complementHint: (n: number, target: number) => `${n} + ${target - n} = ${target}`,
        rounding: (n: number) => `Która pełna dziesiątka jest najbliżej liczby ${n}?`,
        roundingHint: (n: number, low: number, high: number, nearest: number) => [
            `${n} jest między ${low} a ${high}`,
            `${n} jest bliżej ${nearest}`,
        ],
    },
} as const;
