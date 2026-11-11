import { translate } from './helpers/translate.js';

// CURS ON / CURS OFF: shows or hides the cursor. https://amospromanual.dev/05-06-text.html

test.each([
  ['Curs On', 'Curs On', "document.getElementById('amos-screen').style.cursor = 'auto';"],
  ['Curs Off', 'Curs Off', "document.getElementById('amos-screen').style.cursor = 'none';"],
])('%s translates', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
