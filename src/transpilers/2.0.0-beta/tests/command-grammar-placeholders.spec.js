import { jest } from '@jest/globals';
import antlr4 from 'antlr4';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';
import AMOSParser from '../grammar/generated/AMOSParser.js';
import AMOSErrorListener from '../core/amos-error-listener.js';
import AMOSTranspiler from '../amos-transpiler.js';
import Instructions from '../commands/instructions.js';
import Functions from '../commands/functions.js';
import ReservedVariables from '../commands/reserved-variables.js';

function parse(source, rule = 'program') {
  const diagnostics = new AMOSErrorListener(source);
  const lexer = new AMOSLexer(new antlr4.InputStream(source));
  lexer.removeErrorListeners();
  lexer.addErrorListener(diagnostics);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AMOSParser(tokens);
  parser.removeErrorListeners();
  parser.addErrorListener(diagnostics);
  const tree = parser[rule]();
  return { tree, tokens, diagnostics };
}

function nodesFor(tree, rule) {
  const nodes = [];
  function visit(node) {
    if (node.parser?.ruleNames[node.ruleIndex] === rule) nodes.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
  return nodes;
}

const commands = [
  ['Polygon 0,0 To 10,0 To 10,10', 'polygon'],
  ['Polygon To 10,20', 'polygon'],
  ['Polygon To 10,20 To 30,40 To 50,60', 'polygon'],
  ['Polyline 0,0 To 10,10', 'polyline'],
  ['Polyline To 10,20', 'polyline'],
  ['Polyline To 10,20 To 30,40 To 50,60', 'polyline'],
  ['Polygon A(I)+1,Sin(2) To -3,4*5 To 6,(7+8)', 'polygon'],
  ['Polyline A(I)+1,Sin(2) To -3,4*5 To 6,(7+8)', 'polyline'],
  ['Randomize Timer', 'randomize'],
  ['Randomize Rnd(A(I)+1)*2', 'randomize'],
  ['Degree', 'degree'],
  ['Radian', 'radian'],
  ['RESULT=X Sprite(1)', 'xSpriteFunction'],
  ['RESULT=Y Sprite(A(I)+1)', 'ySpriteFunction'],
  ['RESULT$=Flip$("MiXeD")', 'flipFunction'],
  ['RESULT$=Lower$(TEXT$+"Ab")', 'lowerFunction'],
  ['RESULT$=Upper$(Flip$(Lower$(TEXT$)))', 'upperFunction'],
  ['RESULT=Sprite Col(1)', 'spriteColFunction'],
  ['RESULT=Sprite Col(A(I),FIRST+1 To LAST-1)', 'spriteColFunction'],
  ['RESULT=X Mouse+1', 'xMouse'],
  ['RESULT=Y Mouse*2', 'yMouse'],
  ['X Mouse=Y Mouse+1', 'xMouseAssignment'],
  ['Y Mouse=X Sprite(A(I))+2', 'yMouseAssignment'],
  ['Colour INDEX+1,$A74', 'colour'],
  ['RESULT=Colour(INDEX+1)', 'colourFunction'],
  ['Wait Key', 'waitKey'],
];

test.each(commands)('%s selects the %s command rule', (source, rule) => {
  const { tree, tokens, diagnostics } = parse(source);
  expect(diagnostics.errors).toEqual([]);
  expect(tokens.LA(1)).toBe(antlr4.Token.EOF);
  expect(nodesFor(tree, rule)).toHaveLength(1);
  expect(nodesFor(tree, 'procedureCall')).toHaveLength(0);
});

test('nested string functions keep their own rules and preserve literal contents', () => {
  const { tree, diagnostics } = parse('RESULT$=Upper$(Flip$(Lower$("MiXeD")))');
  expect(diagnostics.errors).toEqual([]);
  for (const rule of ['upperFunction', 'flipFunction', 'lowerFunction']) {
    expect(nodesFor(tree, rule)).toHaveLength(1);
  }
  expect(nodesFor(tree, 'arrayStructure')).toHaveLength(0);
  expect(nodesFor(tree, 'lowerFunction')[0].expression().getText()).toBe('"MiXeD"');
});

test.each([
  'Polygon',
  'Polygon 0,0',
  'Polygon To',
  'Polygon 0,0 To 1',
  'Polygon 0,0 To 1,2 To',
  'Polyline',
  'Polyline 0,0',
  'Polyline To 1',
  'Polyline 0,0 1,2',
  'Polyline 0,0 To 1,2,3',
  'Randomize',
  'Randomize 1,2',
  'Degree 1',
  'Radian 1',
  'RESULT=X Sprite()',
  'RESULT=X Sprite(1,2)',
  'RESULT=Y Sprite(1',
  'RESULT$=Flip$()',
  'RESULT$=Lower$("A","B")',
  'RESULT$=Upper$("A"',
  'RESULT=Sprite Col()',
  'RESULT=Sprite Col(1,2)',
  'RESULT=Sprite Col(1,2 To)',
  'RESULT=Sprite Col(1, To 3)',
  'RESULT=Sprite Col(1,2 To 3,4)',
  'RESULT=X Mouse(1)',
  'RESULT=Y Mouse()',
  'X Mouse=',
  'Y Mouse=1,2',
  'Colour 1',
  'RESULT=Colour()',
  'Wait Key 1',
])('%s reports syntax errors', (source) => {
  const { diagnostics } = parse(source);
  expect(diagnostics.lexicalErrors.errors).toEqual([]);
  expect(diagnostics.syntaxErrors.errors.length).toBeGreaterThan(0);
});

test.each([
  ['X\nSprite(1)', 'xSpriteFunction'],
  ['Y\r\nSprite(1)', 'ySpriteFunction'],
  ['Sprite\nCol(1)', 'spriteColFunction'],
  ['X\nMouse', 'xMouse'],
  ['Y\nMouse=1', 'yMouseAssignment'],
  ['Wait\nKey', 'waitKey'],
])('%s cannot form a %s command across lines', (source, rule) => {
  expect(parse(source, rule).diagnostics.syntaxErrors.errors.length).toBeGreaterThan(0);
});

const placeholders = [
  ['Polygon 0,0 To 1,2', Instructions, 'enterPolygon'],
  ['Polyline To 1,2', Instructions, 'enterPolyline'],
  ['Degree', Instructions, 'enterDegree'],
  ['Radian', Instructions, 'enterRadian'],
  ['RESULT=X Sprite(1)', Functions, 'translateXSpriteFunction'],
  ['RESULT=Y Sprite(1)', Functions, 'translateYSpriteFunction'],
  ['RESULT=Sprite Col(1)', Functions, 'translateSpriteColFunction'],
  ['RESULT=X Mouse', ReservedVariables, 'translateXMouse'],
  ['RESULT=Y Mouse', ReservedVariables, 'translateYMouse'],
  ['X Mouse=10', ReservedVariables, 'enterXMouseAssignment'],
  ['Y Mouse=20', ReservedVariables, 'enterYMouseAssignment'],
];

afterEach(() => jest.restoreAllMocks());

test.each(placeholders)(
  '%s dispatches its logging placeholder',
  async (source, Category, method) => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const handler = jest.spyOn(Category.prototype, method);
    const response = await new AMOSTranspiler().transpile(source);
    expect(response.lexicalErrors.errors).toEqual([]);
    expect(response.syntaxErrors.errors).toEqual([]);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(log.mock.calls).toEqual([['to be implemented']]);
  },
);

