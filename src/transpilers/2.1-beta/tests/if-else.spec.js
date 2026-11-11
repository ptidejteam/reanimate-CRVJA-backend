import { translate } from './helpers/translate.js';

// IF ... ELSE ... END IF: runs a block when a condition is true.
// https://amospromanual.dev/05-04-control-structures.html

test.each([
  ['a comparison', 'If 1 > 0\nEnd If', 'if (1 > 0) { }'],
  ['a variable', 'If X > 1\nEnd If', 'if (X > 1) { }'],
  ['an array element', 'Dim A(3)\nIf A(1) <> 2\nEnd If', 'if (A[Math.trunc(1)] != 2) { }'],
  [
    'variables and array elements',
    'Dim A(3)\nIf X = 1 and A(2) <= Y\nEnd If',
    'if (X == 1 && A[Math.trunc(2)] <= Y) { }',
  ],
  ['math expressions', 'If 10 + 1 < 11 + 20\nEnd If', 'if (10 + 1 < 11 + 20) { }'],
  [
    'several expressions and operators',
    'If 10 + 1 < 11 + 20 and 1 + 1 > 0 - 1\nEnd If',
    'if (10 + 1 < 11 + 20 && 1 + 1 > 0 - 1) { }',
  ],
  [
    'expressions in brackets',
    'If (2 * 5) > 1 and (3 + 3) > 5\nEnd If',
    'if (2 * 5 > 1 && 3 + 3 > 5) { }',
  ],
  [
    'every side in brackets',
    'If (10 + 1) < (11 + 20) and (1 + 1) > (0 - 1)\nEnd If',
    'if (10 + 1 < 11 + 20 && 1 + 1 > 0 - 1) { }',
  ],
  ['Or', 'If 1 > 0 or 2 < 1\nEnd If', 'if (1 > 0 || 2 < 1) { }'],
  ['And in any case', 'If 1 > 0 AND 2 > 1\nEnd If', 'if (1 > 0 && 2 > 1) { }'],
  ['Or in any case', 'If 1 > 0 OR 2 > 1\nEnd If', 'if (1 > 0 || 2 > 1) { }'],
  ['three comparisons', 'If 1 > 0 and 2 > 1 and 3 > 2\nEnd If', 'if (1 > 0 && 2 > 1 && 3 > 2) { }'],
  ['And before Or', 'If 1 > 0 or 2 > 1 and 3 > 2\nEnd If', 'if (1 > 0 || (2 > 1 && 3 > 2)) { }'],
])('If translates %s', async (name, amos, javascript) => {
  expect(await translate(amos)).toContain(javascript);
});

test('If with Else', async () => {
  const javascript = await translate(`
    If 1 > 0
      Curs Off
    Else
      Curs On
    End If
  `);

  expect(javascript).toContain(
    "if (1 > 0) { document.getElementById('amos-screen').style.cursor = 'none'; } else { document.getElementById('amos-screen').style.cursor = 'auto'; }",
  );
});

test('If with an And condition and Else', async () => {
  const javascript = await translate(`
    If 1 > 0 and 2 > 1
      Curs Off
    Else
      Curs On
    End If
  `);

  expect(javascript).toContain(
    "if (1 > 0 && 2 > 1) { document.getElementById('amos-screen').style.cursor = 'none'; } else { document.getElementById('amos-screen').style.cursor = 'auto'; }",
  );
});
