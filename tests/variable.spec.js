import transpileAmosToJS_v2_0_0 from '#root/src/transpilers/transpiler_v2_0_0/transpileAmosToJS_v2_0_0.js';

function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpileAmosToJS_v2_0_0(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('create a local variable', () => {
  const amosCode = `
    Procedure P_MYPROC
      LOCALVAR = 5
    End Proc
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let LOCALVAR = 0;LOCALVAR = 5;');
});

test('create a global variable', () => {
  const amosCode = `
    Global TEMP_GLOBAL_VAR
    TEMP_GLOBAL_VAR = 10
    Procedure P_MYPROC  
      TEMP_GLOBAL_VAR = 20
    End Proc
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('TEMP_GLOBAL_VAR = 10;');
  expect(normalizedJS).toContain('TEMP_GLOBAL_VAR = 20;');
  expect(normalizedJS).not.toContain('let TEMP_GLOBAL_VAR');
});

test('attribute a value to a variable (number)', () => {
  const amosCode = `
    V1 = 123
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('V1 = 123;');
});

test('attribute a value to a variable (expression)', () => {
  const amosCode = `
    V1 = 123 + 456
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('V1 = 123+456;');
});

test('attribute a value to a variable (another variable)', () => {
  const amosCode = `
    V1 = 10
    V2 = V1
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('let V2 = 0;');
  expect(normalizedJS).toContain('V1 = 10;');
  expect(normalizedJS).toContain('V2 = V1;');
});

test('attribute a value to a variable (another variable + expression)', () => {
  const amosCode = `
    V1 = 10
    V2 = V1 + 5
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('let V1 = 0;');
  expect(normalizedJS).toContain('let V2 = 0;');
  expect(normalizedJS).toContain('V1 = 10;');
  expect(normalizedJS).toContain('V2 = V1+5;');
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
