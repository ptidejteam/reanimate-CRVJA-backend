import { translate } from './helpers/translate.js';

// ON ... PROC: calls the first, second, ... Procedure of a list, from a value.
// https://amospromanual.dev/05-05-procedures.html

test('On X Proc calls the Procedure chosen by X', async () => {
  const javascript = await translate(`
    Procedure FIRST
    End Proc
    Procedure SECOND
    End Proc
    On X Proc FIRST,SECOND
  `);

  expect(javascript).toContain(
    'switch (X) { case 1: await FIRST(); break; case 2: await SECOND(); break; }',
  );
});
