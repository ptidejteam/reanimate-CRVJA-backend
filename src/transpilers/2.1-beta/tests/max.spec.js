import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// MAX: the largest of two values. https://amospromanual.dev/05-03-maths.html

test.each([
  ['two numbers', 'X = Max(99, 1)', 'X = Math.max(99, 1);'],
  ['two variables', 'X = Max(A, B)', 'X = Math.max(A, B);'],
  ['two expressions', 'X = Max(A + 1, B * 2)', 'X = Math.max(A + 1, B * 2);'],
  ['a negative number', 'X = Max(-5, A)', 'X = Math.max(-5, A);'],
  ['Min inside', 'X = Max(Min(A, 10), 0)', 'X = Math.max(Math.min(A, 10), 0);'],
  ['an operation on the result', 'X = Max(A, B) + 1', 'X = Math.max(A, B) + 1;'],
])('Max translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Max(99,1)
test.each([
  ['Max(99, 1)', 99],
  ['Max(-5, -10)', -5],
  ['Max(1.5, 2.5)', 2.5],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Max(1)', 'X = Max(1, 2, 3)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});

// The manual also accepts two strings: Max("AMOS Professional","AMOS") is "AMOS Professional".
// Math.max() only compares numbers (it returns NaN for strings), so this is not supported yet.
