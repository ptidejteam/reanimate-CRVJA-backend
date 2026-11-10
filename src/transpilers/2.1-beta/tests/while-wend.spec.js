import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  return translatedCode;
}

async function run(source, resultExpression = 'RESULT') {
  const translatedCode = await translate(source);
  const wait = jest.fn((callback) => {
    if (wait.mock.calls.length > 100) throw new Error('Program exceeded the test frame limit');
    callback();
  });
  const program = await vm.runInNewContext(
    `(async () => {
      "use strict";
      ${translatedCode}
      return { read: () => (${resultExpression}) };
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

const normalize = (code) => code.replace(/\s+/g, ' ').trim();

test('translates a comparison condition into a labelled while loop', async () => {
  const js = normalize(await translate('X=0\nWhile X<10\nX=X+1\nWend'));
  expect(js).toContain(
    'loop1: while (X < 10) { X = X + 1; await new Promise((r) => setTimeout(r, 16)); }',
  );
});

test('translates a compound And / Or condition', async () => {
  const js = normalize(await translate('X=0\nY=0\nWhile X<10 and Y<>2 or X=0\nX=X+1\nWend'));
  expect(js).toContain('loop1: while ((X < 10 && Y != 2) || X == 0) {');
});

test('translates a Key State condition', async () => {
  const js = normalize(await translate('While Key State($10)\nWend'));
  expect(js).toContain('loop1: while (currentPressedKey === keyMapping[16]) {');
});

test('repeats the body while the condition holds, one frame per pass', async () => {
  const program = await run('X=0\nWhile X<5\nX=X+1\nWend\nRESULT=X');
  expect(program.read()).toBe(5);
  expect(program.wait).toHaveBeenCalledTimes(5);
});

test('never runs the body when the condition starts false', async () => {
  const program = await run('X=9\nRESULT=0\nWhile X<5\nRESULT=1\nWend');
  expect(program.read()).toBe(0);
  expect(program.wait).not.toHaveBeenCalled();
});

test('Exit If leaves the While loop', async () => {
  const program = await run('X=0\nWhile X<10\nX=X+1\nExit If X=3\nWend\nRESULT=X');
  expect(program.read()).toBe(3);
});

test('Exit 2 inside a While leaves the enclosing Do loop', async () => {
  const source = 'RESULT=0\nDo\nWhile 1=1\nExit 2\nWend\nRESULT=1\nLoop\nRESULT=RESULT+7';
  expect(normalize(await translate(source))).toContain(
    'loop1: while (true) { loop2: while (1 == 1) { break loop1;',
  );
  const program = await run(source);
  expect(program.read()).toBe(7);
});

test('nested While loops get their own labels and restore the depth', async () => {
  const js = normalize(
    await translate('I=0\nWhile I<2\nJ=0\nWhile J<2\nJ=J+1\nWend\nI=I+1\nWend\nDo\nLoop'),
  );
  expect(js).toContain('loop1: while (I < 2) {');
  expect(js).toContain('loop2: while (J < 2) {');
  expect(js).toContain('loop1: while (true) {');
});
