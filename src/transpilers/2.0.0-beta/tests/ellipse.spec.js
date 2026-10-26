import { jest } from '@jest/globals';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

const screenOpen = 'Screen Open 0,320,200,16,Lowres\n';

async function translate(source) {
  const response = await new AMOSTranspiler().transpile(source);
  expect(response.lexicalErrors.errors).toEqual([]);
  expect(response.syntaxErrors.errors).toEqual([]);
  return response.translatedCode;
}

// Record completed drawing operations, rather than matching emitted JavaScript.
async function run(source, { openScreen = true, random = jest.fn(() => 0.5) } = {}) {
  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.id = '';
      this.style = {};
      this.children = [];
      this.paintings = [];
      this.width = 300;
      this.height = 150;
    }

    get clientWidth() {
      return parseInt(this.style.width, 10) || 0;
    }

    get clientHeight() {
      return parseInt(this.style.height, 10) || 0;
    }

    appendChild(child) {
      this.children.push(child);
      child.parent = this;
      return child;
    }

    set innerHTML(value) {
      expect(value).toBe('');
      this.children.forEach((child) => {
        child.parent = null;
      });
      this.children = [];
    }

    getContext(type) {
      expect(this.tagName).toBe('canvas');
      expect(type).toBe('2d');
      const canvas = this;
      let path = [];
      return {
        beginPath() {
          path = [];
        },
        ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
          expect(
            [x, y, radiusX, radiusY, rotation, startAngle, endAngle].every(Number.isFinite),
          ).toBe(true);
          path.push({ x, y, radiusX, radiusY, rotation, startAngle, endAngle });
        },
        stroke() {
          canvas.paintings.push({
            kind: 'stroke',
            path: [...path],
            colour: this.strokeStyle,
            lineWidth: this.lineWidth,
          });
        },
        fill() {
          canvas.paintings.push({ kind: 'fill', path: [...path] });
        },
      };
    }
  }

  const host = new Element('div');
  host.id = 'game-container';
  const created = [];
  const find = (element, id) =>
    element.id === id
      ? element
      : element.children.map((child) => find(child, id)).find(Boolean) || null;
  const math = Object.create(Math);
  math.random = random;
  let time = 1000;
  const context = vm.createContext({
    Math: math,
    Date: { now: () => (time += 100) },
    document: {
      addEventListener() {},
      getElementById: (id) => find(host, id),
      createElement: (tagName) => {
        const element = new Element(tagName);
        created.push(element);
        return element;
      },
    },
  });
  const code = await translate((openScreen ? screenOpen : '') + source);
  let error;
  try {
    vm.runInContext(`"use strict";\n${code}`, context, { timeout: 1000 });
  } catch (caught) {
    error = caught;
  }
  return {
    error,
    context,
    host,
    created,
    random,
    screen: find(host, 'amos-screen'),
    cursor: Array.from(vm.runInContext('[graphicCursorX, graphicCursorY]', context)),
    canvases: created.filter((element) => element.tagName === 'canvas'),
  };
}

function outlines(result) {
  expect(result.error).toBeUndefined();
  return result.canvases.flatMap((canvas) =>
    canvas.paintings.flatMap((painting) => {
      expect(painting.kind).toBe('stroke');
      expect(painting.lineWidth).toBe(1);
      expect(canvas.style.backgroundColor).toBeUndefined();
      return painting.path.map((arc) => ({
        x: arc.x + parseFloat(canvas.style.left),
        y: arc.y + parseFloat(canvas.style.top),
        radiusX: arc.radiusX,
        radiusY: arc.radiusY,
        rotation: arc.rotation,
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        colour: painting.colour,
      }));
    }),
  );
}

