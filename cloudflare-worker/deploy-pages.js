const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Auto load env from bot/.env
const envPath = path.join(__dirname, '..', 'bot', '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(envPath); } catch (e) {}
}

const accountId = process.env.R2_ACCOUNT_ID;
const apiToken = process.env.R2_API_TOKEN;

if (!accountId || !apiToken) {
  console.error('❌ Missing R2_ACCOUNT_ID or R2_API_TOKEN in bot/.env');
  process.exit(1);
}

console.log('🚀 Deploying Cloudflare Pages (canva-elements)...');

const env = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: accountId,
  CLOUDFLARE_API_TOKEN: apiToken
};

const projectRoot = path.join(__dirname, '..');
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(npxCmd, ['wrangler', 'pages', 'deploy', '.', '--project-name', 'canva-elements', '--branch', 'main'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: true
});

if (res.status === 0) {
  console.log('✅ Cloudflare Pages successfully deployed: https://canva-elements.pages.dev');
} else {
  console.error('❌ Cloudflare Pages deploy failed with exit code', res.status);
  process.exit(res.status || 1);
}
