import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// LOG: the base 10 logarithm of a number. https://amospromanual.dev/05-03-maths.html
// An integer variable (X) stores the result truncated toward zero; a float variable (X#) keeps it.

test.each([
  ['zero', 'X = Log(0)', 'X = Math.trunc(Math.log10(0));'],
  ['a positive number', 'X = Log(1)', 'X = Math.trunc(Math.log10(1));'],
  ['a negative number', 'X = Log(-1)', 'X = Math.trunc(Math.log10(-1));'],
  ['a decimal number', 'X# = Log(0.5)', 'X_f = Math.log10(0.5);'],
  ['a variable', 'X = Log(Y)', 'X = Math.trunc(Math.log10(Y));'],
  ['a float variable', 'X# = Log(Y#)', 'X_f = Math.log10(Y_f);'],
  ['an expression', 'X = Log(Y + 1)', 'X = Math.trunc(Math.log10(Y + 1));'],
  [
    'an array element',
    'Dim VALUES#(3)\nX# = Log(VALUES#(1 + 1))',
    'X_f = Math.log10(VALUES_f[Math.trunc(1 + 1)]);',
  ],
  ['a grouped expression', 'X = Log((Y + 1) * 2)', 'X = Math.trunc(Math.log10((Y + 1) * 2));'],
  ['a nested function', 'X = Log(Abs(-1))', 'X = Math.trunc(Math.log10(Math.abs(-1)));'],
  ['an operation on the result', 'X = Log(1) + 2', 'X = Math.trunc(Math.log10(1) + 2);'],
])('Log translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Log(10) and A#=Log(100)
test.each([
  ['Log(1)', 0],
  ['Log(10)', 1],
  ['Log(100)', 2],
  ['Log(0)', -Infinity],
  ['Log(-1)', NaN],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Log()', 'X = Log(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
