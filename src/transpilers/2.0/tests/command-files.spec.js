import AMOSParser from '../grammar/generated/AMOSParser.js';
import HandlerDispatcher from '../core/handler-dispatcher.js';
import TranslationContext from '../core/translation-context.js';
import ExpressionTranslator from '../core/expression-translator.js';
import Instructions from '../commands/instructions.js';
import Structures from '../commands/structures.js';
import Functions from '../commands/functions.js';
import ReservedVariables from '../commands/reserved-variables.js';

const dispatcher = new HandlerDispatcher();
const context = new TranslationContext(new ExpressionTranslator(dispatcher));
const handlers = [
  new Instructions(context),
  new Structures(context),
  new Functions(context),
  new ReservedVariables(context),
];

// The translator calls the methods of commands/ by name (rule `cls` -> enterCls), so a
// method whose name matches no grammar rule, e.g. a typo, would never be called.
const methods = handlers.flatMap((file) =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(file)).filter((name) =>
    /^(enter|exit|translate)[A-Z]/.test(name),
  ),
);

test('every enterX, exitX and translateX method in commands/ matches a grammar rule', () => {
  const rules = new Set(AMOSParser.ruleNames);
  const unknown = methods.filter((method) => {
    const suffix = method.replace(/^(enter|exit|translate)/, '');
    const rule = suffix[0].toLowerCase() + suffix.slice(1);
    return !rules.has(rule);
  });

  expect(unknown).toEqual([]);
});

test('each grammar rule is translated in one command file only', () => {
  const duplicates = methods.filter((method, index) => methods.indexOf(method) !== index);

  expect(duplicates).toEqual([]);
  expect(() => dispatcher.registerHandlers(handlers)).not.toThrow();
});
