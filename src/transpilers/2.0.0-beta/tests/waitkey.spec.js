import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Wait Key adds a one-time keydown listener', async () => {
  const normalizedJS = await translate('Wait Key');

  expect(normalizedJS).toContain(
    "await new Promise((resolve) => { document.addEventListener('keydown', resolve, { once: true }); });",
  );
});
