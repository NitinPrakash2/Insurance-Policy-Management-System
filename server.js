const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, 'server');
const distMain = path.join(serverDir, 'dist', 'main.js');

if (!fs.existsSync(distMain)) {
  console.log('⚡ dist/main.js not found. Building backend with NestJS first...');
  execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });
}


const child = spawn(process.execPath, [distMain], {
  cwd: serverDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
