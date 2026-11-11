import { translate } from './helpers/translate.js';

// PLOT: draws a point. https://amospromanual.dev/06-04-graphics.html

test('Plot draws a point at x, y', async () => {
  const javascript = await translate('Plot 10,20');

  expect(javascript).toContain("plotDiv.style.left = 10 + 'px';");
  expect(javascript).toContain("plotDiv.style.top = 20 + 'px';");
});
