import antlr4 from 'antlr4';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';
import AMOSParser from '../grammar/generated/AMOSParser.js';
import AMCAFLexer from '../extensions/amcaf/generated/AMCAFLexer.js';
import AMCAFParser from '../extensions/amcaf/generated/AMCAFParser.js';
import AMOSErrorListener from '../core/amos-error-listener.js';
import HandlerDispatcher from '../core/handler-dispatcher.js';
import ExpressionTranslator from '../core/expression-translator.js';
import TranslationContext from '../core/translation-context.js';
import Functions from '../commands/functions.js';
import Structures from '../commands/structures.js';
import { normalizeIdentifiers } from '../grammar/normalize-identifiers.js';

const mixedCase = (text) =>
  [...text].map((char, index) => (index % 2 ? char.toLowerCase() : char.toUpperCase())).join('');

function lex(source) {
  const lexer = new AMCAFLexer(new antlr4.InputStream(source));
  const diagnostics = new AMOSErrorListener(source);
  lexer.removeErrorListeners();
  lexer.addErrorListener(diagnostics);
  const tokens = lexer.getAllTokens();
  expect(diagnostics.errors).toEqual([]);
  return tokens;
}

function parse(source, rule, Lexer = AMCAFLexer, Parser = AMCAFParser) {
  const diagnostics = new AMOSErrorListener(source);
  const lexer = new Lexer(new antlr4.InputStream(source));
  lexer.removeErrorListeners();
  lexer.addErrorListener(diagnostics);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new Parser(tokens);
  parser.removeErrorListeners();
  parser.addErrorListener(diagnostics);
  const tree = parser[rule]();
  expect(diagnostics.errors).toEqual([]);
  expect(tokens.LA(1)).toBe(antlr4.Token.EOF);
  normalizeIdentifiers(tree);
  return { tree, tokens: tokens.tokens };
}

function services() {
  const dispatcher = new HandlerDispatcher();
  const expressions = new ExpressionTranslator(dispatcher);
  const context = new TranslationContext(expressions);
  dispatcher.registerHandlers([new Functions(context), new Structures(context)]);
  return { dispatcher, expressions, context };
}

describe('AMCAF keyword convention', () => {
  test('has no anonymous lexer tokens', () => {
    expect(AMCAFLexer.ruleNames.filter((name) => name.startsWith('T__'))).toEqual([]);
  });

  // Imported keywords follow the same convention as extension keywords.
  const keywords = AMCAFLexer.ruleNames.slice(0, AMCAFLexer.ruleNames.indexOf('KEYWORD_BOUNDARY'));
  test.each(keywords)('%s accepts any case and horizontal spacing', (name) => {
    const suffixed = { PI: 'Pi#', FLIP: 'Flip$', LOWER: 'Lower$', UPPER: 'Upper$' };
    const spelling = suffixed[name] ?? name.replaceAll('_', ' ');
    for (const variant of [spelling, spelling.toLowerCase(), mixedCase(spelling)]) {
      for (const separator of [' ', '  ', '\t', ' \t ']) {
        const source = variant.replaceAll(' ', separator);
        expect(lex(source).map((token) => [token.type, token.text])).toEqual([
          [AMCAFLexer[name], source],
        ]);
      }
    }
  });

  test.each(keywords.filter((name) => name.includes('_')))('%s cannot span a newline', (name) => {
    const source = name.replaceAll('_', '\n');
    expect(lex(source).some((token) => token.type === AMCAFLexer[name])).toBe(false);
  });
});

test('normalizes expressions using the imported parser token vocabulary', () => {
  const { tokens } = parse('tUrBo\tDraw value#,0 TO VaLuE#+1,2,1,-1', 'amcafStatement');
  expect(
    tokens.filter((token) => token.type === AMCAFLexer.IDENTIFIER).map((token) => token.text),
  ).toEqual(['VALUE_f', 'VALUE_f']);
});

test.each([
  ['Turbo Draw X Sprite(1),Y Sprite(1) To X Mouse,Y Mouse,Colour(1),-1', 'amcafStatement'],
  ['Sprite Col(A(I),FIRST+1 To LAST-1)', 'expression'],
  ['Upper$(Flip$(Lower$("MiXeD")))', 'expression'],
])('imports the new core command syntax in %s', (source, rule) => {
  parse(source, rule);
});

test('dispatches the same rule from independently generated parsers', () => {
  class Commands {
    enterPlot(ctx) {
      return ctx.expression(0).getText();
    }
  }
  const dispatcher = new HandlerDispatcher([new Commands()]);
  const { tree: core } = parse('Plot 1,2', 'plot', AMOSLexer, AMOSParser);
  const { tree: imported } = parse('Plot 3,4', 'plot');
  expect(imported).not.toBeInstanceOf(AMOSParser.PlotContext);
  expect(dispatcher.get('enter', core)(core)).toBe('1');
  expect(dispatcher.get('enter', imported)(imported)).toBe('3');
});

test('translates imported expressions with core function handlers', () => {
  const { expressions } = services();
  const { tree } = parse('Abs(-(2+1))+Sin(values#((1+2)*3))*3', 'expression');
  expect(expressions.translate(tree)).toBe(
    'Math.abs(-(2 + 1)) + Math.sin(VALUES_f[Math.trunc((1 + 2) * 3)]) * 3',
  );
});

test.each([
  ['x=1 And y<>2', 'X == 1 && Y != 2'],
  ['Key State($10+index)', 'currentPressedKey === keyMapping[16 + INDEX]'],
])('translates imported condition %s by owning rule names', (source, expected) => {
  const { context } = services();
  const structures = new Structures(context);
  const { tree } = parse(source, 'condition');
  expect(structures.ifCondition(tree)).toBe(expected);
});