test.each(placeholders)(
  '%s has no command behavior beyond logging',
  (_source, Category, method) => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Accessing ctx or context would evaluate arguments or add semantic behavior.
    const unavailable = new Proxy(
      {},
      {
        get() {
          throw new Error('Placeholder accessed translation state');
        },
      },
    );
    expect(Category.prototype[method].call(unavailable, unavailable)).toBeUndefined();
    expect(log.mock.calls).toEqual([['to be implemented']]);
  },
);

test.each(['X', 'Y'])('%s Mouse assignment does not invoke its read handler', async (axis) => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const read = jest.spyOn(ReservedVariables.prototype, `translate${axis}Mouse`);
  const { tree, diagnostics } = parse(`${axis} Mouse=10`);
  expect(diagnostics.errors).toEqual([]);
  expect(nodesFor(tree, `${axis.toLowerCase()}Mouse`)).toHaveLength(0);
  const result = await new AMOSTranspiler().transpile(`${axis} Mouse=10`);
  expect(result.syntaxErrors.errors).toEqual([]);
  expect(read).not.toHaveBeenCalled();
  expect(log.mock.calls).toEqual([['to be implemented']]);
});

test.each([
  ['Colour 1,$A74', Instructions, 'enterColour'],
  ['RESULT=Colour(1)', Functions, 'translateColourFunction'],
])('%s retains its existing placeholder', async (source, Category, method) => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const handler = jest.spyOn(Category.prototype, method);
  const response = await new AMOSTranspiler().transpile(source);
  expect(response.lexicalErrors.errors).toEqual([]);
  expect(response.syntaxErrors.errors).toEqual([]);
  expect(handler).toHaveBeenCalledTimes(1);
  expect(log.mock.calls).toEqual([['To be implemented...']]);
});
