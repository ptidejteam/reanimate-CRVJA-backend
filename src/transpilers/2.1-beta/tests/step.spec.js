import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test.each([
  ['a positive step', 'For I=1 To 10 Step 3\nNext I', 'for (I = 1; I <= 10; I += 3) {'],
  ['a negative step', 'For I=10 To 1 Step -2\nNext I', 'for (I = 10; I >= 1; I += -2) {'],
  ['a decimal step', 'For X#=0 To 1 Step 0.25\nNext X#', 'for (X_f = 0; X_f <= 1; X_f += 0.25) {'],
  [
    'a variable step',
    'For I=1 To 10 Step S\nNext I',
    'for (I = 1; S >= 0 ? I <= 10 : I >= 10; I += S) {',
  ],
  ['no step', 'For I=1 To 3\nNext I', 'for (I = 1; I <= 3; I++) {'],
])('for loop with %s', async (_name, source, expected) => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    source,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain(expected);
});

// An integer counter adds the Step, then truncates toward zero. Checked on the AMOS
// Professional Web Engine (https://creepycat.fr/amos/) in direct mode.
describe('a fractional step on an integer counter', () => {
  test('translation', async () => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
      'For I=-3 To 0 Step 1.5\nNext I',
    );

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors).toEqual([]);
    expect(translatedCode).toContain('for (I = -3; I <= 0; I = Math.trunc(I + 1.5)) {');
  });

  test('For I=-3 To 0 Step 1.5 gives -3, -1, 0', async () => {
    const { L } = await run('L=0\nFor I=-3 To 0 Step 1.5\nL=L*10+Abs(I)\nNext I', ['L']);

    expect(L).toBe(310);
  });

  // 1 + 0.5 truncates back to 1, and 0 - 0.5 back to 0: the counter never moves.
  test.each([
    ['Step 0.5 from 1', 'For I=1 To 3 Step 0.5', 1],
    ['Step -0.5 down to 0', 'For I=3 To 0 Step -0.5', 0],
  ])('%s stops moving (the loop only ends with Exit If)', async (_name, forLine, counter) => {
    const { C, I } = await run(`C=0\n${forLine}\nC=C+1\nExit If C>10\nNext I`, ['C', 'I']);

    // + 0 turns JavaScript's -0 (Math.trunc(-0.5)) into 0; it prints and compares as 0.
    expect({ C, I: I + 0 }).toEqual({ C: 11, I: counter });
  });

  test('a float counter keeps the fraction', async () => {
    const { C } = await run('C=0\nFor X#=1 To 3 Step 0.5\nC=C+1\nNext X#', ['C']);

    expect(C).toBe(5);
  });
});
