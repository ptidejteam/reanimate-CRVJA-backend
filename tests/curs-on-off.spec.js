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

test('curs_on', async () => {
  const amosBasicCode = `
    Curs On
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(`document.getElementById('amos-screen').style.cursor = 'auto';`);
});

test('curs_off', async () => {
  const amosBasicCode = `
    Curs Off
    `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(`document.getElementById('amos-screen').style.cursor = 'none';`);
});
