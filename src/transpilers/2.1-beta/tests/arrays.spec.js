import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

async function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = await new AMOSTranspiler().transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

async function runAmos(code, ...names) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  // Minimal stand-in for the browser APIs
  const fakeDocument = {
    addEventListener() {},
    getElementById() {
      return null;
    },
  };

  return new Function('document', `${translatedCode}\nreturn { ${names.join(', ')} };`)(
    fakeDocument,
  );
}

test('1D arrays creation, update and global reference', async () => {
  const amosBasicCode = `
    Dim C(1)
    Global C(1)
    C(0) = 10
  `;

  const normalizedJS = await translate(amosBasicCode);

  // Dim C(1) -> 2 slots (indices 0..1)
  expect(normalizedJS).toContain(
    'const C = Array.from({ length: 1 + 1 }, () => 0); C[Math.trunc(0)] = 10;',
  );
});

test('2D arrays creation, update and global reference', async () => {
  const amosBasicCode = `
  Dim S(2,2)
  Global S(2)
  S(1,0) = 20
  TEMP = S(1,0)
  Text 100,100,TEMP
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(
    'const S = Array.from({ length: 2 + 1 }, () => Array.from({ length: 2 + 1 }, () => 0), );',
  );
  expect(normalizedJS).toContain('S[Math.trunc(1)][Math.trunc(0)] = 20;');
});

test('DIM is inclusive of the upper bound', async () => {
  const { C } = await runAmos(`Dim C(1)`, 'C');
  expect(C).toEqual([0, 0]);
});

test('DIM fills string arrays with empty strings', async () => {
  const { B$ } = await runAmos(`Dim B$(2)`, 'B$');
  expect(B$).toEqual(['', '', '']);
});

test('DIM creates independent rows in 2D arrays', async () => {
  const { A } = await runAmos(`Dim A(2,1)\nA(0,1) = 5`, 'A');
  expect(A).toEqual([
    [0, 5],
    [0, 0],
    [0, 0],
  ]);
});

// As with variables, an integer array stores a fraction truncated toward zero, while a float
// array keeps it. Checked on the AMOS Professional Web Engine (https://creepycat.fr/amos/).
test('integer array elements truncate toward zero', async () => {
  const source = 'Dim K(2)\nK(1)=-3.7\nDim R#(2)\nR#(1)=-3.7';

  const normalizedJS = await translate(source);
  expect(normalizedJS).toContain('K[Math.trunc(1)] = Math.trunc(-3.7);');
  expect(normalizedJS).toContain('R_f[Math.trunc(1)] = -3.7;');

  const { K, R_f } = await run(source, ['K', 'R_f']);
  expect(K[1]).toBe(-3);
  expect(R_f[1]).toBe(-3.7);
});
