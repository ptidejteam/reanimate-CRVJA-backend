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

test('Text', async () => {
  const amosBasicCode = `
        Text 10,10,"Hello, World!"
    `;

  const normalizedJS = await translate(amosBasicCode);

  const expectedJsCode = `
    const textId = 'textDiv_' + 10 + '_' + 10;
    let textEl = document.getElementById(textId);
    if (!textEl) {
        textEl = document.createElement('div');
        textEl.id = textId;
        textEl.style.position = 'absolute';
        textEl.style.left = '10px';
        textEl.style.top = '10px';
        textEl.style.fontSize = '14px';
        textEl.style.zIndex = 99;
        document.getElementById('amos-screen').appendChild(textEl);
    }
    textEl.innerText = 'Hello, World!';
    textEl.style.color = getColour(Ink);
    textEl.style.backgroundColor = getColour(Paper);
  `;

  const normalizedExpectedJsCode = expectedJsCode.replace(/\s+/g, ' ').trim();
  expect(normalizedJS).toContain(normalizedExpectedJsCode);
});

test('Text inside If/Else has no scoping issue', async () => {
  const amosBasicCode = `
Screen Open 1,500,500,8,Hires
If 2 < 1
    Text 10,10,"True"
Else
    Text 10,10,"False"
End If
  `;

  const normalizedJS = await translate(amosBasicCode);

  // Both branches should use getElementById (DOM lookup), not a JS variable reference
  // This ensures the else branch can access the same element without a ReferenceError
  expect(normalizedJS).toContain("'True'");
  expect(normalizedJS).toContain("'False'");

  // The generated code should use document.getElementById for the text element
  expect(normalizedJS).toContain('document.getElementById(textId)');

  // There should be no const textDiv declarations (the old broken pattern)
  expect(normalizedJS).not.toMatch(/const textDiv\d+/);
});
