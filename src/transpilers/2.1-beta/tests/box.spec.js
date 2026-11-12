import { translate } from './helpers/translate.js';

// BOX: draws the outline of a rectangle in the Ink colour. https://amospromanual.dev/06-04-graphics.html

test('Box outlines the rectangle from x1, y1 to x2, y2', async () => {
  const javascript = await translate('Box 10,20 To 100,200');

  expect(javascript).toContain("boxDiv.style.border = '2px solid ' + getColour(Ink);");
  expect(javascript).toContain("boxDiv.style.left = 10 + 'px';");
  expect(javascript).toContain("boxDiv.style.top = 20 + 'px';");
  expect(javascript).toContain("boxDiv.style.width = 100 - 10 + 'px';");
  expect(javascript).toContain("boxDiv.style.height = 200 - 20 + 'px';");
});
