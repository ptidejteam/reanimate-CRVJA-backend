import { translate } from './helpers/translate.js';

// WAIT: waits a number of 50ths of a second (20 milliseconds each).
// https://amospromanual.dev/05-01-the-bare-bones.html

test.each([
  [
    'two seconds (manual example)',
    'Wait 100',
    'await new Promise((r) => setTimeout(r, 100 * 20));',
  ],
  ['a variable', 'Wait N', 'await new Promise((r) => setTimeout(r, N * 20));'],
  ['an expression', 'Wait N + 1', 'await new Promise((r) => setTimeout(r, (N + 1) * 20));'],
])('Wait translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
