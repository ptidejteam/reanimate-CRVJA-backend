import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = await new AMOSTranspiler().transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('Text', async () => {
  const amosBasicCode = `
        Wait Key
    `;

  const normalizedJS = await translate(amosBasicCode);

  const expectedJsCode = `await new Promise((r) =>
  (s = document).addEventListener(
    (t = 'keydown'),
    (u = () => {
      s.removeEventListener(t, u);
      r();
    }),
  ),
);`;

  const normalizedExpectedJsCode = expectedJsCode.replace(/\s+/g, ' ').trim();
  expect(normalizedJS).toContain(normalizedExpectedJsCode);
});
