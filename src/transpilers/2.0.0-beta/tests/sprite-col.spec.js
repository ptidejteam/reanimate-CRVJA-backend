import { jest } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import AMOSTranspiler from '../amos-transpiler.js';

const bankBytes = fs.readFileSync(
  new URL('../../../../tests/fixtures/tutorial_bank.abk', import.meta.url),
);
const game = fs.readFileSync(
  new URL('../../../../tests/fixtures/sprite_col_game.asc', import.meta.url),
  'utf8',
);

async function translate(source) {
  const response = await new AMOSTranspiler().transpile(source);
  expect(response.lexicalErrors.errors).toEqual([]);
  expect(response.syntaxErrors.errors).toEqual([]);
  return response.translatedCode;
}

// Keep the pixels painted by the real renderer; collision results come from those pixels.
async function run(source, { openScreen = true, deferBank = false } = {}) {
  const pixelReads = jest.fn();
  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.style = {};
      this.children = [];
      this.parentElement = null;
    }

    appendChild(child) {
      child.remove();
      this.children.push(child);
      child.parentElement = this;
    }

    remove() {
      if (this.parentElement) {
        const siblings = this.parentElement.children;
        siblings.splice(siblings.indexOf(this), 1);
        this.parentElement = null;
      }
    }

    set innerHTML(value) {
      expect(value).toBe('');
      [...this.children].forEach((child) => child.remove());
    }

    querySelectorAll(selector) {
      expect(selector).toBe('canvas[id^="sprite"]');
      return this.children.flatMap((child) => [
        ...(child.tagName === 'canvas' && child.id.startsWith('sprite') ? [child] : []),
        ...child.querySelectorAll(selector),
      ]);
    }

    getContext(type) {
      expect(this.tagName).toBe('canvas');
      expect(type).toBe('2d');
      return {
        createImageData: (width, height) => ({
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4),
        }),
        putImageData: (image, x, y) => {
          expect([x, y, image.width, image.height]).toEqual([0, 0, this.width, this.height]);
          this.pixels = image.data.slice();
        },
        getImageData: (x, y, width, height) => {
          expect([x, y, width, height].every(Number.isInteger)).toBe(true);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(width).toBeGreaterThan(0);
          expect(height).toBeGreaterThan(0);
          expect(x + width).toBeLessThanOrEqual(this.width);
          expect(y + height).toBeLessThanOrEqual(this.height);
          pixelReads(this.id);
          const data = new Uint8ClampedArray(width * height * 4);
          for (let row = 0; row < height; row++) {
            const start = ((y + row) * this.width + x) * 4;
            data.set(this.pixels.subarray(start, start + width * 4), row * width * 4);
          }
          return { data };
        },
      };
    }
  }

  const host = new Element('div');
  host.id = 'game-container';
  const find = (element, id) =>
    element.id === id
      ? element
      : element.children.map((child) => find(child, id)).find(Boolean) || null;
  const bankLoads = [];
  const timers = [];
  const random = jest.fn(() => 0.5);
  const math = Object.create(Math);
  math.random = random;
  const context = vm.createContext({
    Math: math,
    Date: { now: () => 1000 },
    console: { log() {}, error() {} },
    document: {
      addEventListener() {},
      getElementById: (id) => find(host, id),
      createElement: (tagName) => new Element(tagName),
    },
    window: { __getBankFile: () => bankBytes },
    FileReader: class {
      readAsArrayBuffer(bytes) {
        const load = () => this.onload({ target: { result: Uint8Array.from(bytes).buffer } });
        if (deferBank) bankLoads.push(load);
        else load();
      }
    },
    setTimeout: (callback) => timers.push(callback),
  });
  const code = await translate(
    (openScreen ? 'Screen Open 0,320,200,16,Lowres\n' : '') +
      'Load "tutorial_bank.abk",1\n' +
      source,
  );
  vm.runInContext(`"use strict";\n${code}`, context, { timeout: 1000 });
  return {
    evaluate: (expression) => vm.runInContext(expression, context, { timeout: 1000 }),
    completeBankLoad: () => bankLoads.splice(0).forEach((load) => load()),
    retrySprites: () => timers.splice(0).forEach((callback) => callback()),
    pixelReads,
    random,
  };
}

