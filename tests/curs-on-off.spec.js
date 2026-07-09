import transpileAmosToJS_v2_0_0 from '#root/src/transpilers/transpiler_v2_0_0/transpileAmosToJS_v2_0_0.js';

function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpileAmosToJS_v2_0_0(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('curs_on', () => {
  const amosBasicCode = `
    Curs On
  `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(`document.getElementById('amos-screen').style.cursor = 'auto';`);
});

test('curs_off', () => {
  const amosBasicCode = `
    Curs Off
    `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(`document.getElementById('amos-screen').style.cursor = 'none';`);
});
