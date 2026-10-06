function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function aggregateRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    if (!(row.COUNT > 0)) continue;

    const key = JSON.stringify([row.COMMAND, row.CATEGORY]);
    if (!groups.has(key)) {
      groups.set(key, {
        COMMAND: row.COMMAND,
        CATEGORY: row.CATEGORY,
        TOTAL_COUNT: 0,
        projects: new Set(),
        files: new Set(),
      });
    }

    const group = groups.get(key);
    group.TOTAL_COUNT += row.COUNT;
    group.projects.add(row.PROJECT);
    group.files.add(JSON.stringify([row.PROJECT, row.FILE_PATH]));
  }

  return [...groups.values()].map(group => ({
    COMMAND: group.COMMAND,
    CATEGORY: group.CATEGORY,
    TOTAL_COUNT: group.TOTAL_COUNT,
    PROJECT_COUNT: group.projects.size,
    FILE_COUNT: group.files.size,
  })).sort((a, b) => compareText(a.COMMAND, b.COMMAND) || compareText(a.CATEGORY, b.CATEGORY));
}
