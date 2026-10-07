import AMOSTranspiler from '../AMOSTranspiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return {
    translatedCode,
    normalizedJS: translatedCode.replace(/\s+/g, ' ').trim(),
  };
}

describe('float variables (A#) and decimal numbers (3.14)', () => {
  test.each([
    ['a decimal number', 'A#=3.14', 'A_f = 3.14;'],
    ['a float variable in an expression', 'A#=1\nB=A#+0.5', 'B = A_f + 0.5;'],
    ['a float array', 'Dim PRICE#(5)\nPRICE#(0)=12.99', 'PRICE_f[Math.trunc(0)] = 12.99;'],
    ['a function result', 'A#=Cos(45)', 'A_f = Math.cos(45);'],
    ['Print # with a float variable', 'A#=1\nPrint #1,A#', 'writeToChannel(1, A_f);'],
  ])('renames A# to A_f: %s', async (_name, source, expected) => {
    const { normalizedJS, translatedCode } = await translate(source);

    expect(normalizedJS).toContain(expected);
    expect(() => new Function(translatedCode)).not.toThrow();
  });

  test('declares a float variable with the default value 0', async () => {
    const { normalizedJS } = await translate('A#=3.14');

    expect(normalizedJS).toContain('let A_f = 0;');
  });

  // Examples from the AMOS manual
  test.each([
    'p#=Pi#',
    'A#=Ln(100)',
    'A#=Log(100)',
    'exponential#=Exp(value#)',
    'square#=Sqr(number#)',
    'Def Fn X#(A#)=A#*2',
    'REAL_NUMBER#=3.14',
    'A#=Cos(45) : Print Acos(A#)',
    'a#=Asin(number#)',
    'h#=Hsin(angle#)',
    'Swap a#,b#',
    'Sort a#(0)',
    'Print Sqr(11.1111)',
    'Print Atan(0.03492082)',
  ])('%j parses', async (source) => {
    await translate(source);
  });
});
