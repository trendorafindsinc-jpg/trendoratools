import { describe, expect, it } from 'vitest';
import { formatMinor, parseAmountToMinor } from '../src/core/money';

describe('money', () => {
 it('parses whole amounts into minor units', () => {
   expect(parseAmountToMinor('25,000')).toBe(2500000);
   expect(parseAmountToMinor('25000')).toBe(2500000);
 });

 it('parses decimal amounts', () => {
   expect(parseAmountToMinor('12.3')).toBe(1230);
   expect(parseAmountToMinor('12.30')).toBe(1230);
 });

 it('rejects invalid and negative values', () => {
   expect(parseAmountToMinor('-5')).toBeNull();

   expect(parseAmountToMinor('abc')).toBeNull();
   expect(parseAmountToMinor('')).toBeNull();
 });

  it('formats minor units with two decimals', () => {
    expect(formatMinor(2500000, 'NGN')).toContain('25,000.00');
  });
});
