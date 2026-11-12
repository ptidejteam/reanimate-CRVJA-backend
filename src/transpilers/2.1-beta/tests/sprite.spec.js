import { translate } from './helpers/translate.js';

// SPRITE: shows a sprite image at a position. https://amospromanual.dev/07-01-hardware-sprites.html

test.each([
  ['numbers', 'Sprite 1,100,200,3', 'renderSprite(1, 100, 200, 3);'],
  ['variables', 'Sprite 1,X,Y,IMG', 'renderSprite(1, X, Y, IMG);'],
])('Sprite translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
