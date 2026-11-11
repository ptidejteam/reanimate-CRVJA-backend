import { translate } from './helpers/translate.js';

// GLOBAL: shares variables with every Procedure. https://amospromanual.dev/05-05-procedures.html

test('a Global variable is the same inside a Procedure', async () => {
  const javascript = await translate(`
    SHARED_VALUE = 55
    Global SHARED_VALUE
    Procedure PROC_UPDATE
      SHARED_VALUE = 56
    End Proc
  `);

  // Declared once for the program, and not again as a local of the Procedure.
  expect(javascript).toContain('let SHARED_VALUE = 0;');
  expect(javascript).not.toContain('let SHARED_VALUE = 0; SHARED_VALUE = 56;');
  expect(javascript).toContain('SHARED_VALUE = 55;');
  expect(javascript).toContain('SHARED_VALUE = 56;');
});
