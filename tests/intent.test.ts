import { describe, expect, it } from 'vitest';
import { parseIntent } from '../src/intent/intent';

describe('intent parsing', () => {
 it('parses expense intent with amount and category', () => {
   const intent = parseIntent('I spent ₦25,000 on groceries.');

   expect(intent.type).toBe('add_expense');
   expect(intent.amountMinor).toBe(2500000);
   expect(intent.category).toBe('groceries');
 });

 it('parses savings intent with amount', () => {
   const intent = parseIntent('I want to save ₦500,000.');

  expect(intent.type).toBe('create_savings_goal');
  expect(intent.amountMinor).toBe(50000000);

 });

  it('parses budget intent', () => {
    const intent = parseIntent('I want to create a monthly budget.');
    expect(intent.type).toBe('create_budget');
  });
});
