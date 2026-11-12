import { translate } from './helpers/translate.js';
import { evaluate } from './helpers/evaluate.js';

// PI#: the number pi. https://amospromanual.dev/05-03-maths.html

test.each([['pi', 'X# = Pi#', 'X_f = Math.PI;']])(
  'Pi# translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);

test.each([['Pi#', 3.141592653589793]])('%s returns %p', async (amos, value) => {
  expect(await evaluate(amos)).toBe(value);
});
