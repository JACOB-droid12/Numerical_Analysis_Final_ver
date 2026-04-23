import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const repoRoot = resolve(appRoot, '..');
const targetDir = resolve(appRoot, 'public', 'legacy');

const engineFiles = [
  'math-engine.js',
  'calc-engine.js',
  'expression-engine.js',
  'root-engine.js',
];

mkdirSync(targetDir, { recursive: true });

for (const file of engineFiles) {
  copyFileSync(resolve(repoRoot, file), resolve(targetDir, file));
  console.log(`Copied ${file}`);
}
