import AMOSTranspiler from '../AMOSTranspiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await new AMOSTranspiler().transpile(
    code,
  );

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

test('if / else if / else / end if', async () => {
  const amosBasicCode = `
    If A=1
      Curs Off
    Else If A=2
      Curs On
    Else
      Curs Off
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(
    "if (A == 1) { document.getElementById('amos-screen').style.cursor = 'none'; } else if (A == 2) { document.getElementById('amos-screen').style.cursor = 'auto'; } else { document.getElementById('amos-screen').style.cursor = 'none'; }",
  );
});

test('several else if without else', async () => {
  const amosBasicCode = `
    If A=1
    Else If A=2
    Else If A=3
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('else if (A == 2)');
  expect(normalizedJS).toContain('else if (A == 3)');
});

test('else if with a key state condition', async () => {
  const amosBasicCode = `
    If X=1
      Curs Off
    Else If Key State($45)
      Curs On
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain('} else if (currentPressedKey === keyMapping[69]) {');
});

test('else if inside an if key state', async () => {
  const amosBasicCode = `
    If Key State($45)
      Curs Off
    Else If X=1
      Curs On
    Else
      Curs Off
    End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  expect(normalizedJS).toContain(
    "if (currentPressedKey === keyMapping[69]) { document.getElementById('amos-screen').style.cursor = 'none'; } else if (X == 1) { document.getElementById('amos-screen').style.cursor = 'auto'; } else { document.getElementById('amos-screen').style.cursor = 'none'; }",
  );
});
