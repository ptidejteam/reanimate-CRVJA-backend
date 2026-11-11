import { translate, syntaxErrors } from './helpers/translate.js';

// PLAY: plays a note for a number of seconds. https://amospromanual.dev/08-01-music.html

test.each([
  ['a number', 'Play 40,2', 'soundPlayer(40, 2 * 1000);'],
  ['a variable', 'Play X,2', 'soundPlayer(X, 2 * 1000);'],
  ['an expression', 'Play X + 1,2', 'soundPlayer(X + 1, 2 * 1000);'],
])('Play translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

// Not AMOS syntax: it used to parse, then crash the transpiler with invalid JavaScript.
test.each(['Play $10 5,2'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
