import AMOSTranspiler from '../amos-transpiler.js';
import { run, seededMath } from './helpers/runtime.js';

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

test('generate a random number', async () => {
  const amosCode = `
    RND_VAR = Rnd(10)
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('let RND_VAR = 0;');
  expect(normalizedJS).toContain('RND_VAR = Math.floor(Math.random() * (10 + 1));');
});

test('generate a random number up to a variable', async () => {
  const amosCode = `
    RND_VAR = Rnd(MAX_VALUE)
  `;
  const normalizedJS = await translate(amosCode);
  expect(normalizedJS).toContain('RND_VAR = Math.floor(Math.random() * (MAX_VALUE + 1));');
});

// Runtime: Rnd(10) is a whole number from 0 to 10, chosen by Math.random.
test.each([
  [0, 0],
  [0.5, 5],
  [0.999, 10],
])('rnd runtime: Rnd(10) with Math.random() = %p is %p', async (random, expected) => {
  const math = seededMath(random);
  const { X } = await run('X = Rnd(10)', ['X'], { Math: math });

  expect(X).toBe(expected);
  expect(math.random).toHaveBeenCalledTimes(1);
});
