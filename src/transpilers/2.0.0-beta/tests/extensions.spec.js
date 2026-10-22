import { jest } from '@jest/globals';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';
import Amcaf from '../extensions/amcaf/amcaf.js';
import ExtensionLoader from '../extensions/extension-loader.js';
import AmcafTranspiler from '../extensions/amcaf/amcaf-transpiler.js';
import ExtensionStatements from '../extensions/statements.js';
import ProbeTranspiler from './fixtures/extensions/probe/probe-transpiler.js';

const fixtures = new URL('./fixtures/extensions/', import.meta.url);
const line = 'Turbo Draw 0,0 To 3,4,1,-1';
const temporaryDirectories = [];

afterAll(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function translate(source, transpiler = new AMOSTranspiler()) {
  const result = await transpiler.transpile(source);
  expect(result.lexicalErrors.errors).toEqual([]);
  expect(result.syntaxErrors.errors).toEqual([]);
  return result.translatedCode;
}

async function runProbe(source) {
  const transpiler = new AMOSTranspiler({ extensionsDirectory: fixtures });
  const code = await translate(source, transpiler);
  const context = vm.createContext({ probeTrace: [], document: { addEventListener() {} }, Date });
  vm.runInContext(code, context, { timeout: 1000 });
  return context.probeTrace;
}

async function installation() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'amos-extensions-'));
  temporaryDirectories.push(directory);
  await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
  return directory;
}

async function install(directory, name, source) {
  await mkdir(path.join(directory, name));
  await writeFile(path.join(directory, name, `${name}-transpiler.js`), source);
}

test('discovers mini-transpilers on each call and resets translation state', async () => {
  const directory = await installation();
  const transpiler = new AMOSTranspiler({ extensionsDirectory: directory });
  expect((await transpiler.transpile('Probe Trace @ 1')).translatedCode).toBe('');
  const module = new URL('./fixtures/extensions/probe/probe-transpiler.js', import.meta.url).href;
  await install(directory, 'installed', `export { default } from ${JSON.stringify(module)};`);
  const source = 'A=1\nProbe Trace @ A\nA=2\nProbe Trace @ A';
  const first = await translate(source, transpiler);
  expect(first).toContain('recordProbe(0, A);');
  expect(first).toContain('recordProbe(1, A);');
  expect(first.match(/function recordProbe/g)).toHaveLength(1);
  expect(await translate(source, transpiler)).toBe(first);
  expect(await translate(source, new AMOSTranspiler({ extensionsDirectory: directory }))).toBe(
    first,
  );
  await rm(path.join(directory, 'installed/installed-transpiler.js'));
  expect((await transpiler.transpile(source)).translatedCode).toBe('');
});

test.each(['@Ping', 'A=1'])(
  'tries alphabetically and stops at the first success for %s',
  async (source) => {
    const directory = await installation();
    // Create in reverse order so filesystem insertion order cannot select the winner.
    await install(
      directory,
      'zebra',
      `export default class Zebra {
    parse() { throw new Error('Later parser must not run'); }
    translate() {}
  }`,
    );
    await mkdir(path.join(directory, 'ignored'));
    await install(
      directory,
      'alpha',
      `export default class Alpha {
    parse(source) { return ['@Ping', 'A=1'].includes(source) ? {} : null; }
    translate(node, host) { host.output += 'globalThis.ping = true;'; }
  }`,
    );
    const code = await translate(source, new AMOSTranspiler({ extensionsDirectory: directory }));
    expect(code).toContain('globalThis.ping = true;');
  },
);

test.each([
  'export default {};',
  'export default class MissingTranslate { parse() { return null; } }',
  'export default class InvalidRuntime { runtimeSource = 42; parse() { return null; } translate() {} }',
])('reports invalid mini-transpiler modules: %s', async (module) => {
  const directory = await installation();
  await install(directory, 'broken', module);
  await expect(
    new AMOSTranspiler({ extensionsDirectory: directory }).transpile('A=1'),
  ).rejects.toThrow(/mini-transpiler/);
});

