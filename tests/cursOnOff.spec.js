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


test("curs_on", () => {
  const amosBasicCode = `
    Curs On
  `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(
    `document.getElementById('amos-screen').style.cursor = 'auto';`,
  );
});

test("curs_off", () => {
  const amosBasicCode = `
    Curs Off
    `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(
    `document.getElementById('amos-screen').style.cursor = 'none';`,
  );
});

