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

test('string assignments', async () => {
  const amosBasicCode = `
A$ = "Hello, World!"
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain("A$ = 'Hello, World!';");
});

test('string assignments and text', async () => {
  const amosBasicCode = `
A$ = "Hello, World!"
Text 10,10,A$
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain("A$ = 'Hello, World!';");
  // The new pattern uses getElementById + textEl, not a const textDivXY variable
  expect(normalizedJS).toContain('textEl.innerText = A$;');
});
