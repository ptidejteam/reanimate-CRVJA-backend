import { translate } from './helpers/translate.js';

// INC: adds 1 to a whole number variable. https://amospromanual.dev/05-03-maths.html

test.each([['a variable', 'Inc X', 'X = X + 1']])(
  'Inc translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
