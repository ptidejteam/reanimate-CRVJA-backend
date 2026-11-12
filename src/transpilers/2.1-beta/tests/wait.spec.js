import { translate } from './helpers/translate.js';

// WAIT: waits a number of 50ths of a second. https://amospromanual.dev/05-01-the-bare-bones.html

// Manual example: Wait 100 waits two seconds.
test.each([
  ['two seconds (manual example)', 'Wait 100', 'await new Promise((r) => setTimeout(r, 2000));'],
  ['one fifth of a second', 'Wait 10', 'await new Promise((r) => setTimeout(r, 200));'],
])('Wait translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
