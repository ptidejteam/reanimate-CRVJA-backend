import { translate } from './helpers/translate.js';

// NEXT: the end of a For loop. https://amospromanual.dev/05-04-control-structures.html

test.each([['the end of a For', 'For I=1 To 3\nNext I', 'loop1: for (I = 1; I <= 3; I++) {}']])(
  'Next translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
