import { translate } from './helpers/translate.js';

// DRAW: draws a line from one point to another. https://amospromanual.dev/06-04-graphics.html

test('Draw with numbers', async () => {
  const javascript = await translate('Draw 50,50 To 250,150');

  expect(javascript).toContain('const drawX1 = 50;');
  expect(javascript).toContain('const drawY1 = 50;');
  expect(javascript).toContain('const drawX2 = 250;');
  expect(javascript).toContain('const drawY2 = 150;');
});

test('Draw with variables', async () => {
  const javascript = await translate('X=10 : Y=20\nDraw X,Y To X+100,Y');

  expect(javascript).toContain('const drawX1 = X;');
  expect(javascript).toContain('const drawX2 = X + 100;');
});
