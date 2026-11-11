import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// UPPER$: a string in capital letters. https://amospromanual.dev/05-02-string-functions.html

test.each([
  ['a string', 'RESULT$=Upper$("AbC")', "RESULT$ = 'AbC'.toUpperCase();"],
  [
    'nested functions',
    'RESULT$=Upper$(Flip$(Lower$("AbC")))',
    "RESULT$ = 'AbC'.toLowerCase().split('').reverse().join('').toUpperCase();",
  ],
])('Upper$ translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Manual example: Print Upper$("aMoS pRoFeSsIoNaL")
test.each([
  ['Upper$("aMoS pRoFeSsIoNaL")', 'AMOS PROFESSIONAL'],
  ['Upper$(Flip$(Lower$("AbC")))', 'CBA'],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
