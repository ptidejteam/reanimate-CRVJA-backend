import { translate } from './helpers/translate.js';

// SCREEN OPEN: opens a screen with a width, height, colours and resolution.
// https://amospromanual.dev/06-01-setting-up-screens.html

test('Screen Open creates the screen', async () => {
  const javascript = await translate('Screen Open 1,600,400,8,Hires');

  expect(javascript).toContain("const screenDiv = document.createElement('div');");
  expect(javascript).toContain("screenDiv.style.width = '600px';");
  expect(javascript).toContain("screenDiv.style.height = '400px';");
  expect(javascript).toContain("screenDiv.style.border = '1px solid black';");
  expect(javascript).toContain("screenDiv.style.overflow = 'hidden';");
  expect(javascript).toContain("screenDiv.style.padding = '0';");
  expect(javascript).toContain("screenDiv.style.position = 'relative';");
  expect(javascript).toContain("screenDiv.id = 'amos-screen';");
  expect(javascript).toContain('screenDiv.style.zIndex = 1;');
  expect(javascript).toContain("document.getElementById('game-container').appendChild(screenDiv);");
  expect(javascript).toContain(
    "document.getElementById('amos-screen').style.backgroundColor = 'black';",
  );
});
