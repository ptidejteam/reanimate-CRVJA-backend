import { translate } from './helpers/translate.js';

// REM: a comment, ignored when the program runs. A line starting with ' is a comment too.
// https://amospromanual.dev/05-01-the-bare-bones.html

test.each([
  ['Rem', 'Rem A comment\nX=1', 'A comment'],
  ["'", "' Another comment\nX=1", 'Another comment'],
])('a comment with %s is not translated', async (name, amos, comment) => {
  const javascript = await translate(amos);

  expect(javascript).toContain('X = 1;');
  expect(javascript).not.toContain(comment);
});
