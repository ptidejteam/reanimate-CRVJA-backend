import { translate } from './helpers/translate.js';

// OR: at least one condition must be true. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['two comparisons', 'If 1>0 or 2>1\nEnd If', 'if (1 > 0 || 2 > 1) { }'],
  ['any letter case', 'If 1>0 OR 2>1\nEnd If', 'if (1 > 0 || 2 > 1) { }'],
  ['after And', 'If 1>0 or 2>1 and 3>2\nEnd If', 'if (1 > 0 || (2 > 1 && 3 > 2)) { }'],
])('Or translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
