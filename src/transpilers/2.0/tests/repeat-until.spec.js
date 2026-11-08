import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

// REPEAT ... UNTIL, as in the AMOS Pro manual:
// https://amospromanual.dev/05-04-control-structures.html

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  return translatedCode;
}

const normalize = (code) => code.replace(/\s+/g, ' ').trim();

// Runs a program, counting its frame waits.
async function run(source) {
  const translatedCode = await translate(source);
  const wait = jest.fn((callback) => {
    if (wait.mock.calls.length > 100) throw new Error('Program exceeded the test frame limit');
    callback();
  });
  const program = await vm.runInNewContext(
    `(async () => {
      "use strict";
      ${translatedCode}
      return { read: () => RESULT };
    })()`,
    {
      document: { addEventListener() {} },
      setTimeout: wait,
      setInterval() {},
    },
    { timeout: 1000 },
  );
  return { ...program, wait };
}

describe('REPEAT ... UNTIL', () => {
  test('translates into a labeled loop tested after each pass', async () => {
    const js = normalize(await translate('X=0\nRepeat\nX=X+1\nUntil X=10'));
    expect(js).toContain(
      'loop1: do { X = X + 1; await new Promise((r) => setTimeout(r, 16)); } while (!(X == 10));',
    );
  });

  test('translates compound And / Or and Key State conditions', async () => {
    const js = normalize(await translate('X=0\nY=0\nRepeat\nUntil X>3 and Y<>2 or X=0'));
    expect(js).toContain('while (!((X > 3 && Y != 2) || X == 0));');
    const keys = normalize(await translate('Repeat\nUntil Key State($45)'));
    expect(keys).toContain('while (!(currentPressedKey === keyMapping[69]));');
  });

  test('repeats the body until the condition holds, one frame per pass', async () => {
    const program = await run('X=0\nRepeat\nX=X+1\nUntil X=10\nRESULT=X');
    expect(program.read()).toBe(10);
    expect(program.wait).toHaveBeenCalledTimes(10);
  });

  test('runs the body at least once, even when the condition already holds', async () => {
    const program = await run('X=5\nRepeat\nX=X+1\nUntil X>0\nRESULT=X');
    expect(program.read()).toBe(6);
    expect(program.wait).toHaveBeenCalledTimes(1);
  });

  test('runs the code after Until only once the loop has ended', async () => {
    const program = await run('RESULT=0\nX=0\nRepeat\nX=X+1\nUntil X=3\nRESULT=RESULT+X');
    expect(program.read()).toBe(3);
  });

  test('Exit and Exit If leave the Repeat loop', async () => {
    expect((await run('X=0\nRepeat\nX=X+1\nExit If X=4\nUntil X=10\nRESULT=X')).read()).toBe(4);
    expect((await run('X=0\nRepeat\nX=X+1\nExit\nUntil X=10\nRESULT=X')).read()).toBe(1);
  });

  test('Exit 2 inside a For leaves the enclosing Repeat', async () => {
    const source = 'C=0\nRepeat\nFor I=1 To 5\nExit If I=2,2\nC=C+1\nNext I\nUntil C=99\nRESULT=C';
    expect(normalize(await translate(source))).toContain(
      'loop1: do { loop2: for (I = 1; I <= 5; I++) { if (I == 2) { break loop1; }',
    );
    expect((await run(source)).read()).toBe(1);
  });

  test('nested Repeat loops get their own labels', async () => {
    const js = normalize(await translate('Repeat\nRepeat\nUntil 1=1\nUntil 1=1\nDo\nLoop'));
    expect(js).toContain('loop1: do { loop2: do {');
    expect(js).toContain('loop1: while (true) {');
  });
});

// MOUSE KEY is not implemented in 2.0 yet, so the manual's `Until Mouse Key<>0` is rejected.
test('Until Mouse Key is a syntax error until Mouse Key is implemented', async () => {
  const { syntaxErrors } = await new AMOSTranspiler().transpile('Repeat\nUntil Mouse Key<>0');
  expect(syntaxErrors.errors).not.toEqual([]);
});
