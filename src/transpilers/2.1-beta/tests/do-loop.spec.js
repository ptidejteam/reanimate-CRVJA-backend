import { translate } from './helpers/translate.js';

// DO ... LOOP: repeats a block forever, waiting one frame on each pass.
// https://amospromanual.dev/05-04-control-structures.html

test.each([
  [
    'an empty loop',
    'Do\nLoop',
    'loop1: while (true) { await new Promise((r) => setTimeout(r, 16)); }',
  ],
])('Do translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
