import transpileAmosToJS_v2_0_0 from "#root/src/transpilers/transpiler_v2_0_0/transpileAmosToJS_v2_0_0.js";

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


test("for_loop_simple", () => {
  const amosBasicCode = `
    For I=0 To 10
    Next I
  `;

  const normalizedJS = translate(amosBasicCode);

  const testTarget = `for (I = 0; I <= 10; I++) {}`;
  expect(normalizedJS).toContain(testTarget);
});

test("for_loop_with_code", () => {
  const amosBasicCode = `
  For I=0 To 10
      If Key State($10+I)
          P_DRAWKEYS[I]
          While Key State($10+I)
             Play 37+I,1
          Wend 
          P_DRAWKEYS[-1]
       End If 
    Next I
    `;

  const normalizedJS = translate(amosBasicCode);

  expect(normalizedJS).toContain("for (I = 0; I <= 10; I++) {");
  expect(normalizedJS).toContain(
    "if (currentPressedKey === keyMapping[16+I]) {",
  );
  expect(normalizedJS).toContain("P_DRAWKEYS(I);");
  expect(normalizedJS).toContain("soundPlayer(37+I, 1 * 1000);");
  expect(normalizedJS).toContain("P_DRAWKEYS(-1);");
});

