import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['Not False', 'X = Not False', 'X = ~0;'],
  ['Not True', 'X = Not True', 'X = ~-1;'],
  ['Not a variable', 'X = Not Y', 'X = ~Y;'],
  ['Not a number', 'X = Not 1', 'X = ~1;'],
  ['an operation after it', 'X = Not Y + 1', 'X = ~Y + 1;'],
  ['Not twice', 'X = Not Not Y', 'X = ~~Y;'],
  ['a negative number', 'X = Not -1', 'X = ~-1;'],
  ['a negative variable', 'X = Not -Y', 'X = ~-Y;'],
  ['a negative variable and an operation after it', 'X = Not -Y + 1', 'X = ~-Y + 1;'],
  ['Not of minus True', 'X = Not -True', 'X = ~-(-1);'],
])('transpiles test case: %s', async (_name, input, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } =
    await new AMOSTranspiler().transpile(input);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

