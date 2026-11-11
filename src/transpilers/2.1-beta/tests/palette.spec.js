import { translate } from './helpers/translate.js';

// PALETTE: sets the colours of the screen, as $RGB values.
// https://amospromanual.dev/06-04-graphics.html

test('Palette converts each $RGB colour', async () => {
  const javascript = await translate('Palette $000,$F80,$FFF');

  expect(javascript).toContain('rgb(0, 0, 0)');
  expect(javascript).toContain('rgb(255, 136, 0)');
  expect(javascript).toContain('rgb(255, 255, 255)');
});
