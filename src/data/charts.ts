// Themes for bar-chart tasks (DATA, S-13): what the children voted for. `label` is
// the bar caption (nominative), `acc` the form after "zagłosowało na".
export interface ChartItem {
    label: string;
    acc: string;
}

export interface ChartTheme {
    id: string;
    intro: string;       // one sentence that sets the scene
    most: string;        // question about the highest bar
    least: string;       // question about the lowest bar
    items: readonly ChartItem[];
}

export const chartThemes: readonly ChartTheme[] = [
    {
        id: 'fruit',
        intro: 'Dzieci głosowały na swój ulubiony owoc.',
        most: 'Który owoc dostał najwięcej głosów?',
        least: 'Który owoc dostał najmniej głosów?',
        items: [
            { label: 'Jabłko', acc: 'jabłko' },
            { label: 'Gruszka', acc: 'gruszkę' },
            { label: 'Banan', acc: 'banana' },
            { label: 'Śliwka', acc: 'śliwkę' },
            { label: 'Truskawka', acc: 'truskawkę' },
        ],
    },
    {
        id: 'animal',
        intro: 'Dzieci głosowały na swoje ulubione zwierzę.',
        most: 'Które zwierzę dostało najwięcej głosów?',
        least: 'Które zwierzę dostało najmniej głosów?',
        items: [
            { label: 'Pies', acc: 'psa' },
            { label: 'Kot', acc: 'kota' },
            { label: 'Koń', acc: 'konia' },
            { label: 'Królik', acc: 'królika' },
            { label: 'Ryba', acc: 'rybę' },
        ],
    },
    {
        id: 'colour',
        intro: 'Dzieci głosowały na swój ulubiony kolor.',
        most: 'Który kolor dostał najwięcej głosów?',
        least: 'Który kolor dostał najmniej głosów?',
        items: [
            { label: 'Czerwony', acc: 'kolor czerwony' },
            { label: 'Niebieski', acc: 'kolor niebieski' },
            { label: 'Zielony', acc: 'kolor zielony' },
            { label: 'Żółty', acc: 'kolor żółty' },
            { label: 'Różowy', acc: 'kolor różowy' },
        ],
    },
];
