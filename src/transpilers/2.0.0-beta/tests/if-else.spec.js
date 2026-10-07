import transpile from '../transpiler.js';

async function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = await transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, ' ').trim();
  return normalizedJS;
}

test('simple "if 1 > 0" condition', async () => {
  const amosBasicCode = `
    If 1 > 0
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (1 > 0) { }');
});

test('if condition on a variable "if X > 1"', async () => {
  const amosBasicCode = `
    If X > 1
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (X > 1) { }');
});

test('if condition on an array element "if A(1) <> 2"', async () => {
  const amosBasicCode = `
    Dim A(3)
    If A(1) <> 2
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (A[Math.trunc(1)] != 2) { }');
});

test('if condition mixing variables and array elements "if X = 1 and A(2) <= Y"', async () => {
  const amosBasicCode = `
    Dim A(3)
    If X = 1 and A(2) <= Y
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (X == 1 && A[Math.trunc(2)] <= Y) { }');
});

test('if condition with math expressions "if 10 + 1 < 11 + 20"', async () => {
  const amosBasicCode = `
    If 10 + 1 < 11 + 20
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (10 + 1 < 11 + 20) { }');
});

test('if condition with multiple expressions and operators "if 10 + 1 < 11 + 20 and 1 + 1 > 0 - 1"', async () => {
  const amosBasicCode = `
    If 10 + 1 < 11 + 20 and 1 + 1 > 0 - 1
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (10 + 1 < 11 + 20 && 1 + 1 > 0 - 1) { }');
});

test('if condition with parenthesized expressions "if (2 * 5) > 1 and (3 + 3) > 5"', async () => {
  const amosBasicCode = `
    If (2 * 5) > 1 and (3 + 3) > 5
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (2 * 5 > 1 && 3 + 3 > 5) { }');
});

test('if condition with all parenthesized expressions "if (10 + 1) < (11 + 20) and (1 + 1) > (0 - 1)"', async () => {
  const amosBasicCode = `
    If (10 + 1) < (11 + 20) and (1 + 1) > (0 - 1)
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (10 + 1 < 11 + 20 && 1 + 1 > 0 - 1) { }');
});

test('if condition with "or" "if 1 > 0 or 2 < 1"', async () => {
  const amosBasicCode = `
    If 1 > 0 or 2 < 1
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (1 > 0 || 2 < 1) { }');
});

test.each([
  ['And', '&&'],
  ['AND', '&&'],
  ['Or', '||'],
  ['OR', '||'],
])('logical operator is case-insensitive "if 1 > 0 %s 2 > 1"', async (operator, jsOperator) => {
  const amosBasicCode = `
    If 1 > 0 ${operator} 2 > 1
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(`if (1 > 0 ${jsOperator} 2 > 1) { }`);
});

test('if condition chaining three comparisons "if 1 > 0 and 2 > 1 and 3 > 2"', async () => {
  const amosBasicCode = `
    If 1 > 0 and 2 > 1 and 3 > 2
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (1 > 0 && 2 > 1 && 3 > 2) { }');
});

test('"and" binds tighter than "or" "if 1 > 0 or 2 > 1 and 3 > 2"', async () => {
  const amosBasicCode = `
    If 1 > 0 or 2 > 1 and 3 > 2
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('if (1 > 0 || (2 > 1 && 3 > 2)) { }');
});

test('if-else statement with "and" condition', async () => {
  const amosBasicCode = `
    If 1 > 0 and 2 > 1
      Curs Off
    Else
      Curs On
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(
    "if (1 > 0 && 2 > 1) { document.getElementById('amos-screen').style.cursor = 'none'; } else { document.getElementById('amos-screen').style.cursor = 'auto'; }",
  );
});

test('if-else statement execution branches', async () => {
  const amosBasicCode = `
    If 1 > 0
      Curs Off
    Else
      Curs On
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; } else { document.getElementById('amos-screen').style.cursor = 'auto'; }",
  );
});

// NOTE: "If _ Then" is parsed as a single-line If (rule ifThenStatement), but it is not
// translated yet: enterIfThenStatement in commands/structures.js is a placeholder.
test('if_then_not_implemented_yet', async () => {
  const amosBasicCode = `
    If 1 > 0 Then Curs Off
  `;

  const normalizedJS = await translate(amosBasicCode);

  // "Then" is a keyword: it is no longer translated as a procedure call (Then())
  expect(normalizedJS).not.toContain('Then();');
});
