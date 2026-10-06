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

test('screen_open', async () => {
  const amosBasicCode = `
        Screen Open 1,600,400,8,Hires
    `;

  const normalizedJS = await translate(amosBasicCode);

  const expectedJsCode = `
  const screenDiv = document.createElement('div');
  screenDiv.style.width = '600px';
  screenDiv.style.height = '400px';
  screenDiv.style.border = '1px solid black';
  screenDiv.style.overflow = 'hidden'; 
  screenDiv.style.padding = '0'; 
  screenDiv.style.position = 'relative'; 
  screenDiv.id = 'amos-screen'; 
  screenDiv.style.zIndex = 1;
  document.getElementById('game-container').appendChild(screenDiv);
  document.getElementById('amos-screen').style.backgroundColor = 'black';
`;

  const normalizedExpectedJsCode = expectedJsCode.replace(/\s+/g, ' ').trim();

  expect(normalizedJS).toContain(normalizedExpectedJsCode);
});
