import { translate } from './helpers/translate.js';

// BAR: draws a filled rectangle in the Ink colour. https://amospromanual.dev/06-04-graphics.html

test('Bar fills the rectangle from x1, y1 to x2, y2', async () => {
  const javascript = await translate('Bar 10,20 To 100,200');

  expect(javascript).toContain('const x1 = 10;');
  expect(javascript).toContain('const y1 = 20;');
  expect(javascript).toContain('const x2 = 100;');
  expect(javascript).toContain('const y2 = 200;');
  expect(javascript).toContain('screenBarDiv.style.backgroundColor = getColour(Ink);');
  expect(javascript).toContain("screenBarDiv.style.width = width + 'px';");
  expect(javascript).toContain("screenBarDiv.style.height = height + 'px';");
});
