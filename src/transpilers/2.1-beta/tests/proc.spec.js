import { translate } from './helpers/translate.js';

// PROC: an optional keyword before a Procedure call; Proc NAME is the same as NAME.
// https://amospromanual.dev/05-05-procedures.html

test.each([
  ['a call without parameters', 'Procedure P\nEnd Proc\nProc P', 'await P();'],
  ['a call with parameters', 'Procedure S[A,B]\nEnd Proc\nProc S[1,2]', 'await S(1, 2);'],
])('Proc translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
