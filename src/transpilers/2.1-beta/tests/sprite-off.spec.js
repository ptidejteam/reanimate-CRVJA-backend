import { translate } from './helpers/translate.js';

// SPRITE OFF: hides one sprite, or all sprites. https://amospromanual.dev/07-01-hardware-sprites.html

test.each([
  ['one sprite', 'Sprite Off 0', 'spriteOff(0);'],
  ['all sprites', 'Sprite Off', 'spriteOff();'],
])('Sprite Off hides %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
