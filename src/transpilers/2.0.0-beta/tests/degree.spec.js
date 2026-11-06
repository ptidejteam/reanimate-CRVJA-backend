import AMOSTranspiler from '../amos-transpiler.js';

test.each([
  ['sin', 'Degree\nX# = Sin(90)', 'X_f = Math.sin((90 * Math.PI) / 180);'],
  ['cos', 'Degree\nX# = Cos(Y)', 'X_f = Math.cos((Y * Math.PI) / 180);'],
  ['asin', 'Degree\nX# = Asin(0.5)', 'X_f = (Math.asin(0.5) * 180) / Math.PI;'],
  ['acos', 'Degree\nX# = Acos(0.5)', 'X_f = (Math.acos(0.5) * 180) / Math.PI;'],
  ['atan', 'Degree\nX# = Atan(1)', 'X_f = (Math.atan(1) * 180) / Math.PI;'],
])('%s uses degrees after Degree', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});