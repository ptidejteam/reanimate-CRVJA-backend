import { translate } from './helpers/translate.js';

// PRINT: writes values on the screen. https://amospromanual.dev/05-06-text.html

test.each([
  ['a string', 'Print "Hello"', "printEl.innerText = 'Hello';"],
  ['a variable', 'Print X', 'printEl.innerText = X;'],
  ['in the Ink colour', 'Print X', 'printEl.style.color = getColour(Ink);'],
])('Print translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('Print with several values writes each one', async () => {
  const javascript = await translate('Print "A";B');

  expect(javascript).toContain("printEl.innerText = 'A';");
  expect(javascript).toContain('printEl.innerText = B;');
});
