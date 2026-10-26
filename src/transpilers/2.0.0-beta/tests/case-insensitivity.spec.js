import antlr4 from 'antlr4';
import vm from 'node:vm';
import AMOSLexer from '../grammar/generated/AMOSLexer.js';
import AMOSParser from '../grammar/generated/AMOSParser.js';
import AMOSTranspiler from '../amos-transpiler.js';
import AMOSErrorListener from '../core/amos-error-listener.js';
import { normalizeIdentifiers } from '../grammar/normalize-identifiers.js';

const mixedCase = (text) =>
  [...text].map((char, index) => (index % 2 ? char.toLowerCase() : char.toUpperCase())).join('');

function lex(source) {
  const lexer = new AMOSLexer(new antlr4.InputStream(source));
  const errors = new AMOSErrorListener(source);
  lexer.removeErrorListeners();
  lexer.addErrorListener(errors);
  const tokens = lexer.getAllTokens();
  expect(errors.errors).toEqual([]);
  return tokens;
}

function parse(source, rule = 'program') {
  const lexer = new AMOSLexer(new antlr4.InputStream(source));
  const errors = new AMOSErrorListener(source);
  lexer.removeErrorListeners();
  lexer.addErrorListener(errors);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new AMOSParser(tokens);
  parser.removeErrorListeners();
  parser.addErrorListener(errors);
  const tree = parser[rule]();
  expect(errors.errors).toEqual([]);
  expect(tokens.LA(1)).toBe(antlr4.Token.EOF);
  normalizeIdentifiers(tree);
  return { tree, tokens: tokens.tokens };
}

async function translate(source) {
  const result = await new AMOSTranspiler().transpile(source);
  expect(result.lexicalErrors.errors).toEqual([]);
  expect(result.syntaxErrors.errors).toEqual([]);
  return result.translatedCode;
}

async function run(source, result) {
  const code = await translate(source);
  return vm.runInNewContext(
    `${code}\n${result}`,
    {
      document: { addEventListener() {} },
      Date: { now: () => 1000 },
    },
    { timeout: 1000 },
  );
}

describe('AMOS keyword convention', () => {
  test('has no anonymous lexer tokens', () => {
    expect(AMOSLexer.ruleNames.filter((name) => name.startsWith('T__'))).toEqual([]);
  });

  // Keyword names encode their words; some spellings also have a type suffix.
  const keywords = AMOSLexer.ruleNames.slice(0, AMOSLexer.ruleNames.indexOf('KEYWORD_BOUNDARY'));
  test.each(keywords)('%s accepts any case and horizontal spacing', (name) => {
    const suffixed = { PI: 'Pi#', FLIP: 'Flip$', LOWER: 'Lower$', UPPER: 'Upper$' };
    const spelling = suffixed[name] ?? name.replaceAll('_', ' ');
    for (const variant of [spelling, spelling.toLowerCase(), mixedCase(spelling)]) {
      for (const separator of [' ', '  ', '\t', ' \t ']) {
        const source = variant.replaceAll(' ', separator);
        expect(lex(source).map((token) => [token.type, token.text])).toEqual([
          [AMOSLexer[name], source],
        ]);
      }
    }
  });

  test.each(keywords.filter((name) => name.includes('_')))('%s cannot span a newline', (name) => {
    const source = name.replaceAll('_', '\n');
    expect(lex(source).some((token) => token.type === AMOSLexer[name])).toBe(false);
  });
});

test('all command capitalizations generate the same JavaScript', async () => {
  const source = `Screen Open 0,320,200,16,Lowres
    Dim Values(2)
    For Index=0 To 2
      Values(Index)=Index+1
    Next Index
    If Values(1)=2 And Values(0)<>0
      Draw 0,0 To 3,4
      Draw To 5,6
    End If
    Autoback 1
    Screen Swap`;
  const expected = await translate(source);
  for (const variant of [source.toUpperCase(), source.toLowerCase(), mixedCase(source)]) {
    expect(await translate(variant)).toBe(expected);
  }
});

test('unifies scalar, string, and float variables without changing string contents', async () => {
  const source = `score=1
    SCORE=Score+2
    price#=1.5
    PRICE#=Price#+0.5
    message$="MiXeD/Assets.ABK"
    MESSAGE$=Message$+" M r0,10,2"
    Remember=7`;
  expect(await run(source, '[SCORE, PRICE_f, MESSAGE$, REMEMBER]')).toEqual([
    3,
    2,
    'MiXeD/Assets.ABK M r0,10,2',
    7,
  ]);
  const code = await translate(source);
  expect(code.match(/let SCORE = 0;/g)).toHaveLength(1);
  expect(code.match(/let PRICE_f = 0;/g)).toHaveLength(1);
});