describe('ELLIPSE syntax and operands', () => {
  test.each([
    ['Ellipse 100,80,20,10', 100, 80],
    ['Ellipse ,80,20,10', 60, 80],
    ['Ellipse 100,,20,10', 100, 70],
    ['Ellipse ,,20,10', 60, 70],
    ['eLlIpSe\t100 , 80 , 20 , 10', 100, 80],
  ])('%s preserves each parameter position', async (source, x, y) => {
    const result = await run(`Draw 1,2 To 60,70\n${source}`);
    expect(outlines(result)).toEqual([expect.objectContaining({ x, y, radiusX: 20, radiusY: 10 })]);
    expect(result.cursor).toEqual([x, y]);
  });

  test('accepts arrays, variables, and nested numeric expressions', async () => {
    const result = await run(`
      Dim A(3)
      A(0)=10 : A(1)=20 : A(2)=30 : A(3)=40
      Ellipse Abs(-A(0)),A(1)+1,Max(A(2),5),Sqr(A(3)*A(3))
    `);
    expect(outlines(result)).toEqual([
      expect.objectContaining({ x: 10, y: 21, radiusX: 30, radiusY: 40 }),
    ]);
  });

  test('preserves fractional numeric expressions', async () => {
    const result = await run('Ellipse 10.5,20.25,3.5,4.75');
    expect(outlines(result)).toEqual([
      expect.objectContaining({ x: 10.5, y: 20.25, radiusX: 3.5, radiusY: 4.75 }),
    ]);
  });

  test.each([
    'Ellipse',
    'Ellipse 10,20,30',
    'Ellipse ,,30',
    'Ellipse 10,20,,40',
    'Ellipse 10,20,30,',
    'Ellipse 10,20,30,40,50',
    'Ellipse 10 20,30,40',
    'Ellipse 10,20 30,40',
    'Ellipse ,,,',
  ])('rejects invalid syntax: %s', async (source) => {
    const response = await new AMOSTranspiler().transpile(source);
    expect(response.syntaxErrors.errors.length).toBeGreaterThan(0);
    expect(response.translatedCode).toBe('');
  });
});

