import { translate } from './helpers/translate.js';

// END IF: the end of an If block. https://amospromanual.dev/05-04-control-structures.html

test.each([
  [
    'the end of an If',
    'If 1 > 0\nCurs Off\nEnd If',
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; }",
  ],
])('End If translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
