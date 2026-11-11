import { translate } from './helpers/translate.js';

// EXIT IF: leaves a loop when a condition is true. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['leaving a Do', 'Do\nExit If X=1\nLoop', 'loop1: while (true) { if (X == 1) { break loop1; }'],
])('Exit If translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
