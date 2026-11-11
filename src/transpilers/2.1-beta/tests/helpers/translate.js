import AMOSTranspiler from '../../amos-transpiler.js';

// Translates an AMOS program and returns its JavaScript, with every run of spaces and new lines
// turned into one space, so a test can look for a line of code with toContain:
//
//   expect(await translate('X = Abs(-3)')).toContain('X = Math.abs(-3);');
//
// The test fails if the program has a lexical or syntax error.
export async function translate(amos) {
  const result = await new AMOSTranspiler().transpile(amos);

  expect(result.lexicalErrors.errors).toEqual([]);
  expect(result.syntaxErrors.errors).toEqual([]);

  return result.translatedCode.replace(/\s+/g, ' ').trim();
}

// Returns the syntax errors of an AMOS program (an empty list when it is valid):
//
//   expect(await syntaxErrors('X = Abs()')).not.toEqual([]);
export async function syntaxErrors(amos) {
  const result = await new AMOSTranspiler().transpile(amos);

  return result.syntaxErrors.errors;
}
