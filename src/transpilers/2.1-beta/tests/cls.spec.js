import { translate } from './helpers/translate.js';

// CLS: clears the screen, optionally with a colour or only inside a block.
// https://amospromanual.dev/06-01-setting-up-screens.html

test('Cls clears the screen', async () => {
  const javascript = await translate('Cls');

  expect(javascript).toContain("const amosScreen = document.getElementById('amos-screen');");
  expect(javascript).toContain("amosScreen.innerHTML = '';");
});

test('Cls with a colour clears the screen to that colour', async () => {
  const javascript = await translate('Cls 2');

  expect(javascript).toContain("const amosScreen = document.getElementById('amos-screen');");
  expect(javascript).toContain("amosScreen.innerHTML = '';");
  expect(javascript).toContain('amosScreen.style.backgroundColor = colorMapping[2];');
});

test('Cls with a block clears only that block', async () => {
  const javascript = await translate('Cls 2,10,20 To 100,200');

  expect(javascript).toContain('const clearColor = colorMapping[2];');
  expect(javascript).toContain('const clearX1 = 10;');
  expect(javascript).toContain('const clearY1 = 20;');
  expect(javascript).toContain('const clearX2 = 100;');
  expect(javascript).toContain('const clearY2 = 200;');
  expect(javascript).toContain('fillDiv.style.backgroundColor = clearColor;');
});
