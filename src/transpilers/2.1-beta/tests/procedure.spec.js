import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';
import { translate } from './helpers/translate.js';

// PROCEDURE ... END PROC: a named block of code, with its own local variables.
// https://amospromanual.dev/05-05-procedures.html

test('a Procedure without parameters, and its call', async () => {
  const javascript = await translate(`
    Procedure PROC_RESET
    End Proc
    PROC_RESET
  `);

  expect(javascript).toContain('async function PROC_RESET() {');
  expect(javascript).toContain('await PROC_RESET();');
});

test('a Procedure with parameters, and its call', async () => {
  const javascript = await translate(`
    Procedure PROC_SUM[A,B]
      RESULT = A + B
    End Proc
    PROC_SUM[1,2 + 3]
  `);

  expect(javascript).toContain('async function PROC_SUM(A, B) {');
  expect(javascript).toContain('RESULT = A + B;');
  expect(javascript).toContain('await PROC_SUM(1, 2 + 3);');
});

// A parameter is already a local variable, so it is not declared again with let.
test('assigning to a parameter', async () => {
  const javascript = await translate(`
    MY_VAR = 55
    Global MY_VAR
    Procedure PROC_INCREMENT[X]
      X = X + 1
    End Proc
    PROC_INCREMENT[MY_VAR]
  `);

  expect(javascript).toContain('async function PROC_INCREMENT(X) {');
  expect(javascript).toContain('X = X + 1;');
  expect(javascript).toContain('await PROC_INCREMENT(MY_VAR);');
  expect(javascript).not.toContain('let X = 0;');
});

// Manual example: PLUS prints 1 "no matter how many times it is called", because its local
// variable A starts at zero on every call.
test('a local variable starts at zero on every call', async () => {
  const javascript = await translate(`
    Procedure PLUS
      A=A+1
    End Proc
    PLUS
  `);

  expect(javascript).toContain('async function PLUS() { let A = 0; A = A + 1; }');
});

// Manual example: TEST1 changes the Global variables A and B, not local copies.
test('Global variables are shared with the Procedures', async () => {
  const javascript = await translate(`
    A=6 : B=9
    Global A,B
    TEST1
    Procedure TEST1
      A=A+1 : B=B+1
    End Proc
  `);

  expect(javascript).toContain('async function TEST1() { A = A + 1; B = B + 1; }');
});

test('a Procedure can call itself', async () => {
  const javascript = await translate(`
    Procedure FACTORIAL[N]
      If N>1
        FACTORIAL[N-1]
      End If
    End Proc
    FACTORIAL[5]
  `);

  expect(javascript).toContain(
    'async function FACTORIAL(N) { if (N > 1) { await FACTORIAL(N - 1); } }',
  );
});

test('On ... Proc calls the chosen Procedure', async () => {
  const javascript = await translate(`
    Procedure FIRST
    End Proc
    Procedure SECOND
    End Proc
    On X Proc FIRST,SECOND
  `);

  expect(javascript).toContain('case 1: await FIRST(); break; case 2: await SECOND(); break;');
});

// The tests below run the program, because the JavaScript alone cannot show that the caller
// waits for the Procedure to finish (loops, Wait and Wait Key take whole frames).

// Starts a program the way the IDE does. `fire` sends a document event, such as a key press,
// and each frame wait (setTimeout) runs at once.
async function start(amos) {
  const result = await new AMOSTranspiler().transpile(amos);
  expect(result.syntaxErrors.errors).toEqual([]);

  const listeners = {};
  const fire = (type, event) => (listeners[type] ?? []).forEach((listener) => listener(event));
  const wait = jest.fn((callback) => {
    if (wait.mock.calls.length > 100) throw new Error('Program exceeded the test frame limit');
    callback();
  });
  const finished = vm.runInNewContext(
    `(async () => {
      "use strict";
      ${result.translatedCode}
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
  return { finished, fire };
}

// Runs a program to the end and returns RESULT.
async function run(amos) {
  const read = await (await start(amos)).finished;
  return read();
}

test('the caller waits for End Proc, with loops and waits inside the Procedure', async () => {
  const result = await run(`
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
    RESULT=RESULT*10+1
  `);

  expect(result).toBe(71);
});

test('every call runs, even several in one frame', async () => {
  const result = await run(`
    RESULT=0
    Global RESULT
    Procedure ADD_ONE
      RESULT=RESULT+1
    End Proc
    For I=1 To 5
      ADD_ONE
    Next I
    ADD_ONE
    ADD_ONE
  `);

  expect(result).toBe(7);
});

test('On ... Proc waits for the chosen Procedure', async () => {
  const result = await run(`
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
    RESULT=RESULT*10
  `);

  expect(result).toBe(20);
});

test('Wait Key inside a Procedure holds the caller until a key is pressed', async () => {
  const program = await start(`
    RESULT=0
    Global RESULT
    Procedure PRESS_A_KEY
      RESULT=1
      Wait Key
      RESULT=RESULT+1
    End Proc
    PRESS_A_KEY
    RESULT=RESULT*10
  `);

  let read;
  program.finished.then((reader) => (read = reader));
  await new Promise((resolve) => setImmediate(resolve));
  expect(read).toBeUndefined();

  program.fire('keydown', { code: 'KeyA' });
  expect((await program.finished)()).toBe(20);
});
