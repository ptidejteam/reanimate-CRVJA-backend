import { translate } from './helpers/translate.js';

// ADD: adds a value to a whole number variable. With Base To Top it works like
// V=V+A : If V<BASE Then V=TOP : If V>TOP Then V=BASE, with Base and Top read once. https://amospromanual.dev/05-03-maths.html

test.each([
  ['a number', 'Add X,2', 'X = X + 2;'],
  ['an expression', 'Add X,Y*2', 'X = X + Y * 2;'],
  [
    'a range (manual example)',
    'Add V,1,1 To 10',
    '{ const addBase = 1; const addTop = 10; V = V + 1; if (V < addBase) { V = addTop; } if (V > addTop) { V = addBase; } }',
  ],
])('Add translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
