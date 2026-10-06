import { readdirSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

function sortedEntries(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

function* findProjectFiles(directory) {
  for (const entry of sortedEntries(directory)) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* findProjectFiles(path);
    } else if (entry.isFile() && ['.asc', '.txt'].includes(extname(entry.name).toLowerCase())) {
      yield path;
    }
  }
}

// A dataset's immediate child directories are its projects.
export function* findDatasetFiles(datasetDirectory) {
  const dataset = resolve(datasetDirectory);
  for (const project of sortedEntries(dataset)) {
    if (!project.isDirectory()) continue;

    const projectDirectory = join(dataset, project.name);
    for (const absolutePath of findProjectFiles(projectDirectory)) {
      yield {
        absolutePath,
        project: project.name,
        filePath: relative(projectDirectory, absolutePath).split(sep).join('/'),
      };
    }
  }
}
