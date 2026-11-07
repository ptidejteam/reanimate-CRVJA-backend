import AMOSTranspiler from '../amos-transpiler.js';

async function translate(code, ...names) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  // Minimal stand-in for the browser APIs
  const fakeDocument = {
    addEventListener() {},
    getElementById() {
      return null;
    },
  };

  return new Function('document', `${translatedCode}\nreturn { ${names.join(', ')} };`)(
    fakeDocument,
  );
}

describe('SORT', () => {
  test('sorts numbers numerically, not as strings', async () => {
    const { A } = await translate(
      `Dim A(3)
        A(0) = 10
        A(1) = 9
        A(2) = 2
        A(3) = 100
        Sort A(0)`,
      'A',
    );

    expect(A).toEqual([2, 9, 10, 100]);
  });

  test('sorts strings by character code, uppercase before lowercase', async () => {
    const { N$ } = await translate(
      `Dim N$(2)
        N$(0) = "banana"
        N$(1) = "apple"
        N$(2) = "Cherry"
        Sort N$(0)`,
      'N$',
    );

    expect(N$).toEqual(['Cherry', 'apple', 'banana']);
  });

  test('sorts the whole array, so unused slots move to the front', async () => {
    const { A } = await translate(
      `Dim A(4)
        A(0) = 5
        A(1) = 3
        Sort A(0)`,
      'A',
    );

    expect(A).toEqual([0, 0, 0, 3, 5]);
  });

  test('rejects a starting index other than 0', async () => {
    await expect(
      (async () => new AMOSTranspiler().transpile(`Dim A(3)\nSort A(1)`))(),
    ).rejects.toThrow('SORT must start at index 0');
  });
});
