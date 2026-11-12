import { translate } from './helpers/translate.js';

// X SPRITE: the x position of a sprite. https://amospromanual.dev/07-01-hardware-sprites.html

test.each([
  ['a number', 'X = X Sprite(1)', 'X = getXSpritePosition(1);'],
  ['an expression', 'X = X Sprite(N + 1)', 'X = getXSpritePosition(N + 1);'],
])('X Sprite translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
