import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

// PROCEDURE ... END PROC, as in the AMOS Pro manual:
// https://amospromanual.dev/05-05-procedures.html

// Programs run inside an async function, as in the IDE, since Procedure calls are awaited.
const AsyncFunction = (async () => {}).constructor;

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return {
    translatedCode,
    normalizedJS: translatedCode.replace(/\s+/g, ' ').trim(),
  };
}

// Starts a program the way the IDE does; `fire` sends document events such as a key press.
async function start(source) {
  const { translatedCode } = await translate(source);
  const listeners = {};
  const fire = (type, event) => (listeners[type] ?? []).forEach((listener) => listener(event));
  const wait = jest.fn((callback) => {
    if (wait.mock.calls.length > 100) throw new Error('Program exceeded the test frame limit');
    callback();
  });
  const finished = vm.runInNewContext(
    `(async () => {
      "use strict";
      ${translatedCode}
      return () => RESULT;
    })()`,
    {
      document: {
        addEventListener: (type, listener) => (listeners[type] ??= []).push(listener),
      },
      setTimeout: wait,
      setInterval() {},
    },
    { timeout: 1000 },
  );
  return { finished, fire, wait };
}

async function run(source) {
  const read = await (await start(source)).finished;
  return read();
}

describe('Procedure command', () => {
  test('translates a procedure without parameters and its call', async () => {
    const { normalizedJS } = await translate(`
      Procedure PROC_RESET
      End Proc
      PROC_RESET
    `);

    expect(normalizedJS).toContain('async function PROC_RESET() {');
    expect(normalizedJS).toContain('await PROC_RESET();');
  });

  test('translates multiple parameters and call arguments in order', async () => {
    const { normalizedJS } = await translate(`
      Procedure PROC_SUM[A,B]
        RESULT = A + B
      End Proc
      PROC_SUM[1,2 + 3]
    `);

    expect(normalizedJS).toContain('async function PROC_SUM(A, B) {');
    expect(normalizedJS).toContain('RESULT = A + B;');
    expect(normalizedJS).toContain('await PROC_SUM(1, 2 + 3);');
  });

  test('generates valid JavaScript when assigning to a parameter', async () => {
    const { normalizedJS, translatedCode } = await translate(`
      MY_VAR = 55
      Global MY_VAR
      Procedure PROC_INCREMENT[X]
        X = X + 1
      End Proc
      PROC_INCREMENT[MY_VAR]
    `);

    expect(normalizedJS).toContain('async function PROC_INCREMENT(X) {');
    expect(normalizedJS).toContain('X = X + 1;');
    expect(normalizedJS).toContain('await PROC_INCREMENT(MY_VAR);');
    expect(normalizedJS).not.toContain('let X = 0;');
    expect(() => new AsyncFunction(translatedCode)).not.toThrow();
  });
});

describe('Procedure calls', () => {
  test('the caller waits for End Proc, with loops and waits inside the Procedure', async () => {
    const source = `
      RESULT=0
      Global RESULT
      Procedure COUNT_UP
        X=0
        While X<3
          X=X+1
        Wend
        Repeat
          X=X+1
        Until X=5
        Do
          X=X+1
          Exit If X=7
        Loop
        Wait 1
        RESULT=RESULT*10+X
      End Proc
      COUNT_UP
      RESULT=RESULT*10+1`;
    expect(await run(source)).toBe(71);
  });

  test('runs every call, even several in one frame', async () => {
    const source = `
      RESULT=0
      Global RESULT
      Procedure ADD_ONE
        RESULT=RESULT+1
      End Proc
      For I=1 To 5
        ADD_ONE
      Next I
      ADD_ONE
      ADD_ONE`;
    expect(await run(source)).toBe(7);
  });

  test('manual example: local variables start at zero on every call', async () => {
    // The manual's PLUS prints 1 "no matter how many times it is called".
    const source = `
      RESULT=0
      Global RESULT
      Procedure PLUS
        A=A+1
        RESULT=RESULT*10+A
      End Proc
      PLUS
      PLUS
      PLUS`;
    expect(await run(source)).toBe(111);
  });

  test('manual example: Global variables are shared with the Procedures', async () => {
    const source = `
      A=6 : B=9
      Global A,B
      TEST1
      TEST2
      RESULT=A*100+B
      Procedure TEST1
        A=A+1 : B=B+1
      End Proc
      Procedure TEST2
        A=A+B : B=B+A
      End Proc`;
    expect(await run(source)).toBe(1727);
  });

  test('a Procedure can call itself', async () => {
    const source = `
      RESULT=1
      Global RESULT
      Procedure FACTORIAL[N]
        If N>1
          RESULT=RESULT*N
          FACTORIAL[N-1]
        End If
      End Proc
      FACTORIAL[5]`;
    expect(await run(source)).toBe(120);
  });

  test('On ... Proc waits for the chosen Procedure', async () => {
    const source = `
      RESULT=0
      Global RESULT
      Procedure FIRST
        RESULT=1
      End Proc
      Procedure SECOND
        Wait 1
        RESULT=2
      End Proc
      X=2
      On X Proc FIRST,SECOND
      RESULT=RESULT*10`;
    const { normalizedJS } = await translate(source);
    expect(normalizedJS).toContain('case 1: await FIRST(); break; case 2: await SECOND(); break;');
    expect(await run(source)).toBe(20);
  });

  test('Wait Key inside a Procedure holds the caller until a key is pressed', async () => {
    const source = `
      RESULT=0
      Global RESULT
      Procedure PRESS_A_KEY
        RESULT=1
        Wait Key
        RESULT=RESULT+1
      End Proc
      PRESS_A_KEY
      RESULT=RESULT*10`;
    const program = await start(source);
    let read;
    program.finished.then((reader) => (read = reader));
    await new Promise((resolve) => setImmediate(resolve));
    expect(read).toBeUndefined();
    program.fire('keydown', { code: 'KeyA' });
    expect((await program.finished)()).toBe(20);
  });
});
