import { translate } from './helpers/translate.js';

// SWAP: exchanges the values of two variables. https://amospromanual.dev/05-04-control-structures.html

test.each([['two variables', 'Swap A,B', '[A, B] = [B, A];']])(
  'Swap translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
