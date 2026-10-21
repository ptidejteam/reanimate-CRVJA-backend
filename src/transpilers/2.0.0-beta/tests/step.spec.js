import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['a positive step', 'For I=1 To 10 Step 3\nNext I', 'for (I = 1; I <= 10; I += 3) {'],
  ['a negative step', 'For I=10 To 1 Step -2\nNext I', 'for (I = 10; I >= 1; I += -2) {'],
  ['a decimal step', 'For X#=0 To 1 Step 0.25\nNext X#', 'for (X_f = 0; X_f <= 1; X_f += 0.25) {'],
  [
    'a variable step',
    'For I=1 To 10 Step S\nNext I',
    'for (I = 1; S >= 0 ? I <= 10 : I >= 10; I += S) {',
  ],
  ['no step', 'For I=1 To 3\nNext I', 'for (I = 1; I <= 3; I++) {'],
])('for loop with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});