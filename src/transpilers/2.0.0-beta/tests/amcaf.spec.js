import { jest } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import AMOSTranspiler from '../AMOSTranspiler.js';

async function translate(source, transpiler = new AMOSTranspiler()) {
  const { lexicalErrors, syntaxErrors, translatedCode } = await transpiler.transpile(source);
  expect(lexicalErrors.errors).toEqual([]);
  expect(syntaxErrors.errors).toEqual([]);
  return translatedCode;
}

// Only the DOM operations used by these programs are needed; timers run bounded frames.
async function run(source, { strict = true, random = jest.fn(() => 0.5), frames = 0 } = {}) {
  class Element {
    constructor() {
      this.id = '';
      this.style = {};
      this.children = [];
    }

    appendChild(child) {
      this.children.push(child);
      child.parent = this;
    }

    remove() {
      this.parent.children = this.parent.children.filter((child) => child !== this);
    }

    set innerHTML(value) {
      this.children = [];
    }
  }

  const host = new Element();
  host.id = 'game-container';
  const created = [];
  const find = (element, id) => {
    if (element.id === id) return element;
    return element.children.map((child) => find(child, id)).find(Boolean) || null;
  };
  const screen = () => find(host, 'amos-screen');
  const snapshots = [];
  const capture = () => {
    snapshots.push(
      screen().children.map((line) => ({
        id: line.id,
        style: { ...line.style },
        indexPlacer: line.indexPlacer,
      })),
    );
  };
  const intervals = [];
  const frameLimit = new Error('Test frame limit');
  const math = Object.create(Math);
  math.random = random;
  const context = vm.createContext({
    Math: math,
    Date,
    document: {
      getElementById: (id) => find(host, id),
      createElement: () => {
        const element = new Element();
        created.push(element);
        return element;
      },
      addEventListener() {},
    },
    setTimeout: (callback) => {
      capture();
      if (snapshots.length >= frames) throw frameLimit;
      callback();
    },
    setInterval: (callback) => intervals.push(callback),
  });
  const initialGlobals = Object.keys(context);
  const translatedCode = await translate(source);
  const completion = vm.runInContext(
    `(async () => { ${strict ? '"use strict";' : ''}\n${translatedCode}\n})()`,
    context,
    { timeout: 1000 },
  );
  try {
    await completion;
  } catch (error) {
    if (!frames || error !== frameLimit) throw error;
  }
  for (let frame = 0; frame < frames && intervals.length; frame++) {
    intervals.forEach((callback) => callback());
    capture();
  }

  return { screen: screen(), created, snapshots, context, initialGlobals, random };
}

const screenOpen = 'Screen Open 0,320,256,8,Lowres\n';

