import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// EXP: e raised to the power of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Exp(0)', 'X = Math.trunc(Math.exp(0));'],
  ['a positive number', 'X = Exp(1)', 'X = Math.trunc(Math.exp(1));'],
  ['a negative number', 'X = Exp(-1)', 'X = Math.trunc(Math.exp(-1));'],
  ['a decimal number', 'X# = Exp(0.5)', 'X_f = Math.exp(0.5);'],
  ['a variable', 'X = Exp(Y)', 'X = Math.trunc(Math.exp(Y));'],
  ['a float variable', 'X# = Exp(Y#)', 'X_f = Math.exp(Y_f);'],
  ['an expression', 'X = Exp(Y + 1)', 'X = Math.trunc(Math.exp(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Exp(VALUES#(1 + 1))',
    'X_f = Math.exp(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Exp((Y + 1) * 2)', 'X = Math.trunc(Math.exp((Y + 1) * 2));'],
  ['a nested function', 'X = Exp(Abs(-1))', 'X = Math.trunc(Math.exp(Math.abs(-1)));'],
  ['an operation on the result', 'X = Exp(1) + 2', 'X = Math.trunc(Math.exp(1) + 2);'],
])('Exp translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Exp(1)
test.each([
  ['Exp(0)', 1],
  ['Exp(1)', 2.718281828459045],
  ['Exp(-1000)', 0],
  ['Exp(1000)', Infinity],
  ['Exp(Ln(-1))', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Exp()', 'X = Exp(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
