import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = await new AMOSTranspiler().transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('for_loop_simple', async () => {
  const amosBasicCode = `
    For I=0 To 10
    Next I
  `;

  const normalizedJS = await translate(amosBasicCode);

  const testTarget = `loop1: for (I = 0; I <= 10; I++) {}`;
  expect(normalizedJS).toContain(testTarget);
});

test('for_loop_with_code', async () => {
  const amosBasicCode = `
  For I=0 To 10
      If Key State($10+I)
          P_DRAWKEYS[I]
          While Key State($10+I)
             Play 37+I,1
          Wend 
          P_DRAWKEYS[-1]
       End If 
    Next I
    `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('loop1: for (I = 0; I <= 10; I++) {');
  expect(normalizedJS).toContain('if (currentPressedKey === keyMapping[16 + I]) {');
  expect(normalizedJS).toContain('P_DRAWKEYS(I);');
  expect(normalizedJS).toContain('loop2: while (currentPressedKey === keyMapping[16 + I]) {');
  expect(normalizedJS).toContain('soundPlayer(37 + I, 1 * 1000);');
  expect(normalizedJS).toContain('P_DRAWKEYS(-1);');
});

async function run(source) {
  const { translatedCode } = await new AMOSTranspiler().transpile(source);
  return vm.runInNewContext(
    `(async () => {
      "use strict";
      ${translatedCode}
      return RESULT;
    })()`,
    { document: { addEventListener() {} }, setTimeout: (callback) => callback() },
    { timeout: 1000 },
  );
}

test('Exit leaves a top-level For', async () => {
  const normalizedJS = await translate('For I=1 To 5\nExit\nNext I');
  expect(normalizedJS).toContain('loop1: for (I = 1; I <= 5; I++) { break loop1; }');
  expect(await run('C=0\nFor I=1 To 5\nC=C+1\nExit\nNext I\nRESULT=C')).toBe(1);
});

test('Exit If leaves the For, not the enclosing Do', async () => {
  const source = 'C=0\nDo\nFor I=1 To 5\nExit If I=3\nC=C+1\nNext I\nExit\nLoop\nRESULT=C*10+I';
  const normalizedJS = await translate(source);
  expect(normalizedJS).toContain(
    'loop1: while (true) { loop2: for (I = 1; I <= 5; I++) { if (I == 3) { break loop2; }',
  );
  expect(await run(source)).toBe(23);
});

test('Exit 2 inside a For leaves the enclosing Do', async () => {
  const source = 'C=0\nDo\nFor I=1 To 5\nExit 2\nNext I\nC=1\nLoop\nRESULT=C';
  expect(await translate(source)).toContain('loop2: for (I = 1; I <= 5; I++) { break loop1; }');
  expect(await run(source)).toBe(0);
});

test('Exit If with a count leaves nested For loops', async () => {
  const source = 'C=0\nFor I=1 To 3\nFor J=1 To 3\nExit If J=2,2\nC=C+1\nNext J\nNext I\nRESULT=C';
  expect(await translate(source)).toContain('if (J == 2) { break loop1; }');
  expect(await run(source)).toBe(1);
});

test('nested For loops get their own labels and restore the depth', async () => {
  const normalizedJS = await translate(
    'For I=1 To 2\nFor J=1 To 2 Step 1\nNext J\nNext I\nFor K=1 To 2\nNext K',
  );
  expect(normalizedJS).toContain('loop1: for (I = 1; I <= 2; I++) {');
  expect(normalizedJS).toContain('loop2: for (J = 1; J <= 2; J += 1) {');
  expect(normalizedJS).toContain('loop1: for (K = 1; K <= 2; K++) {');
});

// Examples from the AMOS Pro manual, Control structures:
// https://amospromanual.dev/05-04-control-structures.html (FOR, STEP, EXIT, EXIT IF)
describe('AMOS manual examples', () => {
  test('For X=1 To 7 repeats the body seven times', async () => {
    const source = 'C=0\nFor X=1 To 7\nC=C+1\nNext X\nRESULT=C';
    expect(await run(source)).toBe(7);
  });

  test('Step 7 counts DAY 1, 8, 15 … up to 365', async () => {
    const source = 'C=0\nL=0\nFor DAY=1 To 365 Step 7\nC=C+1\nL=DAY\nNext DAY\nRESULT=C*1000+L';
    expect(await run(source)).toBe(53 * 1000 + 365);
  });

  test('Exit 2 jumps out of both nested loops', async () => {
    // The manual reads X with Input; here X is set before the loops.
    const source = [
      'X=2',
      'R=0',
      'Do',
      'Do',
      'R=R+1',
      'If X=1 Then Exit',
      'If X=2 Then Exit 2',
      'Loop',
      'R=R+100',
      'Loop',
      'RESULT=R',
    ].join('\n');
    expect(await run(source)).toBe(1);
  });

  test('Exit If A=10,2 leaves the For and the Do, then Exit 1 leaves the While', async () => {
    const source = [
      'L=0',
      'While L=0',
      'A=0',
      'Do',
      'A=A+1',
      'For X=0 To 100',
      'Exit If A=10,2 : Rem Exit from DO and FOR loops',
      'Next X',
      'Loop',
      'Exit 1 : Rem Exit from WHILE loop',
      'Wend',
      'RESULT=A*1000+X',
    ].join('\n');
    const normalizedJS = await translate(source);
    expect(normalizedJS).toContain(
      'loop3: for (X = 0; X <= 100; X++) { if (A == 10) { break loop2; }',
    );
    expect(await run(source)).toBe(10 * 1000);
  });
});
