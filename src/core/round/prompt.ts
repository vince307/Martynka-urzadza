// How the task scene lays out a prompt: a bare calculation ("38 + 27", "17 − 8 = □")
// is shown large under the word "Oblicz"; anything else is a sentence-sized prompt.
const EXPRESSION = /^[\d\s+−·:()□=?]+$/u;

export const isExpression = (prompt: string): boolean => /\d|□/u.test(prompt) && EXPRESSION.test(prompt);
