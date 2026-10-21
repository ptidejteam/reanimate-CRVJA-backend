import CRVJAListener from '../grammar/generated/CRVJAListener.js';
import CRVJAVisitor from '../grammar/generated/CRVJAVisitor.js';
import AMOSTranslator from '../amos-translator.js';

// The translator calls the methods of commands/ by name (rule `cls` -> enterCls), so a
// method whose name matches no grammar rule, e.g. a typo, would never be called.
const methods = new AMOSTranslator().commandFiles.flatMap((file) =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(file)).filter((name) =>
    /^(enter|exit|visit)[A-Z]/.test(name),
  ),
);

test('every enterX, exitX and visitX method in commands/ matches a grammar rule', () => {
  const unknown = methods.filter(
    (method) => !(method in CRVJAListener.prototype) && !(method in CRVJAVisitor.prototype),
  );

  expect(unknown).toEqual([]);
});

test('each grammar rule is translated in one command file only', () => {
  const duplicates = methods.filter((method, index) => methods.indexOf(method) !== index);

  expect(duplicates).toEqual([]);
});