test('executes extension statements among AMOS statements in source order', async () => {
  expect(await runProbe('A=1:Probe Trace @ A:A=A+1:Probe Trace @ A')).toEqual([
    [0, 1],
    [1, 2],
  ]);
  const code = await translate(`Screen Open 1,500,500,8,Hires\n${line}\nA=0\nText 5,5,"Hello"`);
  let previous = -1;
  for (const statement of [
    "screenDiv.id = 'amos-screen';",
    "turboDrawLine('turboDraw_0'",
    'A = 0;',
    "textEl.innerText = 'Hello';",
  ]) {
    // Ignore variable declarations in the preamble when locating body assignments.
    const index = code.indexOf(statement, previous + 1);
    expect(index).toBeGreaterThan(previous);
    previous = index;
  }
});

test('preserves inline branches and nested loop/procedure scope', async () => {
  expect(
    await runProbe(`
    ROOT_VALUE=99
    Procedure P[ROOT_VALUE]
      For I=0 To 1
        If I=0 Then Probe Trace @ ROOT_VALUE Else Probe Trace @ ROOT_VALUE+1
      Next I
    End Proc
    P[3]
    Probe Trace @ ROOT_VALUE
  `),
  ).toEqual([
    [0, 3],
    [1, 4],
    [2, 99],
  ]);
});

test.each(['\n', '\r\n', '\r'])(
  'preserves source framing with %j and no trailing newline',
  async (newline) => {
    const source = [
      "' Probe Trace @ 999",
      'Rem Probe Trace @ 998',
      'A=2',
      'Probe Trace @ "Then: Else Rem Turbo Draw"',
      'Probe\tTrace @ Abs((A+1)*2):Probe Trace @ A',
    ].join(newline);
    expect(await runProbe(source)).toEqual([
      [0, 'Then: Else Rem Turbo Draw'],
      [1, 6],
      [2, 2],
    ]);
  },
);

test('does not recognize commands inside names, strings, comments, or core expressions', async () => {
  const extensions = await new ExtensionLoader(fixtures).loadExtensions();
  const source =
    'Probe Traces\nProbe Trace$\nPROBE Trace\nA=Probe Trace\n"Probe Trace @ 1"\nRem Probe Trace @ 2';
  expect(new ExtensionStatements(source, extensions).prepareStatements().statements).toEqual([]);
});

test('tries the next parser after rejection, without invoking translation', () => {
  const rejected = { parse: jest.fn(() => null), translate: jest.fn() };
  const probe = new ProbeTranspiler();
  const translation = jest.spyOn(probe, 'translate');
  const later = { parse: jest.fn(() => ({})), translate: jest.fn() };
  const prepared = new ExtensionStatements('Probe Trace @ 7', [
    rejected,
    probe,
    later,
  ]).prepareStatements();
  expect(prepared.statements[0].extension).toBe(probe);
  expect(rejected.parse).toHaveBeenCalledTimes(1);
  expect(rejected.translate).not.toHaveBeenCalled();
  expect(translation).not.toHaveBeenCalled();
  expect(later.parse).not.toHaveBeenCalled();
});

test('propagates programming exceptions instead of treating them as rejected syntax', async () => {
  const directory = await installation();
  await install(
    directory,
    'broken',
    `export default class Broken {
    parse() { throw new TypeError('Parser bug'); }
    translate() {}
  }`,
  );
  await expect(
    new AMOSTranspiler({ extensionsDirectory: directory }).transpile('A=1'),
  ).rejects.toThrow('Parser bug');
});

test.each([undefined, Promise.resolve({})])('rejects an invalid parse result %#', (result) => {
  expect(() =>
    new ExtensionStatements('A=1', [{ parse: () => result }]).prepareStatements(),
  ).toThrow(/node or null synchronously/);
});

test.each([
  'Turbo Draw 0,0 To 1,1',
  'Turbo Draw 0,0 To 1,1,,2,0',
  `${line} garbage`,
  `${line} @`,
  'Blitter Copy 0,0 To 1,1',
  'Blitter Fill 0,0',
  'Blitter Clear 0,0',
])('rejects incomplete, recovered, lexical, trailing, or unsupported input: %s', (source) => {
  expect(new AmcafTranspiler().parse(source)).toBeNull();
});

test('includes the shared drawing helper once, including without AMCAF statements', async () => {
  expect((await translate('A=1')).match(/function turboDrawLine/g)).toHaveLength(1);
  const code = await translate(`${line}:${line}`);
  expect(code.match(/function turboDrawLine/g)).toHaveLength(1);
});

