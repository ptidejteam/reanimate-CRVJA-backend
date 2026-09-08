// Low-level AMOS binary parsing and detokenization primitives.
export const be16 = (b, i) => (b[i] << 8) | b[i + 1];
export const be32 = (b, i) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];

export class AmosBinaryParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AmosBinaryParseError';
  }
}

function requireBytes(bytes, offset, length, context) {
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(length) ||
    offset < 0 ||
    offset + length > bytes.length
  ) {
    throw new AmosBinaryParseError(`Invalid AMOS token data: truncated ${context}.`);
  }
}

const exp2 = (x) => Math.pow(2, x);

// AMOS "float" (token 0x0046) is NOT IEEE754. It matches the C code:
// e = value & 0x7F; mant = value >> 8; f = e ? mant * 2^(e-88) : 0
function readAMOSFloat32(u8, off) {
  const v = be32(u8, off) >>> 0;
  const e = v & 0x7f;
  const mant = v >>> 8;
  return e ? mant * exp2(e - 88) : 0;
}

// AMOS "double" (token 0x2B6A) uses two 32-bit words like the C code:
// vh high, vl low. Bias logic mirrors the C implementation.
function readAMOSFloat64(u8, off) {
  const vh = be32(u8, off) >>> 0;
  const vl = be32(u8, off + 4) >>> 0;
  const e = (vh >>> 20) & 0x7ff;
  if (!e) return 0;
  const dl = vl * Math.pow(2, e - 1075);
  const dh = ((vh & 0xfffff) | 0x100000) * Math.pow(2, e - 1043);
  return dl + dh;
}

// ---------------- token table ----------------
export class TokenTable {
  constructor() {
    this.map = new Map();
  }
  // key: either core token (e.g. 0x1234) or (slot<<16 | offset) for extensions
  set(key, typeChar, text) {
    // text includes the printed keyword (capitalized by the C), typeChar controls spacing/parens handling
    this.map.set(key >>> 0, {
      type: String(typeChar || 'I'),
      name: text || '',
    });
  }
  get(key) {
    return this.map.get(key >>> 0) || null;
  }
}

// ---------------- parse extension ----------------
export function parseExtensionToTable(u8, slot, start /* usually 6 */, table /* TokenTable */) {
  // Minimal validation: Amiga Hunk header (0x000003F3) & one code hunk (0x000003E9)
  if (u8.length < 54 || be32(u8, 0) !== 0x000003f3 || be32(u8, 24) !== 0x000003e9) return false;

  // Compute token-table offset like the C: tkoff = codeSize + 32 + 18 (+4 if "AP20" present)
  let tkoff = be32(u8, 32) + 32 + 18;
  if (be32(u8, 32 + 18) === 0x41503230 /* 'AP20' */) tkoff += 4;
  if (tkoff > u8.length) return false;

  // Helpers to add tokens (port of add_token in C)
  let lastName = null;
  const addToken = (key, nameBytes, typeByte) => {
    // Handle “repeat previous name” rules
    if (nameBytes[0] === 0x80) {
      if (!lastName) return; // skip if we have nothing to repeat
      nameBytes = lastName;
    } else if (nameBytes[0] === 0x21 /* '!' */) {
      lastName = nameBytes.subarray(1);
      nameBytes = lastName;
    }
    // Copy & “capitalize first letter of words” like C does
    let s = '';
    for (let i = 0; i < nameBytes.length; i++) {
      let c = nameBytes[i];
      if (c & 0x80) {
        // end
        c &= 0x7f;
        s += String.fromCharCode(c);
        break;
      }
      // uppercase 1st letter after space
      if (i === 0 || nameBytes[i - 1] === 0x20) {
        const c2 = c >= 97 && c <= 122 ? c - 32 : c;
        s += String.fromCharCode(c2);
      } else {
        s += String.fromCharCode(c);
      }
    }
    // If trailing space → switch type to 'I' (C replaces trailing space with virtual)
    if (s.endsWith(' ')) {
      s = s.slice(0, -1);
      typeByte = 0x49; // 'I'
    }

    table.set(key, String.fromCharCode(typeByte), s);
  };

  // Walk token list
  let p = tkoff + start;
  const end = u8.length;
  while (p + 2 < end) {
    const recStart = p;
    const instrPtr = be16(u8, p);
    if (instrPtr === 0) return true; // reached end
    p += 4; // skip instr & func pointers

    // Read instruction name (ASCII, last char high-bit set)
    const nameStart = p;
    while (p < end && (u8[p] & 0x80) === 0) p++;
    if (p >= end) return false;
    p++; // include last char with high bit

    // Read params “type” string (ends at 0xFF, 0xFE or 0xFD)
    const typeStart = p;
    while (p < end && u8[p] < 0xfd) p++;
    if (p >= end) return false;
    const typeByte = u8[typeStart]; // first byte encodes token "type" for spacing/etc.
    p++; // skip terminator

    // realign to word boundary
    if (p & 1) p++;

    const offsetWithinTable = (recStart - tkoff) & 0xffff;
    const key = ((slot & 0xff) << 16) | offsetWithinTable;
    addToken(key, u8.subarray(nameStart, typeStart), typeByte);
  }
  return false; // ran out unexpectedly
}

