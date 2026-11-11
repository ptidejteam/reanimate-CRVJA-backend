import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Read translation', async () => {
  const normalizedJS = await translate('Data 1,"A",2.5\nRead X,A$,B#');

  expect(normalizedJS).toContain('X = Math.trunc(dataMatrix[dataMatrixPointer++]);');
  expect(normalizedJS).toContain('A$ = dataMatrix[dataMatrixPointer++];');
  expect(normalizedJS).toContain('B_f = dataMatrix[dataMatrixPointer++];');
});

test('Read runtime: reads the Data values in order', async () => {
  const values = await run('Data 1,"A",2.5\nRead X,A$,B#', ['X', 'A$', 'B_f']);

  expect(values).toEqual({ X: 1, A$: 'A', B_f: 2.5 });
});

// An integer variable or array element truncates toward zero. Checked on the AMOS Professional
// Web Engine (https://creepycat.fr/amos/): Data 3.7,-3.7,2.5 : Read X,Y,K(1) prints 3 -3 2.
test('Read runtime: integer targets truncate toward zero', async () => {
  const { X, Y, K } = await run('Data 3.7,-3.7,2.5\nRead X,Y\nDim K(2)\nRead K(1)', [
    'X',
    'Y',
    'K',
  ]);

  expect([X, Y, K[1]]).toEqual([3, -3, 2]);
});
