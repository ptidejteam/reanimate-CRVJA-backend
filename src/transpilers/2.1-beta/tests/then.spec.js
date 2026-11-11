import { translate } from './helpers/translate.js';

// THEN: an If on one line. https://amospromanual.dev/05-04-control-structures.html

test.each([
  [
    'an instruction',
    'If 1 > 0 Then Curs Off',
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; }",
  ],
])('Then translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
