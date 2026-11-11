import { translate } from './helpers/translate.js';

// READ: reads the next Data values into variables. https://amospromanual.dev/05-01-the-bare-bones.html
// An integer variable stores the value truncated toward zero; checked on creepycat:
// Data 3.7,-3.7,2.5 : Read X,Y,K(1) gives 3, -3, 2.

test.each([
  ['an integer variable', 'Data 1\nRead X', 'X = Math.trunc(dataMatrix[dataMatrixPointer++]);'],
  ['a string variable', 'Data "A"\nRead A$', 'A$ = dataMatrix[dataMatrixPointer++];'],
  ['a float variable', 'Data 2.5\nRead B#', 'B_f = dataMatrix[dataMatrixPointer++];'],
  [
    'an integer array element',
    'Dim K(2)\nRead K(1)',
    'K[Math.trunc(1)] = Math.trunc(dataMatrix[dataMatrixPointer++]);',
  ],
  ['a new variable', 'Data 1\nRead X', 'let X = 0;'],
])('Read translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});
