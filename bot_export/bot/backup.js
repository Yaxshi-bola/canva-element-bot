/* -------------------------------------------------------------
 * Automatic Daily Backup System (Local Disk + Telegram Dispatch)
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const https = require('https');
const db = require('./database');

const BACKUP_DIR = path.join(__dirname, 'backups');
const SUPER_ADMIN_ID = 8544023815;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Send backup JSON to Super Admin via Telegram API
async function sendBackupToTelegram(filePath, fileName) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  try {
    const fileContent = fs.readFileSync(filePath);
    const boundary = '----TelegramBackupBoundary' + Math.random().toString(16).substring(2);

    const postDataHeader = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n${SUPER_ADMIN_ID}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n📅 Canva Element Bot - Daily Backup (${fileName})\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="${fileName}"\r\n` +
      `Content-Type: application/json\r\n\r\n`;

    const postDataFooter = `\r\n--${boundary}--\r\n`;

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendDocument`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postDataHeader) + fileContent.length + Buffer.byteLength(postDataFooter)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✈️ [Daily Backup] Backup successfully delivered to Admin Telegram (${SUPER_ADMIN_ID})`);
        } else {
          console.error(`⚠️ [Telegram Backup Dispatch Error]: ${res.statusCode}`, responseData);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ [Telegram Backup Dispatch Network Error]:', err.message);
    });

    req.write(postDataHeader);
    req.write(fileContent);
    req.write(postDataFooter);
    req.end();
  } catch (e) {
    console.error('❌ [Telegram Backup Dispatch Failed]:', e.message);
  }
}

async function createDailyBackup() {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `daily_backup_${dateStr}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const elements = await db.getAllElements();
    const users = await db.getAllUsers();
    const admins = db.getAdmins();

    const backupData = {
      timestamp: new Date().toISOString(),
      date: dateStr,
      version: '1.0.0',
      counts: {
        elements: elements.length,
        users: users.length,
        admins: admins.length
      },
      admins: admins,
      settings: db.getSettings(),
      elements: elements,
      users: users
    };

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`✅ [Daily Backup] Automated backup saved successfully: ${fileName}`);

    // Send backup to Admin Telegram chat for permanent offsite persistence
    await sendBackupToTelegram(filePath, fileName);

    return backupData;
  } catch (err) {
    console.error('❌ [Daily Backup Error]:', err.message);
    return null;
  }
}

// Start daily scheduler
function initBackupCron() {
  setTimeout(() => {
    createDailyBackup();
  }, 5000);

  setInterval(() => {
    createDailyBackup();
  }, 24 * 60 * 60 * 1000);
}

function getLatestBackup() {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) return null;
    files.sort().reverse();
    const latestFile = path.join(BACKUP_DIR, files[0]);
    return JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
  } catch (e) {
    return null;
  }
}

module.exports = {
  createDailyBackup,
  initBackupCron,
  getLatestBackup
};
