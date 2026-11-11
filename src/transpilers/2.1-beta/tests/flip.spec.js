import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// FLIP$: a string written backwards. https://amospromanual.dev/05-02-string-functions.html

test.each([['a string', 'RESULT$=Flip$("AbC")', "RESULT$ = 'AbC'.split('').reverse().join('');"]])(
  'Flip$ translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);

// Manual example: Print Flip$("SOMA gnippilf")
test.each([
  ['Flip$("SOMA gnippilf")', 'flipping AMOS'],
  ['Flip$("AbC")', 'CbA'],
])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
