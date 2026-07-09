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

test('max_int_size', () => {
  const amosBasicCode = `
   XW=2147483648
  `;

  try {
    translate(amosBasicCode);
  } catch (error) {
    // Verify that the error message is as expected
    expect(error.message).toBe(
      `ERROR: Amos code line 2: Value for variable "XW" exceeds the allowed limit of 2,147,483,647.`,
    );
  }
});
