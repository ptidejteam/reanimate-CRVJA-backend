const defaultColumns = ['COMMAND', 'CATEGORY', 'COUNT', 'PROJECT', 'FILE_PATH'];

function escapeField(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(rows, columns = defaultColumns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map(column => escapeField(row[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}
