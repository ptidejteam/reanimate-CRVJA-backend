import { translate } from './helpers/translate.js';

// WAIT KEY: waits until a key is pressed. https://amospromanual.dev/10-01-using-the-keyboard.html

test('Wait Key waits for one keydown', async () => {
  const javascript = await translate('Wait Key');

  expect(javascript).toContain(
    "await new Promise((resolve) => { document.addEventListener('keydown', resolve, { once: true }); });",
  );
});
