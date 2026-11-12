import { translate } from './helpers/translate.js';

// KEY STATE: true while a key is held down, given by its scan code.
// https://amospromanual.dev/10-01-using-the-keyboard.html
// Only accepted as a condition (If, Else If, While, Until).

test.each([
  ['a hex scan code', 'If Key State($45)\nEnd If', 'if (currentPressedKey === keyMapping[69]) {'],
  [
    'an expression',
    'If Key State($10+I)\nEnd If',
    'if (currentPressedKey === keyMapping[16 + I]) {',
  ],
  ['in a While', 'While Key State($10)\nWend', 'while (currentPressedKey === keyMapping[16]) {'],
])('Key State translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
