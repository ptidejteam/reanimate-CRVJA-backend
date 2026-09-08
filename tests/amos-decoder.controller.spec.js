import { jest } from '@jest/globals';
import { decodeAmosHandler } from '../src/controllers/amos-decoder.controller.js';

function createMockResponse() {
  const res = { statusCode: 200 };
  res.status = jest.fn((statusCode) => {
    res.statusCode = statusCode;
    return res;
  });
  res.json = jest.fn((body) => {
    res.body = body;
    return res;
  });
  return res;
}

function createValidFile() {
  const code = Buffer.from([3, 1, 0x04, 0x76, 0, 0]);
  const file = Buffer.alloc(20 + code.length);
  file.write('AMOS Basic v134 ', 0, 'latin1');
  file.writeUInt32BE(code.length, 16);
  code.copy(file, 20);
  return file;
}

describe('AMOS decoder controller', () => {
  test('returns 400 when no file is uploaded', () => {
    const res = createMockResponse();

    decodeAmosHandler({}, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No file uploaded.');
  });

  test('returns decoded source for a valid AMOS file', () => {
    const res = createMockResponse();

    decodeAmosHandler({ file: { buffer: createValidFile() } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sourceCode: 'Print \n' });
  });

  test('returns 400 for malformed AMOS data', () => {
    const res = createMockResponse();

    decodeAmosHandler({ file: { buffer: Buffer.alloc(20) } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('signature');
  });
});