test('unifies array declarations and references across integer, string, and float types', async () => {
  expect(
    await run(
      `
    dim Values(2),Words$(1),Prices#(1)
    values(1)=3
    WORDS$(0)="MiXeD"
    prices#(0)=1.25
    RESULT=VALUES(1)+Prices#(0)
  `,
      '[RESULT, WORDS$[0]]',
    ),
  ).toEqual([4.25, 'MiXeD']);
});

test('unifies procedure names, parameters, and globals while preserving scope', async () => {
  expect(
    await run(
      `
    value=99
    result=0
    global RESULT
    procedure Update[VaLuE]
      VALUE=value+1
      Result=VALUE
    end\tproc
    uPdAtE[3]
  `,
      '[RESULT, VALUE]',
    ),
  ).toEqual([4, 99]);
});

test('unifies DEF FN names, parameters, and calls', async () => {
  expect(await run(`Def Fn Twice(arg)=ARG*2\nresult=Fn tWiCe(3)`, 'RESULT')).toBe(6);
});

test('keeps every capitalization of Timer bound to the existing runtime variable', async () => {
  expect(await run('timer=5\nresult=TIMER+Timer+tImEr', 'RESULT')).toBe(0);
  const code = await translate('result=timer');
  expect(code).toContain('RESULT = Timer;');
  expect(code.match(/let Timer = 0;/g)).toHaveLength(1);
});

test('preserves label definitions and jump targets separately from variable names', () => {
  const { tree, tokens } = parse(`Score:\nscore=1\ngoto Score\ngosub OtherLabel
    on Dispatch(score) gosub Score,OtherLabel`);
  expect(tree.statementList().statement(0).label()).not.toBeNull();
  expect(
    tokens.filter((token) => token.type === AMOSLexer.IDENTIFIER).map((token) => token.text),
  ).toEqual(['Score', 'SCORE', 'Score', 'OtherLabel', 'DISPATCH', 'SCORE', 'Score', 'OtherLabel']);
});

test('distinguishes bracketed calls followed by separators from labels and bare calls', () => {
  const { tree } = parse('MyProc[1]:MyLabel:MyProc');
  const statements = tree.statementList().statement();
  expect(statements[0].procedureCall().IDENTIFIER().getText()).toBe('MYPROC');
  expect(statements[2].label().IDENTIFIER().getText()).toBe('MyLabel');
  expect(statements[3].procedureCall().IDENTIFIER().getText()).toBe('MYPROC');
});

test.each([
  ['onError', 'On Error Goto MyLabel', ['MyLabel']],
  ['resume', 'Resume MyLabel', ['MyLabel']],
  ['resumeLabel', 'Resume Label MyLabel', ['MyLabel']],
  ['restore', 'Restore MyLabel', ['MyLabel']],
  ['onProc', 'On Choice Proc MyProc,OtherProc', ['CHOICE', 'MYPROC', 'OTHERPROC']],
  ['onBreakProc', 'On Break Proc MyProc', ['MYPROC']],
  ['onErrorProc', 'On Error Proc MyProc', ['MYPROC']],
])('%s distinguishes routine names from label references', (rule, source, names) => {
  const { tokens } = parse(source, rule);
  expect(
    tokens.filter((token) => token.type === AMOSLexer.IDENTIFIER).map((token) => token.text),
  ).toEqual(names);
});

test('preserves quoted filenames and AMAL contents through lexing and translation', async () => {
  const source = 'load "Assets/MiXeD.ABK",1\nscript$="M r0,10,2; Jump Label"';
  expect(
    lex(source)
      .filter((token) => token.type === AMOSLexer.STRING)
      .map((token) => token.text),
  ).toEqual(['"Assets/MiXeD.ABK"', '"M r0,10,2; Jump Label"']);
  const code = await translate(source);
  expect(code).toContain('Assets/MiXeD.ABK');
  expect(code).toContain("SCRIPT$ = 'M r0,10,2; Jump Label';");
});

test('uses named arguments after compound OPEN IN and OPEN OUT tokens', async () => {
  const code = await translate('Open\tIn 1,File$\nOpen  Out 2,FILE$');
  expect(code).toContain("openFile('FILE$', 1, 'w');");
  expect(code).toContain("openFile('FILE$', 2, 'r');");
});

test('arithmetic and comparison operators retain their meanings', async () => {
  expect(
    await run(
      `
    value=2+3*4-8/2
    result=0
    if value=10 and value<>0 and value>=10 and value>9 and value<=10 and value<11
      add RESULT,VALUE
    end if
  `,
      'RESULT',
    ),
  ).toBe(10);
});
