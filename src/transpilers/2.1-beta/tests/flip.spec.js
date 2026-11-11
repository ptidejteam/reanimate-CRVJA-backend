import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test('Flip$ reverses a string', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'RESULT$=Flip$("AbC")',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain("RESULT$ = 'AbC'.split('').reverse().join('');");
});

// Runtime: the translated program gives the AMOS result.
// Manual example: Print Flip$("SOMA gnippilf") (https://amospromanual.dev/05-02-string-functions.html)
test.each([
  ['RESULT$=Flip$("SOMA gnippilf")', 'RESULT$', 'flipping AMOS'],
  ['RESULT$=Flip$("AbC")', 'RESULT$', 'CbA'],
])('flip runtime: %s', async (source, name, expected) => {
  const values = await run(source, [name]);

  expect(values[name]).toBe(expected);
});
