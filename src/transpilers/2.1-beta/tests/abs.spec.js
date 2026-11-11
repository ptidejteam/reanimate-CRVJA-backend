import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

test('abs translation', async () => {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    'X = Abs(-3)',
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  expect(translatedCode).toContain('X = Math.abs(-3);');
});

test('abs runtime', async () => {
  const { X } = await run('X = Abs(-3)', ['X']);

  expect(X).toBe(3);
});
