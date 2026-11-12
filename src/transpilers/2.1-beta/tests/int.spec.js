import { translate, syntaxErrors } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// INT: rounds a number down to the whole number below it. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a number', 'X = Int(3.9)', 'X = Math.floor(3.9);'],
  ['a float variable', 'X = Int(Y#)', 'X = Math.floor(Y_f);'],
])('Int translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Int(3.9999) and Print Int(-1.1) give 3 and -2.
test.each([
  ['Int(3.9999)', 3],
  ['Int(-1.1)', -2],
  ['Int(5)', 5],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});

test.each(['X = Int()', 'X = Int(1, 2)'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
