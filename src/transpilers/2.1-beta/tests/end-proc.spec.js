import { translate } from './helpers/translate.js';

// END PROC: the end of a Procedure. https://amospromanual.dev/05-05-procedures.html

test('End Proc closes the Procedure', async () => {
  const javascript = await translate('Procedure PROC_RESET\nEnd Proc\nPROC_RESET');

  expect(javascript).toContain('async function PROC_RESET() {}');
  expect(javascript).toContain('await PROC_RESET();');
});
