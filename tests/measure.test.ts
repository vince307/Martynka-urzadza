import { describe, expect, it } from 'vitest';
import { formatCelsius, formatMoney, spokenCelsius, spokenMoney } from '../src/core/text/measure';

describe('formatMoney', () => {
    it('writes whole złoty, grosze alone and both the way the school does', () => {
        expect(formatMoney(500)).toBe('5 zł');
        expect(formatMoney(40)).toBe('40 gr');
        expect(formatMoney(340)).toBe('3 zł 40 gr');
        expect(formatMoney(305)).toBe('3 zł 5 gr');
        expect(formatMoney(1)).toBe('1 gr');
        expect(formatMoney(0)).toBe('0 zł');
        expect(formatMoney(12050)).toBe('120 zł 50 gr');
    });

    it('rejects negative and fractional amounts', () => {
        expect(() => formatMoney(-1)).toThrow(RangeError);
        expect(() => formatMoney(1.5)).toThrow(RangeError);
    });
});

describe('formatCelsius', () => {
    it('uses the real minus sign, no plus and a degree sign', () => {
        expect(formatCelsius(-5)).toBe('−5 °C');
        expect(formatCelsius(0)).toBe('0 °C');
        expect(formatCelsius(12)).toBe('12 °C');
        expect(formatCelsius(-30)).toBe('−30 °C');
    });

    it('rejects a fractional temperature', () => {
        expect(() => formatCelsius(2.5)).toThrow(RangeError);
    });
});

describe('spokenMoney', () => {
    it('speaks numbers as words with agreeing złoty and grosze', () => {
        expect(spokenMoney(100)).toBe('jeden złoty');
        expect(spokenMoney(200)).toBe('dwa złote');
        expect(spokenMoney(500)).toBe('pięć złotych');
        expect(spokenMoney(340)).toBe('trzy złote czterdzieści groszy');
        expect(spokenMoney(2205)).toBe('dwadzieścia dwa złote pięć groszy');
        expect(spokenMoney(1)).toBe('jeden grosz');
        expect(spokenMoney(22)).toBe('dwadzieścia dwa grosze');
    });
});

describe('spokenCelsius', () => {
    it('says minus and agrees stopień/stopnie/stopni on the absolute value', () => {
        expect(spokenCelsius(-5)).toBe('minus pięć stopni');
        expect(spokenCelsius(-1)).toBe('minus jeden stopień');
        expect(spokenCelsius(0)).toBe('zero stopni');
        expect(spokenCelsius(2)).toBe('dwa stopnie');
        expect(spokenCelsius(22)).toBe('dwadzieścia dwa stopnie');
        expect(spokenCelsius(12)).toBe('dwanaście stopni');
    });
});
