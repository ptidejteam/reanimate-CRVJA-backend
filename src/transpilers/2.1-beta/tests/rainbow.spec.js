import { syntaxErrors } from './helpers/translate.js';

// RAINBOW: parsed but not translated yet. As in the AMOS manual, it takes 4 values.
// https://amospromanual.dev/06-03-screen-effects.html

test.each(['Rainbow 1,0,128,16', 'Rainbow 1,0,128+M*12,16'])('%s parses', async (amos) => {
  expect(await syntaxErrors(amos)).toEqual([]);
});

test.each(['Rainbow 1,0,128', 'Rainbow 1,0,128,16,5'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
