import { translate } from './helpers/translate.js';

// PRINT #: writes a value to an open file channel. https://amospromanual.dev/10-02-disc-access.html

test.each([['a variable', 'Print #1,X', 'writeToChannel(1, X);']])(
  'Print # translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
