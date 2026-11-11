import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// ABS: the absolute value of a number. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a negative number', 'X = Abs(-3)', 'X = Math.abs(-3);'],
  ['a variable', 'X = Abs(Y)', 'X = Math.abs(Y);'],
  ['a float variable', 'X# = Abs(Y#)', 'X_f = Math.abs(Y_f);'],
  ['an expression', 'X = Abs(Y - 10)', 'X = Math.abs(Y - 10);'],
])('Abs translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Abs(-1),Abs(1)
test.each([
  ['Abs(-3)', 3],
  ['Abs(-1)', 1],
  ['Abs(1)', 1],
  ['Abs(-2.5)', 2.5],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Abs()', 'X = Abs(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
