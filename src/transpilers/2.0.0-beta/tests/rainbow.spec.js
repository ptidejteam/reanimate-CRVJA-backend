import transpile from '../transpiler.js';

// Rainbow and Set Rainbow are parsed but not translated yet. As in the AMOS manual, Rainbow
// takes 4 arguments and Set Rainbow 6 ("" for an unused colour).

test.each([
  'Rainbow 1,0,128,16',
  'Rainbow 1,0,128+M*12,16',
  'Set Rainbow 1,7+8,30,"","",""',
  'Set Rainbow 0,1,16,"(1,1,15)","",""',
])('%s parses', async (source) => {
  const { lexicalErrors, syntaxErrors } = await transpile(source);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
});

test.each([
  'Rainbow 1,0,128',
  'Rainbow 1,0,128,16,5',
  'Set Rainbow 1,7,30,"r"',
  'Set Rainbow 1,7,30,"r",,"b"',
])('%s is a syntax error', async (source) => {
  const { syntaxErrors } = await transpile(source);

  expect(syntaxErrors.errors.length).toBeGreaterThan(0);
});
