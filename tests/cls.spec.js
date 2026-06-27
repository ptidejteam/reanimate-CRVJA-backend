import transpileAmosToJS from "#root/src/transpilers/transpiler_v2.0.0/transpileAmosToJS.js";

function translate(code) {
    const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpileAmosToJS(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  
  const normalizedJS = translatedCode.replace(/\s+/g, " ").trim();
  return normalizedJS;
}


test("cls translation", () => {
  const amosBasicCode = `
    Cls
  `;

  const normalizedJS = translate(amosBasicCode);

  // Check if the output contains the screen clearing commands
  expect(normalizedJS).toContain(
    "const amosScreen = document.getElementById('amos-screen');",
  );
  expect(normalizedJS).toContain("amosScreen.innerHTML = '';");
});

test("cls with color translation", () => {
  const amosBasicCode = `
    Cls 2
    `;
  
  const normalizedJS = translate(amosBasicCode);

  // Check if the output contains the screen clearing commands
  expect(normalizedJS).toContain(
    "const amosScreen = document.getElementById('amos-screen');",
  );
  expect(normalizedJS).toContain("amosScreen.innerHTML = '';");

  // Check if it sets the background color using the colorMapping dictionary
  expect(normalizedJS).toContain(
    'amosScreen.style.backgroundColor = colorMapping[2];',
  );
});

test("cls with block area translation", () => {
  const amosBasicCode = `
        Cls 2,10,20 To 100,200
    `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(
    'const clearColor = colorMapping[2];',
  );
  expect(normalizedJS).toContain("const clearX1 = 10;");
  expect(normalizedJS).toContain("const clearY1 = 20;");
  expect(normalizedJS).toContain("const clearX2 = 100;");
  expect(normalizedJS).toContain("const clearY2 = 200;");
  expect(normalizedJS).toContain(
    "fillDiv.style.backgroundColor = clearColor;",
  );
});

