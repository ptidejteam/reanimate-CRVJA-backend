import { translate } from './helpers/translate.js';

// FOR ... NEXT: repeats a block with a counter. https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['an empty loop', 'For I=0 To 10\nNext I', 'loop1: for (I = 0; I <= 10; I++) {}'],
  ['the manual example', 'For X=1 To 7\nNext X', 'loop1: for (X = 1; X <= 7; X++) {}'],
  [
    'Step (manual example)',
    'For DAY=1 To 365 Step 7\nNext DAY',
    'loop1: for (DAY = 1; DAY <= 365; DAY += 7) {}',
  ],
  // An integer counter starts from the truncated value; checked on creepycat:
  // For I=1.7 To 3.2 prints 1, 2, 3.
  [
    'a fractional start',
    'For I=1.7 To 3.2\nNext I',
    'loop1: for (I = Math.trunc(1.7); I <= 3.2; I++) {',
  ],
])('For translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('For with a block inside', async () => {
  const javascript = await translate(`
    For I=0 To 10
      If Key State($10+I)
        P_DRAWKEYS[I]
        While Key State($10+I)
          Play 37+I,1
        Wend
        P_DRAWKEYS[-1]
      End If
    Next I
  `);

  expect(javascript).toContain('loop1: for (I = 0; I <= 10; I++) {');
  expect(javascript).toContain('if (currentPressedKey === keyMapping[16 + I]) {');
  expect(javascript).toContain('P_DRAWKEYS(I);');
  expect(javascript).toContain('loop2: while (currentPressedKey === keyMapping[16 + I]) {');
  expect(javascript).toContain('soundPlayer(37 + I, 1 * 1000);');
  expect(javascript).toContain('P_DRAWKEYS(-1);');
});

test('Exit If leaves the For, not the Do around it', async () => {
  const javascript = await translate(`
    Do
      For I=1 To 5
        Exit If I=3
      Next I
    Loop
  `);

  expect(javascript).toContain(
    'loop1: while (true) { loop2: for (I = 1; I <= 5; I++) { if (I == 3) { break loop2; }',
  );
});

test('Exit 2 inside a For leaves the Do around it', async () => {
  const javascript = await translate(`
    Do
      For I=1 To 5
        Exit 2
      Next I
    Loop
  `);

  expect(javascript).toContain('loop2: for (I = 1; I <= 5; I++) { break loop1; }');
});

test('Exit If with a count leaves both For loops', async () => {
  const javascript = await translate(`
    For I=1 To 3
      For J=1 To 3
        Exit If J=2,2
      Next J
    Next I
  `);

  expect(javascript).toContain('if (J == 2) { break loop1; }');
});

test('nested For loops get their own labels', async () => {
  const javascript = await translate(`
    For I=1 To 2
      For J=1 To 2 Step 1
      Next J
    Next I
    For K=1 To 2
    Next K
  `);

  expect(javascript).toContain('loop1: for (I = 1; I <= 2; I++) {');
  expect(javascript).toContain('loop2: for (J = 1; J <= 2; J += 1) {');
  expect(javascript).toContain('loop1: for (K = 1; K <= 2; K++) {');
});

// Manual example: Exit If A=10,2 leaves the For and the Do, then Exit 1 leaves the While.
test('Exit If A=10,2 inside For, Do and While', async () => {
  const javascript = await translate(`
    While L=0
      Do
        A=A+1
        For X=0 To 100
          Exit If A=10,2 : Rem Exit from DO and FOR loops
        Next X
      Loop
      Exit 1 : Rem Exit from WHILE loop
    Wend
  `);

  expect(javascript).toContain('loop3: for (X = 0; X <= 100; X++) { if (A == 10) { break loop2; }');
});