test('keeps optional extension runtime separate from the shared AMOS runtime', async () => {
  const transpiler = new AMOSTranspiler({ extensionsDirectory: fixtures });
  const unused = await translate('A=1', transpiler);
  expect(unused).not.toContain('function recordProbe');
  expect(unused.match(/function turboDrawLine/g)).toHaveLength(1);
  const used = await translate('Probe Trace @ 1:Probe Trace @ 2', transpiler);
  expect(used.match(/function recordProbe/g)).toHaveLength(1);
  expect(used.match(/function turboDrawLine/g)).toHaveLength(1);
});

test('shares AMOS expression translation across independently generated parsers', async () => {
  const code = await translate(
    'X#=2\nDim A(2)\nA(1)=3\nTurbo Draw Abs(X#),Sin(A(1)) To -2,4+1,1,-1',
  );
  expect(code).toContain(
    "turboDrawLine(\n  'turboDraw_0',\n  Math.abs(X_f),\n  Math.sin(A[Math.trunc(1)]),",
  );
});

test.each([
  'Turbo = 1',
  'Turbo Draw 0,0 To 1,1',
  'Blitter Copy 0,0 To 1,1',
  'Blitter Fill 0,0',
  'Blitter Clear 0,0',
])('falls back to unchanged AMOS behavior for %s', async (source) => {
  const directory = await installation();
  const coreOnly = new AMOSTranspiler({ extensionsDirectory: directory });
  expect(await new AMOSTranspiler().transpile(source)).toEqual(await coreOnly.transpile(source));
});

test('accepts core assignments and the deferred four-operand interpretation without trial diagnostics', async () => {
  expect(await translate('Turbo = 1')).toContain('TURBO = 1;');
  const code = await translate('Turbo Draw 0,0 To 1,1');
  expect(code).not.toContain("turboDrawLine('turboDraw_0'");
});

test.each(['\n', '\r\n', '\r'])(
  'preserves original AMOS diagnostic positions after failed or accepted trials with %j',
  async (newline) => {
    const failed = await new AMOSTranspiler().transpile(`A=1${newline}  ${line} @`);
    expect(failed.lexicalErrors.errors[0]).toMatchObject({ line: 2, column: line.length + 3 });
    expect(failed.translatedCode).toBe('');
    const result = await new AMOSTranspiler().transpile(`${line}${newline}A=@`);
    expect(result.lexicalErrors.errors[0]).toMatchObject({ line: 2, column: 2 });
    expect(result.translatedCode).toBe('');
  },
);

test('recognizes mixed-case inline boundaries and REM without consuming variable names', async () => {
  expect(
    await runProbe(`
      rEm Probe Trace @ 999
      Remember=3
      if REMEMBER=3 tHeN Probe Trace @ remember eLsE Probe Trace @ 0
      if remember=0 THEN Probe Trace @ 0 ELSE Probe Trace @ ReMeMbEr+1
      Probe Trace @ "rEm Then: Else" : REM Probe Trace @ 998
    `),
  ).toEqual([
    [0, 3],
    [3, 4],
    [4, 'rEm Then: Else'],
  ]);
});

test.each(['\n', '\r\n', '\r'])(
  'preserves diagnostic positions after mixed-case compound commands with %j',
  async (newline) => {
    const command = 'tUrBo \t DrAw 0,0 tO 3,4,1,-1';
    const result = await new AMOSTranspiler().transpile(`${command}${newline}score=@`);
    expect(result.lexicalErrors.errors[0]).toMatchObject({ line: 2, column: 6 });
    expect(result.translatedCode).toBe('');
    const failed = await new AMOSTranspiler().transpile(`score=1${newline}  ${command} @`);
    expect(failed.lexicalErrors.errors[0]).toMatchObject({ line: 2, column: command.length + 3 });
    expect(failed.translatedCode).toBe('');
  },
);

test.each([
  `${line} garbage`,
  'Turbo Draw (1,0 To 3,4,1,-1\nA=1',
  `${line}\nA=`,
  `${line}\nIf 1=1\nA=1`,
  `${line}\n@`,
])('never emits any statements for invalid input %j', async (source) => {
  const handler = jest.spyOn(Amcaf.prototype, 'enterTurboDraw');
  try {
    const result = await new AMOSTranspiler().transpile(source);
    expect(result.translatedCode).toBe('');
    expect(result.lexicalErrors.errors.length + result.syntaxErrors.errors.length).toBeGreaterThan(
      0,
    );
    expect(handler).not.toHaveBeenCalled();
  } finally {
    handler.mockRestore();
  }
});
