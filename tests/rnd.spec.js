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


// now generating RND_VAR = Rnd(10);randomInt(42)
test("generate a random number", () => {
  const amosCode = `
    RND_VAR = Rnd(10)
  `;
  const normalizedJS = translate(amosCode);
  expect(normalizedJS).toContain("let RND_VAR = 0;");
  expect(normalizedJS).toContain("RND_VAR = Rnd(10);");
}); 

