import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const directory = path.dirname(fileURLToPath(import.meta.url));
const jar = fileURLToPath(new URL('../../../antlr-4.13.2-complete.jar', import.meta.url));
const core = path.join(directory, 'grammar');

async function generate(folder, grammar) {
  execFileSync(
    'java',
    ['-jar', jar, '-Dlanguage=JavaScript', '-visitor', '-lib', core, '-o', 'generated', grammar],
    {
      cwd: folder,
      stdio: 'inherit',
    },
  );
  const output = path.join(folder, 'generated');
  const name = path.basename(grammar, '.g4');
  for (const file of readdirSync(output).filter(
    (file) => file.startsWith(name) && file.endsWith('.js'),
  )) {
    const filename = path.join(output, file);
    const options = await prettier.resolveConfig(filename);
    writeFileSync(
      filename,
      await prettier.format(readFileSync(filename, 'utf8'), { ...options, filepath: filename }),
    );
  }
}

await generate(core, 'AMOS.g4');
const extensions = path.join(directory, 'extensions');
for (const entry of readdirSync(extensions, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const folder = path.join(extensions, entry.name);
  for (const grammar of readdirSync(folder)
    .filter((name) => name.endsWith('.g4'))
    .sort()) {
    await generate(folder, grammar);
  }
}
