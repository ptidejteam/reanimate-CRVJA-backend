import fs from 'fs';
import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpile(code);

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
