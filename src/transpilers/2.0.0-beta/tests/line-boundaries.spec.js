import transpile from '../transpiler.js';

async function translate(code) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(code);

  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);

  return {
    translatedCode,
    normalizedJS: translatedCode.replace(/\s+/g, ' ').trim(),
  };
}

function expectOnceInOrder(code, fragments) {
  let previousIndex = -1;
  for (const fragment of fragments) {
    expect(code.split(fragment)).toHaveLength(2);
    const index = code.indexOf(fragment);
    expect(index).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

describe('line boundaries in transpiler 2.0.0-beta', () => {
  test.each([
    ['zero', 'VALUE=0', 'VALUE = 0;'],
    ['number', 'VALUE=42', 'VALUE = 42;'],
    ['string', 'MESSAGE$="Hello"', "MESSAGE$ = 'Hello';"],
    ['addition and subtraction', 'VALUE=10-3+2-1', 'VALUE = 10 - 3 + 2 - 1;'],
    ['unary minus', 'VALUE=-4+6', 'VALUE = -4 + 6;'],
    ['multiplication and division', 'VALUE=12/3*2', 'VALUE = (12 / 3) * 2;'],
    ['operator precedence', 'VALUE=2+3*4', 'VALUE = 2 + 3 * 4;'],
    ['parentheses', 'VALUE=(2+3)*4', 'VALUE = (2 + 3) * 4;'],
    ['negated parentheses', 'VALUE=-(2+3)*4', 'VALUE = -(2 + 3) * 4;'],
    [
      'array index expression',
      'Dim ITEMS(8)\nVALUE=ITEMS((1+2)*2)',
      'VALUE = ITEMS[Math.trunc((1 + 2) * 2)];',
    ],
    [
      'nested function arguments',
      'VALUE=Sin(Cos(1+2))',
      'VALUE = Math.sin(Math.cos(1 + 2));',
    ],
    [
      'nested function and array arguments',
      'Dim ITEMS(8)\nVALUE=Rnd(Sin(ITEMS(2+1)))',
      'VALUE = Math.floor(Math.random() * (Math.sin(ITEMS[Math.trunc(2 + 1)]) + 1));',
    ],
  ])('preserves valid %s expressions', async (_name, source, expected) => {
    const { normalizedJS, translatedCode } = await translate(source);

    expect(normalizedJS).toContain(expected);
    expect(() => new Function(translatedCode)).not.toThrow();
  });

  test.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
    ['CR', '\r'],
  ])('accepts %s boundaries and EOF without a trailing newline', async (_name, newline) => {
    const { normalizedJS } = await translate(
      ['FIRST_VALUE=1', 'SECOND_VALUE=FIRST_VALUE+2'].join(newline),
    );

    expectOnceInOrder(normalizedJS, ['FIRST_VALUE = 1;', 'SECOND_VALUE = FIRST_VALUE + 2;']);
  });

  test.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
    ['CR', '\r'],
  ])('keeps blank lines and comments separate with %s', async (_name, newline) => {
    const { normalizedJS: expected } = await translate('FIRST_VALUE=1:SECOND_VALUE=FIRST_VALUE+2');
    const { normalizedJS } = await translate(
      [
        '',
        "' a comment before the first command",
        'FIRST_VALUE=1 : Rem an inline comment',
        'Rem a full-line comment',
        '',
        'SECOND_VALUE=FIRST_VALUE+2',
        'Rem a comment ending at EOF',
      ].join(newline),
    );

    expect(normalizedJS).toBe(expected);
  });

  test('preserves colon-separated commands and named labels', async () => {
    const { normalizedJS: expected } = await translate(
      'start: FIRST_VALUE=1:SECOND_VALUE=2:finish:THIRD_VALUE=3:last:',
    );
    const { normalizedJS } = await translate(
      'start: FIRST_VALUE=1:SECOND_VALUE=2\nfinish:\nTHIRD_VALUE=3\nlast:',
    );

    expect(normalizedJS).toBe(expected);
    expectOnceInOrder(normalizedJS, ['FIRST_VALUE = 1;', 'SECOND_VALUE = 2;', 'THIRD_VALUE = 3;']);
  });

  test.each([
    ['DO', ['Do', 'BODY_ONE=101', 'BODY_TWO=202', 'Loop'], 'while (true) {'],
    [
      'ELSE',
      ['If 0>1', 'THEN_VALUE=99', 'Else', 'BODY_ONE=101', 'BODY_TWO=202', 'End If'],
      '} else {',
    ],
    ['FOR', ['For I=1 To 2', 'BODY_ONE=101', 'BODY_TWO=202', 'Next I'], 'for (I = 1; I <= 2; I++) {'],
    ['IF', ['If 1>0', 'BODY_ONE=101', 'BODY_TWO=202', 'End If'], 'if (1 > 0) {'],
    [
      'IF KEY STATE',
      ['If Key State($10)', 'BODY_ONE=101', 'BODY_TWO=202', 'End If'],
      'if (currentPressedKey === keyMapping[16]) {',
    ],
    [
      'PROCEDURE',
      ['Procedure PROC_BOUNDARY', 'BODY_ONE=101', 'BODY_TWO=202', 'End Proc'],
      'function PROC_BOUNDARY() {',
    ],
    [
      'REPEAT',
      ['Repeat', 'BODY_ONE=101', 'BODY_TWO=202', 'Until Mouse Key=1'],
      'setInterval(() => { currentTimer = Date.now(); Timer++;',
    ],
    [
      'WHILE',
      ['While Key State($10)', 'BODY_ONE=101', 'BODY_TWO=202', 'Wend'],
      'if (currentPressedKey === keyMapping[16]) {',
    ],
  ])('walks the %s body once and preserves order', async (_name, body, opening) => {
    const lines = ['BEFORE_VALUE=11', ...body, 'AFTER_VALUE=44'];
    const { normalizedJS } = await translate(lines.join('\n'));
    const { normalizedJS: colonJS } = await translate(lines.join(':'));

    expect(normalizedJS).toBe(colonJS);
    expect(normalizedJS).toContain(opening);
    expectOnceInOrder(normalizedJS, [
      'BEFORE_VALUE = 11;',
      'BODY_ONE = 101;',
      'BODY_TWO = 202;',
      'AFTER_VALUE = 44;',
    ]);
  });

  test('preserves nested procedure traversal and restores the root scope', async () => {
    const lines = [
      'ROOT_VALUE=1',
      'SHARED_VALUE=5',
      'Global SHARED_VALUE',
      'Procedure PROC_NESTED[X]',
      'For I=1 To 2',
      'If X>0',
      'LOCAL_VALUE=X+1',
      'SHARED_VALUE=SHARED_VALUE+1',
      'Else',
      'LOCAL_VALUE=X+2',
      'End If',
      'Next I',
      'ROOT_VALUE=ROOT_VALUE+1',
      'End Proc',
      'AFTER_VALUE=7',
      'PROC_NESTED[3]',
    ];
    const { normalizedJS, translatedCode } = await translate(lines.join('\n'));
    const { normalizedJS: colonJS } = await translate(lines.join(':'));

    expect(normalizedJS).toBe(colonJS);
    expect(normalizedJS.match(/let ROOT_VALUE = 0;/g)).toHaveLength(2);
    expect(normalizedJS.match(/let SHARED_VALUE = 0;/g)).toHaveLength(1);
    expect(normalizedJS.match(/let LOCAL_VALUE = 0;/g)).toHaveLength(1);
    expect(normalizedJS.match(/let I = 0;/g)).toHaveLength(1);
    expect(normalizedJS).not.toContain('let X = 0;');
    expect(normalizedJS.indexOf('let AFTER_VALUE = 0;')).toBeLessThan(
      normalizedJS.indexOf('function PROC_NESTED(X) {'),
    );
    expect(normalizedJS).toContain(
      'for (I = 1; I <= 2; I++) { if (X > 0) { let LOCAL_VALUE = 0; LOCAL_VALUE = X + 1; SHARED_VALUE = SHARED_VALUE + 1; } else { LOCAL_VALUE = X + 2; } } ROOT_VALUE = ROOT_VALUE + 1; } AFTER_VALUE = 7; PROC_NESTED(3);',
    );
    expectOnceInOrder(normalizedJS, [
      'ROOT_VALUE = 1;',
      'LOCAL_VALUE = X + 1;',
      'SHARED_VALUE = SHARED_VALUE + 1;',
      'LOCAL_VALUE = X + 2;',
      'ROOT_VALUE = ROOT_VALUE + 1;',
      'AFTER_VALUE = 7;',
      'PROC_NESTED(3);',
    ]);
    expect(() => new Function(translatedCode)).not.toThrow();
  });

  test.each([
    ['operand on the following line', 'A=1+\n2', 'syntaxErrors', { line: 1, column: 4 }],
    ['parentheses spanning lines', 'A=(1\n+2)', 'syntaxErrors', { line: 1, column: 4 }],
    ['an extra number', 'A=1 10', 'syntaxErrors', { line: 1, column: 4 }],
    ['an incomplete Print expression', 'Print 1+', 'syntaxErrors', { line: 1, column: 8 }],
    ['an invalid character', 'A=1@', 'lexicalErrors', { line: 1, column: 3 }],
  ])('returns diagnostics and no JavaScript for %s', async (_name, source, errorKind, position) => {
    const response = await transpile(source);

    expect(response.translatedCode).toBe('');
    expect(response[errorKind].errors.length).toBeGreaterThan(0);
    expect(response[errorKind].errors[0]).toMatchObject(position);
    const otherKind = errorKind === 'syntaxErrors' ? 'lexicalErrors' : 'syntaxErrors';
    expect(response[otherKind].errors).toEqual([]);

    for (const error of response[errorKind].errors) {
      expect(Object.keys(error).sort()).toEqual(['column', 'line', 'msg']);
      expect(error.line).toBeGreaterThanOrEqual(1);
      expect(error.column).toBeGreaterThanOrEqual(0);
      expect(typeof error.msg).toBe('string');
      expect(error.msg.length).toBeGreaterThan(0);
    }
  });

  test.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
    ['CR', '\r'],
  ])('rejects an incomplete expression at a %s boundary', async (_name, newline) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(`A=1+${newline}2`);

    expect(lexicalErrors.errors).toEqual([]);
    expect(syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(syntaxErrors.errors[0]).toMatchObject({ line: 1, column: 4 });
    expect(translatedCode).toBe('');
  });

  test.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('preserves diagnostic positions on later lines with %s', async (_name, newline) => {
    const { lexicalErrors, syntaxErrors, translatedCode } = await transpile(`A=1${newline}B=2@`);

    expect(lexicalErrors.errors[0]).toMatchObject({ line: 2, column: 3 });
    expect(syntaxErrors.errors).toEqual([]);
    expect(translatedCode).toBe('');
  });
});
