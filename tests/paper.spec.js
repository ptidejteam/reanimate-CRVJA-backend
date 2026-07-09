import fs from 'fs';
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

test('paper number', () => {
  const amosCode = `
    Paper 2
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('Paper = 0;');
});

test('paper variable', () => {
  const amosCode = `
    TEMP = 2
    Paper TEMP
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('TEMP = 2;');
  expect(normalizedJS).toContain('Paper = TEMP;');
});

test('paper expression', () => {
  const amosCode = `
    Paper 1 + 1
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('Paper = 1+1');
});

test('paper variable and expression', () => {
  const amosCode = `
    TEMP = 2
    Paper TEMP + 1
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain('Paper = TEMP+1');
});
