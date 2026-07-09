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

test('string assignments', () => {
  const amosBasicCode = `
A$ = "Hello, World!"
  `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain('A$ = "Hello, World!";');
});

test('string assignments and text', () => {
  const amosBasicCode = `
A$ = "Hello, World!"
Text 10,10,A$
  `;

  const normalizedJS = translate(amosBasicCode);

  // Find the name of the div (the transpiler uses a random identifier)
  const match = normalizedJS.match(/const (textDiv1010[a-z0-9]+)/);
  if (!match) {
    throw new Error('Could not find generated variable name for textDiv1010');
  }
  const varName = match[1];

  expect(normalizedJS).toContain('A$ = "Hello, World!";');
  expect(normalizedJS).toContain(`${varName}.innerText = A$;`);
});
