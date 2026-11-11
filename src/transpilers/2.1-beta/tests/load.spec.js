import { translate } from './helpers/translate.js';

// LOAD: loads a file into a memory bank (bank 1 by default).
// https://amospromanual.dev/05-09-memory-banks.html

test.each([
  ['without a bank number', 'Load "assets/icons.abk"', 'loadBank(\'"assets/icons.abk"\', 1);'],
  ['with a bank number', 'Load "assets/icons.abk", 2', 'loadBank(\'"assets/icons.abk"\', 2);'],
])('Load translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