// ---------------- procedure decrypt ----------------
export function decryptProcedureInPlace(
  u8,
  procLineStart /* index within u8 */,
  remainingLen /* bytes available from start */,
) {
  if (remainingLen < 12) return; // compiled? or too short
  if (u8[procLineStart + 10] & 0x10) return; // compiled → do nothing

  const size = be32(u8, procLineStart + 4) >>> 0;
  if (remainingLen < size + 8 + 6) return;

  let line = procLineStart + u8[procLineStart] * 2; // first line after PROCEDURE
  const endLine = procLineStart + size + 8 + 6; // line after END PROC

  // init keys like C
  let key = ((size << 8) | u8[procLineStart + 11]) >>> 0;
  let key2 = 1;
  const key3 = be16(u8, procLineStart + 8);

  while (line < endLine) {
    const next = line + u8[line] * 2;
    if (u8[line] === 0) return; // bad data safety
    let p = line + 4;
    while (p < next) {
      u8[p++] ^= (key >>> 8) & 0xff;
      u8[p++] ^= key & 0xff;
      key = (key & 0xffff0000) | ((key + key2) & 0xffff);
      key2 = (key2 + key3) & 0xffff;
      key = ((key >>> 1) | (key << 31)) >>> 0; // ROR 1
    }
    line = next;
  }
  // toggle "is encrypted" bit
  u8[procLineStart + 10] ^= 0x20;
}

