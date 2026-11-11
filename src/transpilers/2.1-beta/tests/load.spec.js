import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Load without a bank number loads into bank 1', async () => {
  const normalizedJS = await translate('Load "assets/icons.abk"');

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 1);');
});

test('Load with a bank number', async () => {
  const normalizedJS = await translate('Load "assets/icons.abk", 2');

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 2);');
});
