import { translate } from './helpers/translate.js';

// CIRCLE: draws a circle from its centre and radius. https://amospromanual.dev/06-04-graphics.html

test('Circle draws around the centre x, y with a radius', async () => {
  const javascript = await translate('Circle 100,100,50');

  expect(javascript).toContain("circleDiv.style.borderRadius = '50%';");
  expect(javascript).toContain("circleDiv.style.left = 100 - 50 + 'px';");
  expect(javascript).toContain("circleDiv.style.top = 100 - 50 + 'px';");
  expect(javascript).toContain("circleDiv.style.width = 50 * 2 + 'px';");
  expect(javascript).toContain("circleDiv.style.height = 50 * 2 + 'px';");
});
