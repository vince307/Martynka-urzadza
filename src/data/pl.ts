// All player-facing Polish strings live here. Scenes reference keys, never literals.
export const pl = {
    title: 'Martynka urządza',
    bootPlaceholder: 'Szkielet gry',
    overlay: {
        rotate: 'Obróć tablet',
        rotateHint: 'Gra działa w poziomie.',
    },
    install: {
        title: 'Dodaj grę do ekranu początkowego',
        ipad: 'Stuknij Udostępnij (kwadrat ze strzałką), potem „Do ekranu początkowego”.',
        android: 'Stuknij menu ⋮ w prawym górnym rogu, potem „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”.',
        afterInstall: 'Potem uruchamiaj grę z ikony. Działa też bez internetu.',
        installButton: 'Zainstaluj',
        continueButton: 'Zagraj w przeglądarce',
    },
} as const;
