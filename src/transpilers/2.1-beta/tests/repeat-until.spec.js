import { translate, syntaxErrors } from './helpers/translate.js';

// REPEAT ... UNTIL: repeats a block until a condition is true, testing it after each pass,
// so the block runs at least once. https://amospromanual.dev/05-04-control-structures.html

test.each([
  [
    'a comparison',
    'X=0\nRepeat\nX=X+1\nUntil X=10',
    'loop1: do { X = X + 1; await new Promise((r) => setTimeout(r, 16)); } while (!(X == 10));',
  ],
  ['And and Or', 'Repeat\nUntil X>3 and Y<>2 or X=0', 'while (!((X > 3 && Y != 2) || X == 0));'],
  ['Key State', 'Repeat\nUntil Key State($45)', 'while (!(currentPressedKey === keyMapping[69]));'],
  [
    'Exit If',
    'Repeat\nX=X+1\nExit If X=4\nUntil X=10',
    'loop1: do { X = X + 1; if (X == 4) { break loop1; }',
  ],
  ['Exit', 'Repeat\nX=X+1\nExit\nUntil X=10', 'loop1: do { X = X + 1; break loop1;'],
])('Repeat translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('Exit 2 inside a For leaves the Repeat', async () => {
  const javascript = await translate(`
    Repeat
      For I=1 To 5
        Exit If I=2,2
      Next I
    Until C=99
  `);

  expect(javascript).toContain(
    'loop1: do { loop2: for (I = 1; I <= 5; I++) { if (I == 2) { break loop1; }',
  );
});

test('nested Repeat loops get their own labels', async () => {
  const javascript = await translate(`
    Repeat
      Repeat
      Until 1=1
    Until 1=1
    Do
    Loop
  `);

  expect(javascript).toContain('loop1: do { loop2: do {');
  expect(javascript).toContain('loop1: while (true) {');
});

// Mouse Key is not implemented yet, so the manual's Until Mouse Key<>0 is rejected.
test.each(['Repeat\nUntil Mouse Key<>0'])('%s is a syntax error', async (amos) => {
  expect(await syntaxErrors(amos)).not.toEqual([]);
});
