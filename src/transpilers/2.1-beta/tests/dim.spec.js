import { translate } from './helpers/translate.js';

// DIM: creates an array; each size includes its upper bound, so Dim C(1) has 2 elements.
// https://amospromanual.dev/05-01-the-bare-bones.html

test.each([
  ['a 1D array', 'Dim C(1)', 'const C = Array.from({ length: 1 + 1 }, () => 0);'],
  [
    'a 2D array',
    'Dim S(2,2)',
    'const S = Array.from({ length: 2 + 1 }, () => Array.from({ length: 2 + 1 }, () => 0), );',
  ],
])('Dim translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
