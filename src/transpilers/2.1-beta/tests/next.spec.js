import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Next closes the For loop', async () => {
  const normalizedJS = await translate('For I=1 To 3\nNext I');

  expect(normalizedJS).toContain('loop1: for (I = 1; I <= 3; I++) {}');
});
