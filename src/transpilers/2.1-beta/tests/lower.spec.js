import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// LOWER$: a string in small letters. https://amospromanual.dev/05-02-string-functions.html

test.each([
  ['a string', 'RESULT$=Lower$("AbC")', "RESULT$ = 'AbC'.toLowerCase();"],
  ['an expression', 'RESULT$=Lower$(TEXT$+"Ab")', "RESULT$ = (TEXT$ + 'Ab').toLowerCase();"],
])('Lower$ translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test.each([
  ['Lower$("AbC")', 'abc'],
  ['Lower$("X" + "Ab")', 'xab'],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
