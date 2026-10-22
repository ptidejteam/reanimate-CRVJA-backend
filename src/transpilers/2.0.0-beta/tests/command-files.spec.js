import AMOSListener from '../grammar/generated/AMOSListener.js';
import AMOSVisitor from '../grammar/generated/AMOSVisitor.js';
import HandlerDispatcher from '../core/handler-dispatcher.js';
import TranslationContext from '../core/translation-context.js';
import ExpressionTranslator from '../core/expression-translator.js';
import Instructions from '../commands/instructions.js';
import Structures from '../commands/structures.js';
import Functions from '../commands/functions.js';

const dispatcher = new HandlerDispatcher();
const context = new TranslationContext(new ExpressionTranslator(dispatcher));
const handlers = [new Instructions(context), new Structures(context), new Functions(context)];

// The translator calls the methods of commands/ by name (rule `cls` -> enterCls), so a
// method whose name matches no grammar rule, e.g. a typo, would never be called.
const methods = handlers.flatMap((file) =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(file)).filter((name) =>
    /^(enter|exit|visit)[A-Z]/.test(name),
  ),
);

test('every enterX, exitX and visitX method in commands/ matches a grammar rule', () => {
  const unknown = methods.filter(
    (method) => !(method in AMOSListener.prototype) && !(method in AMOSVisitor.prototype),
  );

  expect(unknown).toEqual([]);
});

test('each grammar rule is translated in one command file only', () => {
  const duplicates = methods.filter((method, index) => methods.indexOf(method) !== index);

  expect(duplicates).toEqual([]);
  expect(() => dispatcher.register(handlers)).not.toThrow();
});
