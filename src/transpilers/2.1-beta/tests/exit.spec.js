import { translate, syntaxErrors } from './helpers/translate.js';

// EXIT: leaves the innermost loop, or n loops with Exit n.
// Asking for more loops than are open is the AMOS error "Not enough loops to exit".
// https://amospromanual.dev/05-04-control-structures.html and
// https://amospromanual.dev/12-03-amos-errors.html

test.each([
  [
    'a top-level For',
    'For I=1 To 5\nExit\nNext I',
    'loop1: for (I = 1; I <= 5; I++) { break loop1; }',
  ],
  [
    'a count equal to the open loops',
    'Do\nWhile 1=1\nFor I=1 To 2\nExit 3\nNext I\nWend\nLoop',
    'loop3: for (I = 1; I <= 2; I++) { break loop1; }',
  ],
])('Exit translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('Exit 2 jumps out of both loops (manual example)', async () => {
  const javascript = await translate(`
    X=2
    Do
      Do
        If X=1 Then Exit
        If X=2 Then Exit 2
      Loop
    Loop
  `);

  expect(javascript).toContain('if (X == 1) { break loop2; }');
  expect(javascript).toContain('if (X == 2) { break loop1; }');
});

test('a Procedure counts its own loops', async () => {
  const javascript = await translate(`
    Procedure P
      For I=1 To 3
        Exit If I=2
      Next I
    End Proc
    Do
      Exit
    Loop
  `);

  expect(javascript).toContain('loop1: for (I = 1; I <= 3; I++) { if (I == 2) { break loop1; }');
  expect(javascript).toContain('loop1: while (true) { break loop1;');
});

test.each([
  ['Exit outside any loop', 'X=1\nExit', 2, 0],
  ['Exit If outside any loop', 'X=1\nExit If X=1', 2, 0],
  ['Exit 2 with one loop open', 'Do\n   Exit 2\nLoop', 2, 3],
  [
    'Exit If with a count above the open loops',
    'For I=1 To 3\nDo\nExit If I=2,3\nLoop\nNext I',
    3,
    0,
  ],
  [
    'Exit inside a Procedure, with a loop outside it',
    'Do\nProcedure P\nExit\nEnd Proc\nExit\nLoop',
    3,
    0,
  ],
  ['Exit after Windows line endings', 'X=1\r\nY=2\r\nExit', 3, 0],
])('%s is "Not enough loops to exit"', async (name, amos, line, column) => {
  expect(await syntaxErrors(amos)).toEqual([
    { line: line, column: column, msg: 'Not enough loops to exit' },
  ]);
});

test('every Exit that leaves too many loops is reported, on its own line', async () => {
  const errors = await syntaxErrors(`Exit
Do
Exit 1
Exit 2
Loop
Exit If 1=1`);

  expect(errors).toEqual([
    { line: 1, column: 0, msg: 'Not enough loops to exit' },
    { line: 4, column: 0, msg: 'Not enough loops to exit' },
    { line: 6, column: 0, msg: 'Not enough loops to exit' },
  ]);
});
