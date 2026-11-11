import { translate } from './helpers/translate.js';

// DRAW TO: draws a line from the graphic cursor to a point.
// https://amospromanual.dev/06-04-graphics.html

test('Draw To starts at the graphic cursor', async () => {
  const javascript = await translate('Draw To 275,175');

  expect(javascript).toContain('const drawX1 = graphicCursorX;');
  expect(javascript).toContain('const drawY1 = graphicCursorY;');
  expect(javascript).toContain('const drawX2 = 275;');
  expect(javascript).toContain('const drawY2 = 175;');
});

test('Draw moves the graphic cursor to the end of the line', async () => {
  const javascript = await translate('Draw 50,50 To 250,150');

  expect(javascript).toContain('graphicCursorX = drawX2;');
  expect(javascript).toContain('graphicCursorY = drawY2;');
});