describe('SPRITE COL pixel collisions', () => {
  test.each([
    [0, 0, -1],
    [16, 0, -1],
    [20, 0, 0], // Overlapping rectangles, but only transparent pixels overlap.
    [32, 0, 0], // Rectangle edges touch.
    [40, 0, 0],
    [0, 32, 0],
    [0, 40, 0],
    [-8, -27, -1], // Exactly one pair of opaque pixels overlaps.
  ])('bank images 0 and 1 at offset (%i,%i) return %i', async (dx, dy, expected) => {
    const result = await run(`
      Sprite 1,100,80,0
      Sprite 2,${100 + dx},${80 + dy},1
      ALL=Sprite Col(1)
      HIT=Sprite Col(1,2 To 2)
      REVERSE=Sprite Col(2,1 To 1)
    `);
    expect(Array.from(result.evaluate('[ALL,HIT,REVERSE]'))).toEqual([
      expected,
      expected,
      expected,
    ]);
    if (dx >= 32 || dy >= 32) expect(result.pixelReads).not.toHaveBeenCalled();
  });

  test.each([0, 2, 8, 63])(
    'checks active sprite %i, including hardware and computed IDs',
    async (id) => {
      const result = await run(`
      Sprite 1,100,80,0
      Sprite ${id},116,80,1
      RESULT=Sprite Col(1)
      RANGED=Sprite Col(1,${id} To ${id})
    `);
      expect(Array.from(result.evaluate('[RESULT,RANGED]'))).toEqual([-1, -1]);
    },
  );

  test('range bounds are inclusive, reversed ranges are empty, and the source is excluded', async () => {
    const result = await run(`
      Sprite 1,100,80,0
      Sprite 2,116,80,1
      Sprite 3,240,80,1
      Sprite 4,116,80,1
      FIRST=Sprite Col(1,2 To 2)
      LAST=Sprite Col(1,4 To 4)
      MISS=Sprite Col(1,3 To 3)
      GROUP=Sprite Col(1,2 To 4)
      OUTSIDE=Sprite Col(1,5 To 9)
      REVERSED=Sprite Col(1,4 To 2)
      SELF=Sprite Col(1,1 To 1)
    `);
    expect(Array.from(result.evaluate('[FIRST,LAST,MISS,GROUP,OUTSIDE,REVERSED,SELF]'))).toEqual([
      -1, -1, 0, -1, 0, 0, 0,
    ]);
  });

  test('returns zero without a source or other active sprites', async () => {
    const result = await run('Sprite 1,100,80,0\nMISSING=Sprite Col(9)\nSELF=Sprite Col(1)');
    expect(Array.from(result.evaluate('[MISSING,SELF]'))).toEqual([0, 0]);
  });

  test('returns zero without an open screen', async () => {
    const result = await run('RESULT=Sprite Col(1)', { openScreen: false });
    expect(result.evaluate('RESULT')).toBe(0);
  });

  test('reflects movement, image replacement, and Cls without retaining stale collision data', async () => {
    const result = await run(`
      Sprite 1,100,80,0
      Sprite 2,116,80,1
      BEFORE=Sprite Col(1)
      Sprite 2,120,80,1
      AWAY=Sprite Col(1)
      Sprite 1,100,80,4
      CHANGED=Sprite Col(1)
      Sprite 2,240,80,1
      SEPARATED=Sprite Col(1)
      Sprite 2,116,80,1
      BACK=Sprite Col(1)
      Cls
      CLEARED=Sprite Col(1)
    `);
    expect(Array.from(result.evaluate('[BEFORE,AWAY,CHANGED,SEPARATED,BACK,CLEARED]'))).toEqual([
      -1, 0, -1, 0, -1, 0,
    ]);
  });

  test('returns zero while a bank is pending, then detects sprites rendered by load retries', async () => {
    const result = await run(
      `
      Sprite 1,100,80,0
      Sprite 2,116,80,1
      PENDING=Sprite Col(1)
    `,
      { deferBank: true },
    );
    expect(result.evaluate('PENDING')).toBe(0);
    result.completeBankLoad();
    result.retrySprites();
    expect(result.evaluate('spriteCol(1)')).toBe(-1);
  });
});

describe('SPRITE COL expressions', () => {
  test('Timer values also work in sprite parameters and the text display', async () => {
    const result = await run(`
      Timer=2
      Sprite Timer,Timer,Timer,Timer
      Text 8,8,Timer
      X=X Sprite(Timer)
      Y=Y Sprite(Timer)
    `);
    expect(Array.from(result.evaluate('[X,Y]'))).toEqual([2, 2]);
    expect(result.evaluate('document.getElementById("textDiv_8_8").innerText')).toBe(2);
    // Image 2 is Normal Face, with 722 opaque pixels in the tutorial bank.
    expect(
      result.evaluate(`document.getElementById('sprite2').pixels.filter(
      (value, index) => index % 4 === 3 && value !== 0
    ).length`),
    ).toBe(722);
  });

  test('evaluates variables, arrays, and nested expressions once per argument at runtime', async () => {
    const result = await run(`
      Sprite 1,100,80,0
      Sprite 2,116,80,1
      Dim IDS(2)
      IDS(0)=1 : IDS(1)=2 : IDS(2)=2
      RESULT=Sprite Col(Abs(IDS(Rnd(0))),IDS(Rnd(0)+1) To IDS(Rnd(0)+2))
      SOURCE=1 : FIRST=2 : LAST=2
      HIT=Sprite Col(SOURCE,FIRST To LAST)
      FIRST=3 : LAST=3
      MISS=Sprite Col(SOURCE,FIRST To LAST)
      MATCH=0
      If RESULT=-1
        MATCH=1
      End If
    `);
    expect(Array.from(result.evaluate('[RESULT,HIT,MISS,MATCH]'))).toEqual([-1, -1, 0, 1]);
    expect(result.random).toHaveBeenCalledTimes(3);
  });

  test('the browser test game transpiles to valid asynchronous JavaScript', async () => {
    const code = await translate(game);
    expect(() => new vm.Script(`(async () => {\n${code}\n})()`)).not.toThrow();
    expect(code).toContain('ALL = spriteCol(1);');
    expect(code).toContain('HIT = spriteCol(1, 2, 2);');
  });
});
