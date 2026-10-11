const fs = require('fs');
const path = require('path');

// Auto load env from bot/.env
const envPath = path.join(__dirname, '..', 'bot', '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(envPath); } catch (e) {}
}

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const API_TOKEN = process.env.R2_API_TOKEN || '';
const SCRIPT_NAME = 'canva-bot';
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const SUPER_ADMIN_ID = '8544023815';
const WEB_APP_URL = 'https://canva-element-kodlari-zuhra-olimova.vercel.app';

async function deploy() {
  if (!ACCOUNT_ID || !API_TOKEN || !BOT_TOKEN) {
    console.error('Missing credentials in environment variables or bot/.env');
    return;
  }

  console.log('🚀 Deploying Cloudflare Worker with R2 & Webhook...');

  const workerCodePath = path.join(__dirname, 'worker.js');
  const workerCode = fs.readFileSync(workerCodePath, 'utf-8');

  const metadata = {
    main_module: 'worker.js',
    bindings: [
      { type: 'r2_bucket', name: 'R2_BUCKET', bucket_name: 'canva-elements' },
      { type: 'plain_text', name: 'BOT_TOKEN', text: BOT_TOKEN },
      { type: 'plain_text', name: 'SUPER_ADMIN_ID', text: SUPER_ADMIN_ID },
      { type: 'plain_text', name: 'WEB_APP_URL', text: WEB_APP_URL }
    ],
    compatibility_date: '2024-09-23'
  };

  const boundary = '----CFWorkerBoundary' + Date.now();
  const parts = [];

  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="worker.js"; filename="worker.js"\r\nContent-Type: application/javascript+module\r\n\r\n${workerCode}\r\n`);
  parts.push(`--${boundary}--\r\n`);

  const body = parts.join('');

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const json = await res.json();
  if (json.success) {
    console.log('✅ Cloudflare Worker successfully deployed with R2 binding!');
  } else {
    console.error('❌ Worker deploy failed:', JSON.stringify(json.errors, null, 2));
    return;
  }

  // Enable subdomain route
  const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/subdomain`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: true })
  });
  const subJson = await subRes.json();
  console.log('🌐 Subdomain route:', subJson.success ? 'Active' : subJson.errors);

  const workerUrl = `https://${SCRIPT_NAME}.${SCRIPT_NAME}.workers.dev`;
  console.log(`🔗 Worker URL: ${workerUrl}`);

  // Set Telegram Webhook
  console.log('📡 Registering Webhook with Telegram...');
  const hookRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${workerUrl}/webhook`,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query', 'chat_join_request']
    })
  });
  const hookJson = await hookRes.json();
  console.log('🤖 Telegram Webhook result:', hookJson);
}

deploy().catch(console.error);
