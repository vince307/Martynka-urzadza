// Polish numeral agreement: 1 jabłko, 2 jabłka, 5 jabłek (plan section 14).
// Pure functions shared by task templates, UI strings and the task validator.

/** Noun forms for the three Polish plural categories, e.g. ['jabłko', 'jabłka', 'jabłek']. */
export type PluralForms = readonly [one: string, few: string, many: string];

export type PluralCategory = 'one' | 'few' | 'many';

/**
 * Category of a non-negative integer: `one` for 1; `few` when the last digit
 * is 2–4 but the last two digits are not 12–14; `many` otherwise (0, 5–21,
 * 25–31, 112, …).
 */
export const pluralCategory = (n: number): PluralCategory => {
    if (!Number.isInteger(n) || n < 0) {
        throw new RangeError(`pluralCategory() needs a non-negative integer, got ${n}`);
    }
    if (n === 1) {
        return 'one';
    }
    const lastDigit = n % 10;
    const lastTwo = n % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
        return 'few';
    }
    return 'many';
};

export const inflect = (n: number, forms: PluralForms): string => {
    const category = pluralCategory(n);
    return category === 'one' ? forms[0] : category === 'few' ? forms[1] : forms[2];
};

/** "5 jabłek": the number followed by the agreeing form. */
export const countNoun = (n: number, forms: PluralForms): string => `${n} ${inflect(n, forms)}`;
