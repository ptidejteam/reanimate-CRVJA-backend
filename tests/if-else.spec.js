import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

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
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; } else { document.getElementById('amos-screen').style.cursor = 'auto'; }"
  );
});

// NOTE: "If _ Then" clause is not implemented in amos-translator.js yet.
// Currently, "Then" is treated as an identifier/procedure call (Then()) inside the IF block.
test('if_then_not_implemented_yet', async () => {
  const amosBasicCode = `
    If 1 > 0 Then Curs Off
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  // Documents that "If _ Then" is not implemented yet in amos-translator.js
  // (Translates 'Then' to 'Then()' instead of consuming it as an IF clause keyword)
  expect(normalizedJS).toContain('Then();');
});
