import { translate } from './helpers/translate.js';

// AND: both conditions must be true. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['two comparisons', 'If 1>0 and 2>1\nEnd If', 'if (1 > 0 && 2 > 1) { }'],
  ['any letter case', 'If 1>0 AND 2>1\nEnd If', 'if (1 > 0 && 2 > 1) { }'],
  ['in a While', 'While X<10 and Y<>2\nWend', 'while (X < 10 && Y != 2) {'],
])('And translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
