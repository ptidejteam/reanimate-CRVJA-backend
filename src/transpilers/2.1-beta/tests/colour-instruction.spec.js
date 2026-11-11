import { translate } from './helpers/translate.js';

// COLOUR (instruction): sets a colour index to a $RGB value.
// https://amospromanual.dev/06-04-graphics.html

test.each([['a hex colour', 'Colour 1, $ABC', 'colorMapping[1] = amiga12BitToCssRgb(2748);']])(
  'Colour translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
