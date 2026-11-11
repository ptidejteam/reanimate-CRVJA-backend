import { translate } from './helpers/translate.js';

// ELSE IF: tests another condition when the ones before it are false.
// https://amospromanual.dev/05-04-control-structures.html

test('If, Else If, Else', async () => {
  const javascript = await translate(`
    If A=1
      Curs Off
    Else If A=2
      Curs On
    Else
      Curs Off
    End If
  `);

  expect(javascript).toContain(
    "if (A == 1) { document.getElementById('amos-screen').style.cursor = 'none'; } else if (A == 2) { document.getElementById('amos-screen').style.cursor = 'auto'; } else { document.getElementById('amos-screen').style.cursor = 'none'; }",
  );
});

test('several Else If without Else', async () => {
  const javascript = await translate(`
    If A=1
    Else If A=2
    Else If A=3
    End If
  `);

  expect(javascript).toContain('else if (A == 2)');
  expect(javascript).toContain('else if (A == 3)');
});

test('Else If with a Key State condition', async () => {
  const javascript = await translate(`
    If X=1
      Curs Off
    Else If Key State($45)
      Curs On
    End If
  `);

  expect(javascript).toContain('} else if (currentPressedKey === keyMapping[69]) {');
});

test('Else If after an If Key State', async () => {
  const javascript = await translate(`
    If Key State($45)
      Curs Off
    Else If X=1
      Curs On
    Else
      Curs Off
    End If
  `);

  expect(javascript).toContain(
    "if (currentPressedKey === keyMapping[69]) { document.getElementById('amos-screen').style.cursor = 'none'; } else if (X == 1) { document.getElementById('amos-screen').style.cursor = 'auto'; } else { document.getElementById('amos-screen').style.cursor = 'none'; }",
  );
});
