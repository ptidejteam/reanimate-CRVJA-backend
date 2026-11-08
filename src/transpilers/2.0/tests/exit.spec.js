import AMOSTranspiler from '../amos-transpiler.js';

// EXIT / EXIT IF leave the n innermost loops. Asking for more loops than are open is the
// AMOS program error "Not enough loops to exit":
// https://amospromanual.dev/12-03-amos-errors.html
const NOT_ENOUGH_LOOPS = 'Not enough loops to exit';

async function transpile(code) {
  return new AMOSTranspiler().transpile(code);
}

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(code);
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  return translatedCode.replace(/\s+/g, ' ').trim();
}

test.each([
  ['Exit outside any loop', 'X=1\nExit', 2, 0],
  ['Exit If outside any loop', 'X=1\nExit If X=1', 2, 0],
  ['Exit 2 with one loop open', 'Do\n   Exit 2\nLoop', 2, 3],
  [
    'Exit If with a count above the open loops',
    'For I=1 To 3\nDo\nExit If I=2,3\nLoop\nNext I',
    3,
    0,
  ],
])('reports %s as "Not enough loops to exit"', async (_name, source, line, column) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(source);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([{ line, column, msg: NOT_ENOUGH_LOOPS }]);
  expect(translatedCode).toBe('');
});

test('reports every out-of-range Exit, at its own line', async () => {
  const { syntaxErrors } = await transpile('Exit\nDo\nExit 1\nExit 2\nLoop\nExit If 1=1');
  expect(syntaxErrors.errors).toEqual([
    { line: 1, column: 0, msg: NOT_ENOUGH_LOOPS },
    { line: 4, column: 0, msg: NOT_ENOUGH_LOOPS },
    { line: 6, column: 0, msg: NOT_ENOUGH_LOOPS },
  ]);
});

test('positions the error on the AMOS line with CR LF line endings', async () => {
  const { syntaxErrors } = await transpile('X=1\r\nY=2\r\nExit');
  expect(syntaxErrors.errors).toEqual([{ line: 3, column: 0, msg: NOT_ENOUGH_LOOPS }]);
});

test('accepts a count equal to the open loops', async () => {
  const normalizedJS = await translate('Do\nWhile 1=1\nFor I=1 To 2\nExit 3\nNext I\nWend\nLoop');
  expect(normalizedJS).toContain('loop3: for (I = 1; I <= 2; I++) { break loop1; }');
});

test('loops around a Procedure are not open inside it', async () => {
  const { syntaxErrors } = await transpile('Do\nProcedure P\nExit\nEnd Proc\nExit\nLoop');
  expect(syntaxErrors.errors).toEqual([{ line: 3, column: 0, msg: NOT_ENOUGH_LOOPS }]);
});

test('a Procedure counts its own loops and restores the depth after End Proc', async () => {
  const normalizedJS = await translate(
    'Procedure P\nFor I=1 To 3\nExit If I=2\nNext I\nEnd Proc\nDo\nExit\nLoop',
  );
  expect(normalizedJS).toContain('loop1: for (I = 1; I <= 3; I++) { if (I == 2) { break loop1; }');
  expect(normalizedJS).toContain('loop1: while (true) { break loop1;');
});
