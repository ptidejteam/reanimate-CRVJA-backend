import AMOSTranspiler from '../amos-transpiler.js';

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

// An integer variable (no $ or #) stores a fraction truncated toward zero. Checked on creepycat:
// X=3.7 gives 3, X=-3.7 gives -3, A=7/2 gives 3 and D=Cos(1) gives 0, while C#=7/2 keeps 3.5.
test.each([
  ['a decimal number', 'X=3.7', 'X = Math.trunc(3.7);'],
  ['a negative decimal number', 'Y=-3.7', 'Y = Math.trunc(-3.7);'],
  ['a division', 'A=7/2', 'A = Math.trunc(7 / 2);'],
  ['a real function', 'D=Cos(1)', 'D = Math.trunc(Math.cos(1));'],
  ['a float variable', 'X#=1.5\nY=X#+1', 'Y = Math.trunc(X_f + 1);'],
  ['a whole number (no truncation needed)', 'X=3', 'X = 3;'],
  [
    'Rnd, which is always whole',
    'X=Rnd(Sin(1))',
    'X = Math.floor(Math.random() * (Math.sin(1) + 1));',
  ],
  ['a division into a float variable', 'C#=7/2', 'C_f = 7 / 2;'],
  ['a decimal number into a float variable', 'X#=3.7', 'X_f = 3.7;'],
])('an integer variable stores %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
