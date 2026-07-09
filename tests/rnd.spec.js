import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('generate a random number', () => {
  const amosCode = `
    RND_VAR = Rnd(10)
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let RND_VAR = 0;');
  expect(normalizedJS).toContain('RND_VAR = Rnd(10);');
});
