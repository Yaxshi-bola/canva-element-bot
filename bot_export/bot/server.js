/* -------------------------------------------------------------
 * Render Web Service Entrypoint
 * Express Server + Telegram Bot + Custom Elements API + Backup Cron
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./database');
const backup = require('./backup');
const app = express();
const PORT = process.env.PORT || 3000;

// Import Telegram Bot
require('./bot');

// Start Automatic Daily Backup Scheduler
backup.initBackupCron();

app.use(cors());
app.use(express.json());

// Telegram WebApp initData HMAC SHA-256 Validator
function validateTelegramInitData(initDataStr, botToken) {
  if (!initDataStr || !botToken) return null;
  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');

    const params = [];
    for (const [key, value] of urlParams.entries()) {
      params.push(`${key}=${value}`);
    }
    params.sort();
    const dataCheckString = params.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userStr = urlParams.get('user');
      return userStr ? JSON.parse(userStr) : {};
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Admin Middleware: Enforce Auth & Role Verification
function requireAdminAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || (req.headers['authorization'] || '').replace('Bearer ', '');
  const botToken = process.env.BOT_TOKEN;

  if (initData && botToken) {
    const user = validateTelegramInitData(initData, botToken);
    if (user && user.id && db.isAdmin(user.id)) {
      req.telegramUser = user;
      return next();
    }
  }

  // Header / query fallback for verified admin IDs
  const reqUserId = req.headers['x-user-id'] || req.query.user_id || req.body?.admin_user_id;
  if (reqUserId && db.isAdmin(reqUserId)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Admin authentication required'
  });
}

// Render Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Canva Element Kodlari Telegram Bot & Admin API',
    author: 'Zuhra Olimova',
    uptime: process.uptime()
  });
});

// API: Get All Elements (Public)
app.get('/api/elements', async (req, res) => {
  try {
    const elements = await db.getAllElements();
    res.json({ success: true, count: elements.length, elements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Add Element (Protected Admin)
app.post('/api/elements', requireAdminAuth, async (req, res) => {
  try {
    const { code, description, category, keywords, is_new } = req.body;
    if (!code || !description) {
      return res.status(400).json({ success: false, error: 'Code and description required' });
    }
    const created = await db.addCustomElement(code, description, category, keywords, is_new);
    res.json({ success: true, element: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Update Element (Protected Admin)
app.patch('/api/elements/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateElement(id, req.body);
    res.json({ success: true, element: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete Element (Protected Admin)
app.delete('/api/elements/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteElement(id);
    res.json({ success: true, message: 'Element deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Admin Verification & Admin List
app.get('/api/admins', (req, res) => {
  res.json({
    success: true,
    admins: db.getAdmins(),
    superAdminId: db.getSettings().superAdminId
  });
});

// API: System Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Trigger Daily Backup or Download Latest Backup (Protected Admin)
app.get('/api/backup', requireAdminAuth, async (req, res) => {
  try {
    if (req.query.action === 'create') {
      const backupData = await backup.createDailyBackup();
      return res.json({ success: true, backup: backupData });
    }
    const latest = backup.getLatestBackup() || await backup.createDailyBackup();
    res.json({ success: true, backup: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Bot Web Server is running on port ${PORT}`);
});
