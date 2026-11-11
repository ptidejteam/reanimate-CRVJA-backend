import { translate } from './helpers/translate.js';

// Loading a sprite bank, and the runtime code that draws its sprites.
// https://amospromanual.dev/05-09-memory-banks.html

test.each([
  ['without a bank number', 'Load "assets/icons.abk"', 'loadBank(\'"assets/icons.abk"\', 1);'],
  ['with a bank number', 'Load "assets/icons.abk", 2', 'loadBank(\'"assets/icons.abk"\', 2);'],
])('Load translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('Sprite draws the bank image on a canvas', async () => {
  const javascript = await translate('Sprite 1, 100, 200, 3');

  expect(javascript).toContain('renderSprite(1, 100, 200, 3);');
  expect(javascript).toContain("document.createElement('canvas')");
  expect(javascript).toContain('createImageData');
});

test('the bank colours use the shared Amiga colour converter', async () => {
  const javascript = await translate('Load "assets/icons.abk"');

  expect(javascript).toContain('function amiga12BitToHex');
  expect(javascript).toContain('colorPalette.push(amiga12BitToHex(color1));');
});
