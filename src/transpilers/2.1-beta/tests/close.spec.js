import { translate } from './helpers/translate.js';

// CLOSE: closes a file channel. https://amospromanual.dev/10-02-disc-access.html

test.each([['a channel', 'Close 1', 'closeChannel(1);']])(
  'Close translates %s',
  async (name, amos, javascript) => {
    expect(await translate(amos)).toContain(javascript);
  },
);
