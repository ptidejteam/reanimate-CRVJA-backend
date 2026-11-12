import { translate } from './helpers/translate.js';

// Y SPRITE: the y position of a sprite. https://amospromanual.dev/07-01-hardware-sprites.html

test.each([
  ['a number', 'Y = Y Sprite(1)', 'Y = getYSpritePosition(1);'],
  ['an expression', 'Y = Y Sprite(N + 1)', 'Y = getYSpritePosition(N + 1);'],
])('Y Sprite translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
