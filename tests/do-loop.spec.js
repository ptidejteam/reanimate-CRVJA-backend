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

test('do_loop', async () => {
  const amosBasicCode = `
  Do 

  Loop 
    `;

  const normalizedJS = await translate(amosBasicCode);

  // Assert against current translator output containing loop guard and setInterval
  expect(normalizedJS).toContain('while (true) { await new Promise((r) => setTimeout(r, 16)); }');
});
