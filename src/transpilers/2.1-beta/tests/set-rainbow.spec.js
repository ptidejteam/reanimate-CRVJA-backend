import AMOSTranspiler from '../amos-transpiler.js';

// Set Rainbow is parsed but not translated yet. As in the AMOS manual, it takes 6 arguments
// ("" for an unused colour).

test.each(['Set Rainbow 1,7+8,30,"","",""', 'Set Rainbow 0,1,16,"(1,1,15)","",""'])(
  '%s parses',
  async (source) => {
    const { lexicalErrors, syntaxErrors } = await new AMOSTranspiler().transpile(source);

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors).toEqual([]);
  },
);

test.each(['Set Rainbow 1,7,30,"r"', 'Set Rainbow 1,7,30,"r",,"b"'])(
  '%s is a syntax error',
  async (source) => {
    const { syntaxErrors } = await new AMOSTranspiler().transpile(source);

    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
  },
);
