import { translate } from './helpers/translate.js';

// TEXT: writes text at a position on the screen. https://amospromanual.dev/11-01-fonts.html

test('Text writes at x, y in the current Ink and Paper', async () => {
  const javascript = await translate('Text 10,10,"Hello, World!"');

  expect(javascript).toContain("const textId = 'textDiv_' + 10 + '_' + 10;");
  expect(javascript).toContain('let textEl = document.getElementById(textId);');
  expect(javascript).toContain("textEl = document.createElement('div');");
  expect(javascript).toContain('textEl.id = textId;');
  expect(javascript).toContain("textEl.style.position = 'absolute';");
  expect(javascript).toContain("textEl.style.left = '10px';");
  expect(javascript).toContain("textEl.style.top = '10px';");
  expect(javascript).toContain("textEl.style.fontSize = '14px';");
  expect(javascript).toContain('textEl.style.zIndex = 99;');
  expect(javascript).toContain("document.getElementById('amos-screen').appendChild(textEl);");
  expect(javascript).toContain("textEl.innerText = 'Hello, World!';");
  expect(javascript).toContain('textEl.style.color = getColour(Ink);');
  expect(javascript).toContain('textEl.style.backgroundColor = getColour(Paper);');
});

// Both branches find the text element by its id, so the Else branch does not refer to a
// variable declared in the If branch.
test('Text inside If and Else', async () => {
  const javascript = await translate(`
    Screen Open 1,500,500,8,Hires
    If 2 < 1
      Text 10,10,"True"
    Else
      Text 10,10,"False"
    End If
  `);

  expect(javascript).toContain("'True'");
  expect(javascript).toContain("'False'");
  expect(javascript).toContain('document.getElementById(textId)');
  expect(javascript).not.toContain('const textDiv');
});
