import { jest } from '@jest/globals';
import { generateBankHandler, parseBankHandler } from '../src/controllers/banks.controller.js';

describe('banks.controller generateBankHandler', () => {
  function createMockResponse() {
    const res = {};
    res.statusCode = 200;
    res.headers = {};
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.setHeader = jest.fn().mockImplementation((key, val) => {
      res.headers[key] = val;
    });
    res.send = jest.fn().mockImplementation((body) => {
      res.body = body;
      return res;
    });
    res.json = jest.fn().mockImplementation((body) => {
      res.body = body;
      return res;
    });
    return res;
  }

  test('returns 400 when sprites or palette are missing', async () => {
    const req = { body: {} };
    const res = createMockResponse();

    await generateBankHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Missing bank data');
  });

  test('returns 200 and sends buffer with attachment headers', async () => {
    const req = {
      body: {
        sprites: [
          {
            width: 1,
            height: 16,
            depth: 4,
            hotspotX: 0,
            hotspotY: 0,
            planarGraphicData: Array(128).fill(0),
          },
        ],
        palette: Array(32).fill('#000000'),
        filename: 'custom_sprites.abk',
      },
    };
    const res = createMockResponse();

    await generateBankHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('application/octet-stream');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="custom_sprites.abk"');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 4).toString('ascii')).toBe('AmSp');
  });
});
