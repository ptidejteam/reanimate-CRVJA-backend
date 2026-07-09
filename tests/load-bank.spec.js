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

test('load_banks without bank id', () => {
  const amosBasicCode = `
    Load "assets/icons.abk"
  `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 1);');
});

test('load_banks with bank id', () => {
  const amosBasicCode = `Load "assets/icons.abk", 2`;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain('loadBank(\'"assets/icons.abk"\', 2);');
});
