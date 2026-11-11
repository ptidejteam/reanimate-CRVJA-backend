import AMOSTranspiler from '../amos-transpiler.js';
import { run } from './helpers/runtime.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('Fn translation', async () => {
  const normalizedJS = await translate('Def Fn A(X)=X/2\nY=Fn A(7)\nZ#=Fn A(7)');

  expect(normalizedJS).toContain('A = (X) => X / 2;');
  expect(normalizedJS).toContain('Y = Math.trunc(A(7));');
  expect(normalizedJS).toContain('Z_f = A(7);');
});

// Even an integer Fn returns its expression as is, and its parameter keeps a fraction; only an
// integer variable truncates the result. Checked on the AMOS Professional Web Engine
// (https://creepycat.fr/amos/): Def Fn A(X)=X/2 gives Fn A(7) = 3.5, Fn A(3.7) = 1.85, Y=Fn A(7) = 3.
test('Fn runtime', async () => {
  const values = await run('Def Fn A(X)=X/2\nY=Fn A(7)\nZ#=Fn A(7)\nW#=Fn A(3.7)', [
    'Y',
    'Z_f',
    'W_f',
  ]);

  expect(values).toEqual({ Y: 3, Z_f: 3.5, W_f: 1.85 });
});