describe('Turbo Draw', () => {
  test.each([
    ['negative coordinate', '', '-10', '-10px'],
    ['decimal coordinate', '', '0.5', '0.5px'],
    ['arithmetic operand', 'X=2\n', 'X+1', '3px'],
    ['array operand', 'Dim A(3)\nA(1)=2\n', 'A(1)', '2px'],
    ['function operand', '', 'Qcos(0,2)', '2px'],
  ])('executes a %s without leaking globals', async (_name, setup, operand, expectedLeft) => {
    const { screen, context, initialGlobals } = await run(
      `${screenOpen}${setup}Turbo Draw ${operand},0 To 3,4,1,-1`,
    );
    expect(screen.children).toHaveLength(1);
    expect(screen.children[0].style.left).toBe(expectedLeft);
    expect(Number.parseFloat(screen.children[0].style.width)).toBeGreaterThan(0);
    expect(Object.keys(context)).toEqual(initialGlobals);
  });

  test('preserves arithmetic grouping and line styling', async () => {
    const { screen } = await run(`${screenOpen}
      X=2
      Turbo Draw X+1,-2.5 To 10-X*3,-2.5+4,2,-2
    `);
    const line = screen.children[0];
    expect(line.style).toEqual({
      position: 'absolute',
      borderRadius: '1px',
      transformOrigin: '0 0',
      backgroundColor: 'rgb(255,0,0)',
      left: '3px',
      top: '-2.5px',
      width: `${Math.sqrt(17)}px`,
      height: '2px',
      transform: `rotate(${Math.atan2(4, 1) * (180 / Math.PI)}deg)`,
      borderColor: 'rgb(255,0,0)',
      zIndex: 998,
    });
    expect(line.indexPlacer).toBe(998);
  });

  test('evaluates all six operands exactly once in source order', async () => {
    const random = jest.fn();
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach((value) => random.mockReturnValueOnce(value));
    const { screen } = await run(
      `${screenOpen}Turbo Draw Rnd(9),Rnd(9) To Rnd(9),Rnd(9),Rnd(9),Rnd(9)`,
      { random },
    );
    const line = screen.children[0];
    expect(random).toHaveBeenCalledTimes(6);
    expect(line.style.left).toBe('1px');
    expect(line.style.top).toBe('2px');
    expect(line.style.width).toBe(`${Math.sqrt(8)}px`);
    expect(line.style.transform).toBe('rotate(45deg)');
    expect(line.style.backgroundColor).toBe('rgb(255,255,0)');
    expect(line.style.borderColor).toBe('rgb(255,255,0)');
    expect(line.style.zIndex).toBe(1006);
    expect(line.indexPlacer).toBe(1006);
  });

  test('produces deterministic IDs and resets them on repeated translations', async () => {
    const source = 'Turbo Draw 0,0 To 3,4,1,-1\nTurbo Draw 0,0 To 3,4,1,-1';
    const transpiler = new AMOSTranspiler();
    const first = await translate(source, transpiler);
    expect(await translate(source, transpiler)).toBe(first);
    expect(await translate(source)).toBe(first);
    expect(
      [...first.matchAll(/turboDrawLine\(\s*'(turboDraw_\d+)'/g)].map((match) => match[1]),
    ).toEqual(['turboDraw_0', 'turboDraw_1']);
  });

  test('keeps separate statements distinct even when their operand text matches', async () => {
    const { screen } = await run(`${screenOpen}
      X=0 : Z=-1
      Turbo Draw X,0 To 3,4,1,Z
      X=10 : Z=-2
      Turbo Draw X,0 To 3,4,1,Z
    `);
    expect(screen.children.map((line) => line.id)).toEqual(['turboDraw_0', 'turboDraw_1']);
    expect(screen.children.map((line) => line.style.left)).toEqual(['0px', '10px']);
    expect(screen.children.map((line) => line.style.zIndex)).toEqual([999, 998]);
  });

  test('reuses a statement across iterations and updates coordinates, color, and layer', async () => {
    const { screen, created } = await run(`${screenOpen}
      For I=0 To 1
        Turbo Draw I*3,0 To I*3+3,4,I+1,-I
      Next I
    `);
    expect(screen.children).toHaveLength(1);
    expect(created.filter((element) => element.id.startsWith('turboDraw_'))).toHaveLength(1);
    expect(screen.children[0].style.left).toBe('3px');
    expect(screen.children[0].style.width).toBe('5px');
    expect(screen.children[0].style.backgroundColor).toBe('rgb(255,0,0)');
    expect(screen.children[0].style.zIndex).toBe(999);
    expect(screen.children[0].indexPlacer).toBe(999);
  });

  test('executes different branches without sharing bindings or line IDs', async () => {
    const { screen } = await run(`${screenOpen}
      For I=0 To 1
        If I=0
          Turbo Draw 0,0 To 3,4,1,-1
        Else
          Turbo Draw 0,0 To 3,4,1,-2
        End If
      Next I
    `);
    expect(screen.children.map((line) => line.id)).toEqual(['turboDraw_0', 'turboDraw_1']);
    expect(screen.children.map((line) => line.style.zIndex)).toEqual([999, 998]);
  });

  test.each(['Cls', 'Blitter Clear 0,0,0,0 To 320,256'])(
    'recreates a statement after %s removes its line',
    async (clear) => {
      const { screen, created } = await run(`${screenOpen}
        For I=0 To 1
          ${clear}
          Turbo Draw I,0 To 3,4,1,-1
        Next I
      `);
      const lines = created.filter((element) => element.id === 'turboDraw_0');
      expect(lines).toHaveLength(2);
      expect(screen.children).toEqual([lines[1]]);
      expect(screen.children[0].style.left).toBe('1px');
    },
  );
});

describe('AMCAF trigonometry', () => {
  test.each([
    [0, 256, 0],
    [256, 0, 256],
    [512, -256, 0],
    [768, 0, -256],
    [1024, 256, 0],
  ])('uses a 1024-unit revolution at angle %i', async (angle, cosine, sine) => {
    const { screen } = await run(
      `${screenOpen}Turbo Draw Qcos(${angle},256),Qsin(${angle},256) To 0,0,1,-1`,
    );
    expect(screen.children[0].style.left).toBe(`${cosine}px`);
    expect(screen.children[0].style.top).toBe(`${sine}px`);
    expect(screen.children[0].style.width).toBe('256px');
  });

  test('translates radius and angle expressions', async () => {
    const { screen } = await run(`${screenOpen}
      Dim R(2) : R(1)=10
      Turbo Draw Qcos(128+128,R(1)+2),Qsin(128+128,R(1)+2) To 0,0,1,-1
    `);
    expect(screen.children[0].style.left).toBe('0px');
    expect(screen.children[0].style.top).toBe('12px');
  });
});