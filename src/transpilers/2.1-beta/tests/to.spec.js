import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test.each([
  ['counts up to the upper bound', 'For I=1 To 10\nNext I', 'for (I = 1; I <= 10; I++) {'],
  [
    'counts down to the lower bound',
    'For I=10 To 1 Step -2\nNext I',
    'for (I = 10; I >= 1; I += -2) {',
  ],
])('To %s', async (_name, source, expected) => {
  expect(await translate(source)).toContain(expected);
});
