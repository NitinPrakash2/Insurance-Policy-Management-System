import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distMainPath = path.join(__dirname, 'dist', 'main.js');

if (!fs.existsSync(distMainPath)) {
  console.log('INFO:     dist/main.js not found. Running npm run build automatically...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
}

await import('./dist/main.js');

