import { translate } from './helpers/translate.js';

// RANDOMIZE: sets the starting point of Rnd. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a number', 'Randomize 42', 'Randomize(42);'],
  ['Timer', 'Randomize Timer', 'Randomize(getTimer());'],
  ['a variable', 'Randomize A', 'Randomize(A);'],
  ['an expression', 'Randomize A + 1', 'Randomize(A + 1);'],
])('Randomize translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