describe('ELLIPSE execution', () => {
  test('draws the manual example as two unfilled outlines with the same center', async () => {
    const result = await run('Ellipse 100,100,50,20\nEllipse ,,20,50');
    expect(outlines(result)).toEqual([
      {
        x: 100,
        y: 100,
        radiusX: 50,
        radiusY: 20,
        rotation: 0,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        colour: 'rgb(255,255,255)',
      },
      {
        x: 100,
        y: 100,
        radiusX: 20,
        radiusY: 50,
        rotation: 0,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        colour: 'rgb(255,255,255)',
      },
    ]);
    expect(result.screen.children).toEqual(result.canvases);
    expect(result.cursor).toEqual([100, 100]);
  });

  test('uses the current ink on every draw and retains earlier drawing', async () => {
    const result = await run('Plot 10,10\nInk 2\nEllipse 50,50,20,10\nInk 3\nEllipse ,,10,20');
    expect(outlines(result).map((outline) => outline.colour)).toEqual([
      'rgb(255,0,0)',
      'rgb(0,255,0)',
    ]);
    expect(result.screen.children).toHaveLength(3);
    expect(result.screen.children[0].tagName).toBe('div');
    expect(result.canvases.every((canvas) => Number(canvas.style.zIndex) === 10)).toBe(true);
  });

  test('uses the palette colour rather than a hardcoded drawing colour', async () => {
    const result = await run('Palette $000,$F0F\nInk 1\nEllipse 50,50,20,10');
    expect(outlines(result)[0].colour).toBe('rgb(255, 0, 255)');
  });

  test('starts omitted coordinates at the default graphics cursor', async () => {
    const result = await run('Ellipse ,,10,5');
    expect(outlines(result)[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }));
    expect(result.cursor).toEqual([0, 0]);
  });

  test('distinguishes an explicit zero from an omitted coordinate', async () => {
    const result = await run('Ellipse 100,80,10,5\nEllipse 0,,10,5\nEllipse ,0,10,5');
    expect(outlines(result).map(({ x, y }) => [x, y])).toEqual([
      [100, 80],
      [0, 80],
      [0, 0],
    ]);
    expect(result.cursor).toEqual([0, 0]);
  });

  test('shares the cursor with DRAW and DRAW TO', async () => {
    const result = await run(
      'Draw 1,2 To 50,60\nEllipse ,,10,5\nEllipse 80,90,10,5\nDraw To 100,110',
    );
    expect(outlines(result).map(({ x, y }) => [x, y])).toEqual([
      [50, 60],
      [80, 90],
    ]);
    const line = result.screen.children.at(-1);
    expect(line.style.left).toBe('80px');
    expect(line.style.top).toBe('90px');
    expect(result.cursor).toEqual([100, 110]);
  });

  test('evaluates every supplied operand once, in source order', async () => {
    const random = jest
      .fn()
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4);
    const result = await run('Ellipse Rnd(99),Rnd(99),Rnd(99)+1,Rnd(99)+1', { random });
    expect(outlines(result)[0]).toEqual(
      expect.objectContaining({ x: 10, y: 20, radiusX: 31, radiusY: 41 }),
    );
    expect(random).toHaveBeenCalledTimes(4);
  });

  test('evaluates changing operands on every loop iteration', async () => {
    const result = await run('For I=1 To 3\nEllipse I*20,30,5+I,4\nNext I');
    expect(outlines(result).map(({ x, radiusX }) => [x, radiusX])).toEqual([
      [20, 6],
      [40, 7],
      [60, 8],
    ]);
    expect(result.screen.children).toHaveLength(3);
  });

  test('works in repeated procedure calls without leaking globals', async () => {
    const procedure = 'Procedure PAINT_ELLIPSE[X]\nEllipse X,50,10,5\nEnd Proc';
    const beforeCalls = await run(procedure);
    const result = await run(`${procedure}\nPAINT_ELLIPSE[20]\nPAINT_ELLIPSE[40]`);
    expect(outlines(result).map((outline) => outline.x)).toEqual([20, 40]);
    expect(Object.keys(result.context).sort()).toEqual(Object.keys(beforeCalls.context).sort());
  });

  test('draws to the current screen after full-screen CLS', async () => {
    const result = await run('Ellipse 50,60,10,5\nCls\nEllipse ,,20,10');
    expect(outlines(result)).toHaveLength(2);
    expect(result.screen.children).toEqual([result.canvases[1]]);
    expect(result.canvases[0].parent).toBeNull();
    expect(result.cursor).toEqual([50, 60]);
  });

  test.each(['Ellipse 0,0,20,10', 'Ellipse 319,199,20,10', 'Ellipse 160,100,10000,10000'])(
    'bounds canvas allocation to the screen: %s',
    async (source) => {
      const result = await run(source);
      expect(outlines(result)).toHaveLength(1);
      const canvas = result.canvases[0];
      const left = parseInt(canvas.style.left, 10);
      const top = parseInt(canvas.style.top, 10);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
      expect(left + canvas.width).toBeLessThanOrEqual(320);
      expect(top + canvas.height).toBeLessThanOrEqual(200);
    },
  );

  test.each([
    [-100, -100],
    [500, 300],
  ])('updates an off-screen center (%i,%i) without allocating a canvas', async (x, y) => {
    const result = await run(`Ellipse ${x},${y},10,5`);
    expect(result.error).toBeUndefined();
    expect(result.canvases).toEqual([]);
    expect(result.cursor).toEqual([x, y]);
  });

  test.each([
    'Ellipse 10,20,0,5',
    'Ellipse 10,20,5,0',
    'Ellipse 10,20,-1,5',
    'Ellipse 10,20,5,-1',
    'Ellipse Ln(-1),20,10,5',
    'Ellipse 10,1/0,10,5',
    'Ellipse 10,20,Sqr(-1),5',
    'Ellipse 10,20,5,Exp(1000)',
    'Ellipse "bad",20,10,5',
  ])('rejects invalid values without changing cursor or drawing: %s', async (source) => {
    const result = await run(`Ellipse 80,60,10,5\n${source}`);
    expect(result.error?.message).toMatch(/^ELLIPSE:/);
    expect(result.cursor).toEqual([80, 60]);
    expect(result.canvases).toHaveLength(1);
    expect(result.screen.children).toEqual(result.canvases);
  });

  test('reports a missing screen without changing cursor or DOM', async () => {
    const result = await run('Ellipse 10,20,10,5', { openScreen: false });
    expect(result.error?.message).toBe('ELLIPSE: screen is not open');
    expect(result.cursor).toEqual([0, 0]);
    expect(result.created).toEqual([]);
    expect(result.host.children).toEqual([]);
  });
});
