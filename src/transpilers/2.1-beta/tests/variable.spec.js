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

test('create a local variable', async () => {
  const amosCode = `
    Procedure P_MYPROC
      LOCALVAR = 5
    End Proc
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let LOCALVAR = 0; LOCALVAR = 5;');
});

test('create a global variable', async () => {
  const amosCode = `
    Global MY_GLOBAL_VAR
    MY_GLOBAL_VAR = 10
    Procedure P_MYPROC  
      MY_GLOBAL_VAR = 20
    End Proc
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('MY_GLOBAL_VAR = 10;');
  expect(normalizedJS).toContain('MY_GLOBAL_VAR = 20;');
  expect(normalizedJS).not.toContain('let MY_GLOBAL_VAR');
});

test('attribute a value to a variable (number)', async () => {
  const amosCode = `
    V1 = 123
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('V1 = 123;');
});

test('attribute a value to a variable (expression)', async () => {
  const amosCode = `
    V1 = 123 + 456
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('V1 = 123 + 456;');
});

test('attribute a value to a variable (another variable)', async () => {
  const amosCode = `
    V1 = 10
    V2 = V1
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('let V2 = 0;');
  expect(normalizedJS).toContain('V1 = 10;');
  expect(normalizedJS).toContain('V2 = V1;');
});

test('attribute a value to a variable (another variable + expression)', async () => {
  const amosCode = `
    V1 = 10
    V2 = V1 + 5
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('let V2 = 0;');
  expect(normalizedJS).toContain('V1 = 10;');
  expect(normalizedJS).toContain('V2 = V1 + 5;');
});

// NOT IMPLEMENTED YET
// test("attribute a value to a string variable (string literal)", () => {
//   const amosCode = `
//     V$ = "hello"
//   `;
//   const normalizedJS = translate(amosCode);
//   expect(normalizedJS).toContain('let V$ = "";');
//   expect(normalizedJS).toContain('V$ = "hello";');
// });

// An integer variable (no $ or #) stores a fraction truncated toward zero. Checked on the AMOS
// Professional Web Engine (https://creepycat.fr/amos/) in direct mode.
describe('integer variables truncate toward zero', () => {
  test.each([
    ['a decimal number', 'X=3.7', 'X = Math.trunc(3.7);'],
    ['a division', 'A=7/2', 'A = Math.trunc(7 / 2);'],
    ['a real function', 'D=Cos(1)', 'D = Math.trunc(Math.cos(1));'],
    ['a float variable', 'X#=1.5\nY=X#+1', 'Y = Math.trunc(X_f + 1);'],
  ])('translation of %s', async (_name, source, expected) => {
    expect(await translate(source)).toContain(expected);
  });

  test.each([
    ['a whole number', 'X=3', 'X = 3;'],
    ['Rnd of a real value', 'X=Rnd(Sin(1))', 'X = Math.floor(Math.random() * (Math.sin(1) + 1));'],
    ['a float variable', 'X#=3.7', 'X_f = 3.7;'],
  ])('no truncation needed for %s', async (_name, source, expected) => {
    expect(await translate(source)).toContain(expected);
  });

  test('runtime', async () => {
    const values = await run(
      'X=3.7\nY=-3.7\nZ=3.5\nW=-3.5\nA=7/2\nB=-7/2\nC#=7/2\nD=Cos(1)\nE=2.5\nF=-2.5\nG=0.99',
      ['X', 'Y', 'Z', 'W', 'A', 'B', 'C_f', 'D', 'E', 'F', 'G'],
    );

    expect(values).toEqual({
      X: 3,
      Y: -3,
      Z: 3,
      W: -3,
      A: 3,
      B: -3,
      C_f: 3.5,
      D: 0,
      E: 2,
      F: -2,
      G: 0,
    });
  });
});
