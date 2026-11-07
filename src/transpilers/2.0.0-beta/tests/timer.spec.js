import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

async function run(source, resultExpression = 'RESULT') {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  let now = 1000;
  const intervals = [];
  const random = jest.fn(() => 0.25);
  const math = Object.create(Math);
  math.random = random;
  const wait = jest.fn((callback, milliseconds) => {
    if (wait.mock.calls.length > 100) throw new Error('Program exceeded the test frame limit');
    now += milliseconds;
    callback();
  });
  const program = await vm.runInNewContext(
    `(async () => {
      "use strict";
      ${translatedCode}
      return { read: () => (${resultExpression}), timer: getTimer, reset: setTimer };
    })()`,
    {
      Date: { now: () => now },
      Math: math,
      document: { addEventListener() {} },
      setTimeout: wait,
      setInterval: (callback) => intervals.push(callback),
    },
    { timeout: 1000 },
  );
  return {
    ...program,
    advance: (milliseconds) => {
      now += milliseconds;
    },
    random,
    wait,
    intervals,
  };
}

test('Timer starts at zero and advances once per 20 elapsed milliseconds', async () => {
  const program = await run('RESULT=Timer');
  expect(program.read()).toBe(0);
  expect(program.timer()).toBe(0);
  program.advance(19);
  expect(program.timer()).toBe(0);
  program.advance(1);
  expect(program.timer()).toBe(1);
  program.advance(4980);
  expect(program.timer()).toBe(250);
  expect(program.wait).not.toHaveBeenCalled();
  expect(program.intervals).toEqual([]);
});

test.each([0, 42, -3, 7.9])(
  'Timer=%s sets the clock to an integer and it continues advancing',
  async (value) => {
    const program = await run(`Timer=${value}\nRESULT=Timer`);
    expect(program.read()).toBe(Math.trunc(value));
    program.advance(40);
    expect(program.timer()).toBe(Math.trunc(value) + 2);
  },
);

test('resetting the timer restarts its tick boundary without retaining elapsed time', async () => {
  const program = await run('Timer=7\nRESULT=Timer');
  program.advance(515);
  expect(program.timer()).toBe(32);
  program.reset(0);
  expect(program.timer()).toBe(0);
  program.advance(19);
  expect(program.timer()).toBe(0);
  program.advance(1);
  expect(program.timer()).toBe(1);
});

test('Timer assignments evaluate nested array and function arguments exactly once', async () => {
  const program = await run(`
    Dim VALUES(1)
    VALUES(0)=10 : VALUES(1)=20
    TIMER=Abs(-VALUES(Rnd(1)))
    RESULT=tImEr
  `);
  expect(program.read()).toBe(10);
  program.advance(20);
  expect(program.timer()).toBe(11);
  expect(program.random).toHaveBeenCalledTimes(1);
});

test('a procedure can set the same Timer that the main program reads', async () => {
  const program = await run(`
    VALUE=12
    Procedure RESET_CLOCK[NEW_VALUE]
      timer=NEW_VALUE
    End Proc
    RESET_CLOCK[VALUE]
    RESULT=TIMER
  `);
  expect(program.read()).toBe(12);
});

test('Timer advances during a blocking Wait without a frame counter', async () => {
  const program = await run('Timer=40\nWait 250\nRESULT=Timer');
  expect(program.read()).toBe(290);
  expect(program.wait).toHaveBeenCalledWith(expect.any(Function), 5000);
});

test('Do...Loop can stop using elapsed Timer ticks without Repeat', async () => {
  const program = await run(`
    Timer=0
    Do
      Exit If Timer>=5
    Loop
    RESULT=Timer
  `);
  expect(program.read()).toBe(5);
  expect(program.wait).toHaveBeenCalledTimes(7);
});

test('Repeat callbacks neither increment nor reset the elapsed clock', async () => {
  const program = await run(`
    Timer=50
    Repeat
      RESULT=Timer
    Until Mouse Key=1
  `);
  expect(program.intervals).toHaveLength(1);
  program.advance(500);
  program.intervals[0]();
  expect(program.read()).toBe(75);
  expect(program.timer()).toBe(75);
  program.advance(500);
  program.intervals[0]();
  expect(program.read()).toBe(100);
  expect(program.timer()).toBe(100);
});
