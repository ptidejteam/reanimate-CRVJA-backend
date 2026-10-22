import antlr4 from 'antlr4';
import HandlerDispatcher from '../core/handler-dispatcher.js';
import ExpressionTranslator from '../core/expression-translator.js';
import TranslationContext from '../core/translation-context.js';
import AMOSTranslator from '../core/amos-translator.js';
import Functions from '../commands/functions.js';
import Instructions from '../commands/instructions.js';
import Structures from '../commands/structures.js';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';
import AMOSParser from '../grammar/generated/AMOSParser.js';
import AMOSErrorListener from '../core/amos-error-listener.js';
import { normalizeIdentifiers } from '../grammar/normalize-identifiers.js';

function parse(source, rule) {
  const diagnostics = new AMOSErrorListener(source);
  const lexer = new AMOSLexer(new antlr4.InputStream(source));
  lexer.removeErrorListeners();
  lexer.addErrorListener(diagnostics);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AMOSParser(tokens);
  parser.removeErrorListeners();
  parser.addErrorListener(diagnostics);
  const tree = parser[rule]();
  expect(diagnostics.errors).toEqual([]);
  expect(tokens.LA(1)).toBe(antlr4.Token.EOF);
  normalizeIdentifiers(tree);
  return tree;
}

function services() {
  const dispatcher = new HandlerDispatcher();
  const expressions = new ExpressionTranslator(dispatcher);
  const context = new TranslationContext(expressions);
  dispatcher.register([new Instructions(context), new Structures(context), new Functions(context)]);
  return { dispatcher, expressions, context };
}

test('binds handlers to their instances and keeps enter, exit, and visit independent', () => {
  class Commands {
    constructor(context) {
      this.context = context;
      this.expressions = context.expressions;
    }

    calls = 0;

    enterPlot() {
      this.calls++;
      this.context.emit(`enter ${this.calls};`);
    }

    exitPlot() {
      this.context.emit('exit;');
    }

    visitPlot() {
      return this.calls;
    }
  }

  const context = new TranslationContext();
  const commands = new Commands(context);
  const dispatcher = new HandlerDispatcher([commands]);
  const node = parse('Plot 1,2', 'plot');
  const enter = dispatcher.get('enter', node);
  enter(node);
  enter(node);
  dispatcher.get('exit', node)(node);
  expect(dispatcher.get('visit', node)(node)).toBe(2);
  expect(context.output).toBe('enter 1;enter 2;exit;');
});

test('discovers inherited methods while respecting overrides on the same handler', () => {
  class Parent {
    enterPlot() {
      return 'parent';
    }
    exitPlot() {
      return 'exit';
    }
  }
  class Child extends Parent {
    enterPlot() {
      return 'child';
    }
  }
  const dispatcher = new HandlerDispatcher([new Child()]);
  const node = parse('Plot 1,2', 'plot');
  expect(dispatcher.get('enter', node)(node)).toBe('child');
  expect(dispatcher.get('exit', node)(node)).toBe('exit');
});

test('rejects duplicate phase/rule handlers inside one dispatcher', () => {
  class First {
    enterPlot() {}
  }
  class Second {
    enterPlot() {}
  }
  expect(() => new HandlerDispatcher([new First(), new Second()])).toThrow(
    'Duplicate enter handler for rule "plot"',
  );
});

test('ignores traversal rules that have no semantic handler', () => {
  const { context, dispatcher } = services();
  const listener = new AMOSTranslator(context, dispatcher);
  const node = parse('', 'program');
  listener.enterEveryRule(node);
  listener.exitEveryRule(node);
  expect(context.output).toBe('');
});

test('translates nested expressions directly without constructing a statement listener', () => {
  const { expressions, context } = services();
  const node = parse('Sin(Abs(-(x#+1))+values((1+2)*3))', 'expression');
  expect(expressions.translate(node)).toBe(
    'Math.sin(Math.abs(-(X_f + 1)) + VALUES[Math.trunc((1 + 2) * 3)])',
  );
  expect(context.output).toBe('');
});

test('handles missing expressions, expression lists, and terminals explicitly', () => {
  const { expressions } = services();
  const first = parse('1+2', 'expression');
  const second = parse('Abs(-3)', 'expression');
  expect(expressions.translate(null)).toBe('');
  expect(expressions.translate(undefined)).toBe('');
  expect(expressions.translate([first, second])).toEqual(['1 + 2', 'Math.abs(-3)']);
  expect(expressions.translate(first.term(0).factor(0).NUMBER())).toBe('1');
});

test('reports a missing required expression handler instead of returning undefined', () => {
  const expressions = new ExpressionTranslator(new HandlerDispatcher());
  const node = parse('Abs(1)', 'expression');
  expect(() => expressions.translate(node)).toThrow('No expression handler for rule "absFunction"');
});

describe('AMOS expressions and conditions', () => {
  test('translates expressions with core function handlers', () => {
    const { expressions } = services();
    const node = parse('Abs(-2)+Sin(values#(1))*3', 'expression');
    expect(expressions.translate(node)).toBe(
      'Math.abs(-2) + Math.sin(VALUES_f[Math.trunc(1)]) * 3',
    );
  });

  test.each([
    ['x=1 And y<>2', 'X == 1 && Y != 2'],
    ['Key State($10+index)', 'currentPressedKey === keyMapping[16 + INDEX]'],
  ])('translates condition %s by owning rule names', (source, expected) => {
    const { context } = services();
    const structures = new Structures(context);
    const node = parse(source, 'condition');
    expect(structures.ifCondition(node)).toBe(expected);
  });
});

test('keeps program state local to one context', () => {
  const first = services().context;
  const second = services().context;
  first.declareVariable('VALUE');
  first.incrementCurrentLoop();
  first.colorMapping[0] = 'changed';
  expect(second.globalVariables).toBe('');
  expect(second.currentScope).toEqual({});
  expect(second.currentLoop).toBe(0);
  expect(second.colorMapping[0]).toBe('rgb(0,0,0)');
});
