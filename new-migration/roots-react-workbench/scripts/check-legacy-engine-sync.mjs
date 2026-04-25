import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const engineFiles = [
  'math-engine.js',
  'calc-engine.js',
  'expression-engine.js',
  'root-engine.js',
];

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const drift = [];

for (const file of engineFiles) {
  const source = resolve(appRoot, file);
  const legacy = resolve(appRoot, 'public', 'legacy', file);

  if (!existsSync(legacy)) {
    drift.push(`${file}: missing public/legacy copy`);
    continue;
  }

  const sourceHash = sha256(source);
  const legacyHash = sha256(legacy);
  if (sourceHash !== legacyHash) {
    drift.push(`${file}: source ${sourceHash} != public/legacy ${legacyHash}`);
  }
}

if (drift.length) {
  console.error('Legacy engine sync check failed:');
  for (const item of drift) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`Legacy engine sync check passed for ${engineFiles.length} files.`);
