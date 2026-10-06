import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

async function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = await transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('load_banks without bank id', async () => {
  const amosBasicCode = `
    Load "assets/icons.abk"
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 1);');
});

test('load_banks with bank id', async () => {
  const amosBasicCode = `Load "assets/icons.abk", 2`;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 2);');
});

test('render sprite translates to renderSprite with canvas runtime', async () => {
  const amosBasicCode = `Sprite 1, 100, 200, 3`;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('renderSprite(1, 100, 200, 3);');
  expect(normalizedJS).toContain("document.createElement('canvas')");
  expect(normalizedJS).toContain('createImageData');
});

test('generated runtime uses the shared Amiga color converter', async () => {
  const normalizedJS = await translate('Load "assets/icons.abk"');

  expect(normalizedJS).toContain('function amiga12BitToHex');
  expect(normalizedJS).toContain('colorPalette.push(amiga12BitToHex(color1));');
});
