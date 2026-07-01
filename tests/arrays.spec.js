import transpileAmosToJS_v2_0_0 from "#root/src/transpilers/transpiler_v2.0.0/transpileAmosToJS_v2_0_0.js";

function translate(code) {
  const {
    lexicalErrors: lexicalErrors,
    syntaxErrors: syntaxErrors,
    translatedCode: translatedCode,
  } = transpileAmosToJS_v2_0_0(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  const normalizedJS = translatedCode.replace(/\s+/g, " ").trim();
  return normalizedJS;
}

test("1D arrays creation, update and global reference", () => {
  const amosBasicCode = `
    Dim C(1)
    Global C(1)
    C(0) = 10
  `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain(
    "const C = Array(1).fill(0); C[Math.trunc(0)] = 10;",
  );
});

test("2D arrays creation, update and global reference", () => {
  const amosBasicCode = `
  Dim S(2,2)
  Global S(2)
  S(1,0) = 20
  TEMP = S(1,0)
  Text 100,100,TEMP
  `;

  const normalizedJS = translate(amosBasicCode);

  // Dim S(2,2)
  expect(normalizedJS).toContain(
    "const S = Array(2).fill(0).map(x => Array(2).fill(0));",
  );
  // S(1,0) = 20
  expect(normalizedJS).toContain("S[Math.trunc(1)][Math.trunc(0)] = 20;");
});
