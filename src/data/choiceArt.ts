// The two first-building choice cards (S-28): converted to WebP by `npm run art` (public/assets/choice/) at the pack's native size.
// Loaded by BootScene only while no learner exists (a fresh install); precached by the service worker either way.
// tests/choiceArt.test.ts checks the table against the files and their headers.
export interface ChoiceArtEntry {
    id: 'house' | 'space';
    key: string;
    url: string;
    width: 720;
    height: 480;
}

export const CHOICE_ART: readonly ChoiceArtEntry[] = [
    { id: 'house', key: 'choice/house', url: 'assets/choice/choice-house.webp', width: 720, height: 480 },
    { id: 'space', key: 'choice/space', url: 'assets/choice/choice-space.webp', width: 720, height: 480 },
];
