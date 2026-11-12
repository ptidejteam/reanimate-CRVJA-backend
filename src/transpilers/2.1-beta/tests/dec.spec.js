import { translate } from './helpers/translate.js';

// DEC: subtracts 1 from a whole number variable. https://amospromanual.dev/05-03-maths.html

test.each([['a variable', 'Dec X', 'X = X - 1']])(
  'Dec translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
