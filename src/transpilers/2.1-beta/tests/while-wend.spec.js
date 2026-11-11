import { translate } from './helpers/translate.js';

// WHILE ... WEND: repeats a block while a condition is true, testing it before each pass.
// https://amospromanual.dev/05-04-control-structures.html

test.each([
  [
    'a comparison',
    'While X<10\nX=X+1\nWend',
    'loop1: while (X < 10) { X = X + 1; await new Promise((r) => setTimeout(r, 16)); }',
  ],
  [
    'And and Or',
    'While X<10 and Y<>2 or X=0\nWend',
    'loop1: while ((X < 10 && Y != 2) || X == 0) {',
  ],
  [
    'Key State',
    'While Key State($10)\nWend',
    'loop1: while (currentPressedKey === keyMapping[16]) {',
  ],
  [
    'Exit If',
    'While X<10\nX=X+1\nExit If X=3\nWend',
    'loop1: while (X < 10) { X = X + 1; if (X == 3) { break loop1; }',
  ],
])('While translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('Exit 2 inside a While leaves the Do', async () => {
  const javascript = await translate(`
    Do
      While 1=1
        Exit 2
      Wend
    Loop
  `);

  expect(javascript).toContain('loop1: while (true) { loop2: while (1 == 1) { break loop1;');
});

test('nested While loops get their own labels', async () => {
  const javascript = await translate(`
    While I<2
      While J<2
        J=J+1
      Wend
      I=I+1
    Wend
    Do
    Loop
  `);

  expect(javascript).toContain('loop1: while (I < 2) {');
  expect(javascript).toContain('loop2: while (J < 2) {');
  expect(javascript).toContain('loop1: while (true) {');
});
