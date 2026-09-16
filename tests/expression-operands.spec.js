import transpile from '#root/src/transpilers/2.0.0-beta/transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return translatedCode.replace(/\s+/g, ' ').trim();
}

describe('expression operands', () => {
  test('translates expressions used by drawing and screen commands', async () => {
    const normalizedJS = await translate(`
      Dim A(20)
      Box A((1+2)*3),Sin(A(2+1)) To 100,100
      Bar A(1+2),10 To 100,100
      Circle A(1+2),10,Rnd(A(2+1))
      Text A(1+2),Sin(A(2+1)),"Hello"
      Turbo Draw A(1+2),2 To 3,4,Sin(A(2+1)),A(3)
      Blitter Clear 0,0,A(1+2),2 To 3,A(2+1)
      Cls A(1+2),A(2+1),3 To 4,A(3)
    `);

    expect(normalizedJS).toContain("boxDiv.style.left = A[Math.trunc((1 + 2) * 3)] + 'px';");
    expect(normalizedJS).toContain('const x1 = A[Math.trunc(1 + 2)];');
    expect(normalizedJS).toContain('Math.floor(Math.random() * (A[Math.trunc(2 + 1)] + 1))');
    expect(normalizedJS).toContain("textEl.style.top = Math.sin(A[Math.trunc(2 + 1)]) + 'px';");
    expect(normalizedJS).toMatch(/const TurboDrawX1[A-Za-z0-9]+ = A\[Math\.trunc\(1 \+ 2\)\];/);
    expect(normalizedJS).toContain('colorMapping[Math.sin(A[Math.trunc(2 + 1)])]');
    expect(normalizedJS).toContain('const clearY2 = A[Math.trunc(2 + 1)];');
    expect(normalizedJS).toContain('const clearColor = colorMapping[A[Math.trunc(1 + 2)]];');
    expect(normalizedJS).not.toMatch(/\bA\(/);
  });

  test('translates loop, Add, procedure-call, key-state, sound, and sprite expressions', async () => {
    const normalizedJS = await translate(`
      Dim A(20)
      X = 1
      For I=A((1+2)*3) To Rnd(A(2+1))
      Next I
      Add X,A(1+2),A(2+1) To Rnd(A(3))
      Procedure P[X,Y]
      End Proc
      P[A(1+2),Sin(A(2+1))]
      If Key State($10+A(1+2))
      End If
      Play A(1+2),1
      Sprite A(1+2),X,Y,Z
    `);

    expect(normalizedJS).toContain('I = A[Math.trunc((1 + 2) * 3)];');
    expect(normalizedJS).toContain('I <= Math.floor(Math.random() * (A[Math.trunc(2 + 1)] + 1));');
    expect(normalizedJS).toContain(
      '(X + A[Math.trunc(1 + 2)]) % Math.floor(Math.random() * (A[Math.trunc(3)] + 1));',
    );
    expect(normalizedJS).toContain('if (X < A[Math.trunc(2 + 1)]) {');
    expect(normalizedJS).toContain('P(A[Math.trunc(1 + 2)], Math.sin(A[Math.trunc(2 + 1)]));');
    expect(normalizedJS).toContain(
      'if (currentPressedKey === keyMapping[16 + A[Math.trunc(1 + 2)]]) {',
    );
    expect(normalizedJS).toContain('soundPlayer(A[Math.trunc(1 + 2)], 1 * 1000);');
    expect(normalizedJS).toContain('renderSprite(A[Math.trunc(1 + 2)], X, Y, Z);');
    expect(normalizedJS).not.toMatch(/\bA\(/);
  });

  test('translates data values, dimensions, array targets, array values, and Print expressions', async () => {
    const normalizedJS = await translate(`
      Dim A(20)
      Dim B(A((1+2)*3),Sin(A(2+1)))
      B(A(1+2),Rnd(A(2+1))) = Sin(A(3+1))
      Data A(1+2),Rnd(A(2+1))
      Read B(A(1+2),A(2+1))
      Print A(1+2)
      Print #1,A(2+1)
    `);

    expect(normalizedJS).toContain('const B = Array(A[Math.trunc((1 + 2) * 3)])');
    expect(normalizedJS).toContain('.map((x) => Array(Math.sin(A[Math.trunc(2 + 1)])).fill(0));');
    expect(normalizedJS).toMatch(
      /B\[Math\.trunc\(A\[Math\.trunc\(1 \+ 2\)\]\)\]\[\s*Math\.trunc\(Math\.floor\(Math\.random\(\) \* \(A\[Math\.trunc\(2 \+ 1\)\] \+ 1\)\)\)\s*\] = Math\.sin\(A\[Math\.trunc\(3 \+ 1\)\]\);/,
    );
    expect(normalizedJS).toContain(
      'dataMatrix.push( A[Math.trunc(1 + 2)], Math.floor(Math.random() * (A[Math.trunc(2 + 1)] + 1)), );',
    );
    expect(normalizedJS).toContain(
      'B[Math.trunc(A[Math.trunc(1 + 2)])][Math.trunc(A[Math.trunc(2 + 1)])] = dataMatrix[dataMatrixPointer++];',
    );
    expect(normalizedJS).toContain('printEl.innerText = A[Math.trunc(1 + 2)];');
    expect(normalizedJS).toContain('writeToChannel(1, A[Math.trunc(2 + 1)]);');
    expect(normalizedJS).not.toMatch(/\bA\(/);
  });
});
