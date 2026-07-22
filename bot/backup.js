/* -------------------------------------------------------------
 * Automatic Daily Backup System
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const db = require('./database');

const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
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
    return backupData;
  } catch (err) {
    console.error('❌ [Daily Backup Error]:', err.message);
    return null;
  }
}

// Start daily scheduler (runs every 24 hours, plus 5s after startup)
function initBackupCron() {
  // Initial run on startup
  setTimeout(() => {
    createDailyBackup();
  }, 5000);

  // 24 hours interval (86,400,000 ms)
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
