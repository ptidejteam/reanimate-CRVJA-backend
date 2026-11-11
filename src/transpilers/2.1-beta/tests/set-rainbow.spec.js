import { syntaxErrors } from './helpers/translate.js';

// SET RAINBOW: parsed but not translated yet. As in the AMOS manual, it takes 6 values
// ("" for an unused colour). https://amospromanual.dev/06-03-screen-effects.html

test.each(['Set Rainbow 1,7+8,30,"","",""', 'Set Rainbow 0,1,16,"(1,1,15)","",""'])(
  '%s parses',
  async (amos) => {
    expect(await syntaxErrors(amos)).toEqual([]);
  },
);

test.each(['Set Rainbow 1,7,30,"r"', 'Set Rainbow 1,7,30,"r",,"b"'])(
  '%s is a syntax error',
  async (amos) => {
    expect(await syntaxErrors(amos)).not.toEqual([]);
  },
);