// ---------------- source printer ----------------
export function printAMOSSource(code /* Uint8Array */, table /* TokenTable */) {
  let out = '';
  let inpos = 0;
  let compiledLen = 0;
  let previousLineLength = 0;

  while (inpos < code.length) {
    // If we previously saw a compiled PROCEDURE, skip its bytes & print a note
    if (compiledLen) {
      out += "   ' COMPILED PROCEDURE -- can't convert this to AMOS code\n";
      const skipLength = compiledLen + 8 - previousLineLength;
      if (skipLength < 0 || inpos + skipLength > code.length) {
        throw new AmosBinaryParseError('Invalid AMOS token data: truncated compiled procedure.');
      }
      inpos += skipLength;
      compiledLen = 0;
      if (inpos === code.length) break;
    }

    const lineStart = inpos;
    if (code[inpos] === 0) break;
    requireBytes(code, inpos, 2, 'line header');
    let linelen = code[inpos] * 2;
    if (linelen < 4) {
      throw new AmosBinaryParseError(`Invalid AMOS token data: invalid line at byte ${inpos}.`);
    }
    const supposedEnd = inpos + linelen;
    if (supposedEnd > code.length) {
      throw new AmosBinaryParseError(`Invalid AMOS token data: truncated line at byte ${inpos}.`);
    }
    const line = code.subarray(inpos, inpos + linelen);
    inpos += linelen;
    previousLineLength = linelen;

    // indent
    const indent = line[1];
    if (indent > 1) out += ' '.repeat(indent - 1);

    // decode this line
    let p = 2;
    const end = line.length;
    let addSpace = 0;
    let startOfLine = 1;
    let labelAtEol = 0;

    while (p < end) {
      requireBytes(line, p, 2, 'token');
      const token = be16(line, p);
      if (token === 0) {
        p += 2;
        break;
      }
      p += 2;
      labelAtEol = 0;

      // ----- variable/label/proc/label_ref (<= 0x0018)
      if (token <= 0x0018) {
        if (addSpace) out += ' ';
        requireBytes(line, p, 4, 'variable metadata');
        const nameLen = line[p + 2];
        const flags = line[p + 3];
        const variableLength = (nameLen & 1 ? 5 : 4) + nameLen;
        requireBytes(line, p, variableLength, 'variable name');
        // print ASCII (uppercased like C)
        for (let i = 0; i < nameLen; i++) {
          const c = line[p + 4 + i];
          if (!c) break;
          out += String.fromCharCode(c >= 97 && c <= 122 ? c - 32 : c);
        }
        if (token === 0x000c) {
          // label: add ":" unless it's a numeric label (line number)
          const first = line[p + 4];
          if (!(first >= 48 && first <= 57)) out += ':';
          addSpace = 1;
          labelAtEol = 1;
        } else {
          if (flags & 0x01) out += '#';
          else if (flags & 0x02) out += '$';
          addSpace = 0;
        }
        // advance: 2 unknown + 1 len + 1 flags + padded name
        p += variableLength;
        continue;
      }

      // ----- constants (0x0019..0x004D) and 0x2B6A
      if (token < 0x004e || token === 0x2b6a) {
        if (addSpace) {
          out += ' ';
          addSpace = 0;
        }
        switch (token) {
          case 0x001e: {
            // TkBin
            requireBytes(line, p, 4, 'binary constant');
            const v = be32(line, p) >>> 0;
            out += '%' + v.toString(2);
            p += 4;
            break;
          }
          case 0x0026: {
            // TkCh1 — double quoted
            requireBytes(line, p, 2, 'string length');
            const len = be16(line, p);
            const padded = (len + 1) & ~1;
            requireBytes(line, p, 2 + padded, 'string constant');
            const s = new TextDecoder('latin1').decode(line.subarray(p + 2, p + 2 + len));
            out += `"${s}"`;
            p += 2 + padded;
            break;
          }
          case 0x002e: {
            // TkCh2 — single quoted
            requireBytes(line, p, 2, 'string length');
            const len = be16(line, p);
            const padded = (len + 1) & ~1;
            requireBytes(line, p, 2 + padded, 'string constant');
            const s = new TextDecoder('latin1').decode(line.subarray(p + 4 - 2, p + 4 - 2 + len)); // same as above but token layout differs by 2? keep consistent with your parser if needed
            out += `'${s}'`;
            p += 2 + padded;
            break;
          }
          case 0x0036: {
            // TkHex
            requireBytes(line, p, 4, 'hexadecimal constant');
            const v = be32(line, p) >>> 0;
            out += '$' + v.toString(16).toUpperCase();
            p += 4;
            break;
          }
          case 0x003e: {
            // TkEnt
            requireBytes(line, p, 4, 'integer constant');
            out += String((be32(line, p) | 0) >>> 0); // signed/unsigned printing—match your preference
            p += 4;
            break;
          }
          case 0x0046: {
            // TkFl (AMOS float)
            requireBytes(line, p, 4, 'floating-point constant');
            out += String(readAMOSFloat32(line, p));
            p += 4;
            break;
          }
          case 0x2b6a: {
            // TkDFl
            requireBytes(line, p, 8, 'double-precision constant');
            out += String(readAMOSFloat64(line, p));
            p += 8;
            break;
          }
          default:
            out += `Illegal_Constant_${token.toString(16).padStart(4, '0')}`;
        }
        continue;
      }

      // ----- instructions / functions / extension tokens
      let key;
      if (token === 0x004e) {
        // extension: extNum (byte), unused, offset (word)
        requireBytes(line, p, 4, 'extension token');
        const extNum = line[p];
        const extOff = be16(line, p + 2);
        key = ((extNum & 0xff) << 16) | (extOff & 0xffff);
        p += 4;
      } else {
        key = token; // core token
      }

      const entry = table.get(key);
      if (entry) {
        const { type, name } = entry;
        const isParen = token === 0x0074;
        const isFunc = type === 'O' || type === '0' || type === '1' || type === '2' || type === 'V';

        if (!isFunc && !startOfLine) addSpace = 1;
        if (!isParen && addSpace && name[0] !== ' ') out += ' ';
        out += name;
        addSpace = type === 'I'; // like C: 'I' means virtual trailing space
      } else {
        // unknown token → print placeholder
        const ext = key >>> 16;
        const off = key & 0xffff;
        out += ` Extension_${ext}_${off.toString(16).padStart(4, '0')}`;
        addSpace = 1;
      }

      // ----- special tokens that carry extra bytes after them (advance p accordingly)
      switch (token) {
        case 0x064a: // TkRem1 (remark)
        case 0x0652: {
          // TkRem2
          requireBytes(line, p, 2, 'remark length');
          const len = line[p + 1];
          requireBytes(line, p, 2 + len + (len & 1 ? 1 : 0), 'remark');
          const text = new TextDecoder('latin1').decode(line.subarray(p + 2, p + 2 + len));
          out += text;
          p += 2 + len + (len & 1 ? 1 : 0);
          break;
        }
        case 0x023c: // TkFor
        case 0x0250: // TkRpt
        case 0x0268: // TkWhl
        case 0x027e: // TkDo
        case 0x02be: // TkIf
        case 0x02d0: // TkElse
        case 0x0404: // TkData
        case 0x25a4: // TkElsI (AMOS Pro)
          requireBytes(line, p, 2, 'control-flow metadata');
          p += 2;
          break;

        case 0x0290: // TkExIf
        case 0x029e: // TkExit
        case 0x0316: // TkOn
          requireBytes(line, p, 4, 'control-flow metadata');
          p += 4;
          break;

        case 0x0376: {
          // TkProc (PROCEDURE)
          // Byte layout includes size + flags; handle encrypted/compiled like C
          requireBytes(line, p, 8, 'procedure metadata');
          const size = be32(line, p);
          const flags = line[p + 6];
          if (flags & 0x20) {
            // decrypt in place (we need the whole remaining chunk, not just this line slice)
            decryptProcedureInPlace(code, lineStart, code.length - lineStart);
          }
          if (flags & 0x10) {
            compiledLen = size; // note: we’ll skip it at top of next loop tick
          }
          p += 8;
          break;
        }

        case 0x2a40: // Equ
        case 0x2a4a: // Lvo
        case 0x2a54: // Struc
        case 0x2a64: // Struct
          requireBytes(line, p, 6, 'structure metadata');
          p += 6;
          break;
      }

      startOfLine = 0;
    }

    if (addSpace && !labelAtEol) out += ' ';
    out += '\n';
  }

  return out;
}
