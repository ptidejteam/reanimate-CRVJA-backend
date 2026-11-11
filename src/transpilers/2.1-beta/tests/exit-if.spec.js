import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Exit If leaves the loop when the condition holds', async () => {
  const normalizedJS = await translate('Do\nExit If X=1\nLoop');

  expect(normalizedJS).toContain('loop1: while (true) { if (X == 1) { break loop1; }');
});
