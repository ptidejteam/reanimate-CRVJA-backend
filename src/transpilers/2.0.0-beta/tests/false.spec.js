import AMOSTranspiler from "../amos-transpiler"


test.each([
  ['an assignment', 'X = False', 'X = 0'],
  ['an operation on the result', 'X = False + 1', 'X = 0 + 1'],
  ['an operation on the result', 'X = 1 + Abs(False)', 'X = 1 + Math.abs(0)'],
])('transpiles test case: %s', async (_name, input, expected) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = 
        await new AMOSTranspiler().transpile(input);

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors).toEqual([]);
    expect(translatedCode).toContain(expected);
},
);
