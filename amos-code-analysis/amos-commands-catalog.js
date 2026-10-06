import { readFileSync } from 'fs';

class AMOSCommandsCatalog {
  constructor(amosCommandsCatalog) {
    this.AMOSCatalog = '';

    // This simple CSV reader assumes fields contain no quoted commas or newlines.
    const lines = amosCommandsCatalog.trim().split('\n');
    const headers = lines[0].split(',');
    const result = []

    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const currentLine = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = currentLine[j].trim();
      }
      result.push(obj);
    }

    this.AMOSCatalog = result;
  }

}

export default AMOSCommandsCatalog;
