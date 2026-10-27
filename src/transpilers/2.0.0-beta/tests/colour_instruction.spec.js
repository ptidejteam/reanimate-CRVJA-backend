import AMOSTranspiler from '../amos-transpiler.js';

test('Colour instruction', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'Colour 1, $ABC',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('colorMapping[1] = amiga12BitToCssRgb(2748);');
});
