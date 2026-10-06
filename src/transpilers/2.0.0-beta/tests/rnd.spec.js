import transpile from '../transpiler.js';

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

test('generate a random number', async () => {
  const amosCode = `
    RND_VAR = Rnd(10)
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let RND_VAR = 0;');
  expect(normalizedJS).toContain('RND_VAR = Math.floor(Math.random() * (10 + 1));');
});

test('generate a random number up to a variable', async () => {
  const amosCode = `
    RND_VAR = Rnd(MAX_VALUE)
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('RND_VAR = Math.floor(Math.random() * (MAX_VALUE + 1));');
});
