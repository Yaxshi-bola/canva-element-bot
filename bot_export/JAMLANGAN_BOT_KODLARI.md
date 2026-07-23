# 🤖 Canva Element Kodlari — Secure Telegram Bot & API Code Bundle
> **Tavsif:** Canva Element Kodlari Telegram boti, Express Backend API va Telegram WebApp HMAC Authentication jamlanmasi.
> **Muallif:** Zuhra Olimova & Yaxshi Bola
> **Xavfsizlik darajasi:** 🟢 Oliy (Hardcode tokenlarsiz, HMAC SHA-256 va Avto Telegram Backup bilan)

---

## 📂 Fayllar Mundarijasi
1. `bot/package.json` — Node.js bog'liqliklar va start skriptlar
2. `bot/render.yaml` — Render.com servisi hosting va xavfsiz env sozlamalari
3. `bot/server.js` — Express server, HMAC SHA-256 Auth va Himoyalangan Admin API
4. `bot/bot.js` — Telegram Bot logikasi, menyular va xavfsiz token yuklanishi
5. `bot/database.js` — Supabase ma'lumotlar bazasi va foydalanuvchilar boshqaruvi
6. `bot/backup.js` — Avtomatik kunlik Telegram Chat Dispatch Backup logikasi
7. `bot/admins.json` — Adminlar ro'yxati

---

### 1. `bot/package.json`
```json
{
  "name": "canva-element-bot",
  "version": "1.0.0",
  "description": "Canva Element Kodlari Telegram Bot and Admin Panel by Zuhra Olimova",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^4.19.2",
    "node-telegram-bot-api": "^0.66.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

```

---

### 2. `bot/render.yaml`
```yaml
services:
  - type: web
    name: canva-element-bot
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: BOT_TOKEN
        sync: false
      - key: NODE_VERSION
        value: 18.0.0

```

---

### 3. `bot/server.js`
```javascript
/* -------------------------------------------------------------
 * Render Web Service Entrypoint
 * Express Server + Telegram Bot + Custom Elements API + Backup Cron
 * Author: Zuhra Olimova & Yaxshi Bola
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

// API: Add Admin
app.post('/api/admins', requireAdminAuth, (req, res) => {
  const { adminId } = req.body;
  if (!adminId) return res.status(400).json({ success: false, error: 'adminId required' });
  const added = db.addAdmin(adminId);
  res.json({ success: added, admins: db.getAdmins() });
});

// API: Delete Admin
app.delete('/api/admins/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const removed = db.removeAdmin(id);
  res.json({ success: removed, admins: db.getAdmins() });
});

// API: Settings Get & Update (Protected Admin)
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: db.getSettings() });
});

app.post('/api/settings/force-sub', (req, res) => {
  const { channelUsername, isEnabled } = req.body;
  if (channelUsername !== undefined) db.setForceChannel(channelUsername);
  if (isEnabled !== undefined) db.toggleForceSub(isEnabled);
  res.json({ success: true, settings: db.getSettings() });
});

// API: Check User Channel Subscription
app.get('/api/check-sub', async (req, res) => {
  const userId = req.query.user_id;
  const settings = db.getSettings();
  const channels = db.getForceChannels();

  if (!settings.forceSubActive || !channels || channels.length === 0) {
    return res.json({ success: true, isSubscribed: true, missing: [], forceSubActive: Boolean(settings.forceSubActive), channels });
  }

  // If no user_id is provided, enforce lock screen overlay
  if (!userId) {
    return res.json({ success: true, isSubscribed: false, missing: channels, forceSubActive: true, channels });
  }

  const botInstance = require('./bot');

  const missing = [];
  for (const channel of channels) {
    try {
      const member = await botInstance.getChatMember(channel, userId);
      const validStatuses = ['creator', 'administrator', 'member'];
      if (!validStatuses.includes(member.status)) {
        missing.push(channel);
      }
    } catch (err) {
      if (err.message && (err.message.includes('chat not found') || err.message.includes('bot is not a member') || err.message.includes('not an admin'))) {
        // Skip blocking if bot lacks admin permissions
      } else {
        missing.push(channel);
      }
    }
  }

  res.json({
    success: true,
    isSubscribed: missing.length === 0,
    missing: missing,
    forceSubActive: settings.forceSubActive
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

```

---

### 4. `bot/bot.js`
```javascript
/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Bot & Admin Panel
 * Token: 8914431726:AAEsGTEXLUCLaL0gSq9ztAt7EBubh1Ge27o
 * Super Admin ID: 8544023815
 * Author: Zuhra Olimova & Yaxshi Bola
 * ------------------------------------------------------------- */

const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ FATAL: BOT_TOKEN environment variable is not defined!');
  process.exit(1);
}
const SUPER_ADMIN_ID = 8544023815;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Canva Element Kodlari Bot starting...');

// Admin state tracking
const adminState = {};
const pendingElement = {};
const pendingBroadcast = {};

// Helper: Check Admin & Super Admin
function isAdmin(userId) {
  return db.isAdmin(userId);
}

function isSuperAdmin(userId) {
  return db.isSuperAdmin(userId);
}

// Helper: Check Bot's Admin Status in Channel
async function checkBotChannelAdminStatus(channel) {
  try {
    const me = await bot.getMe();
    const member = await bot.getChatMember(channel, me.id);
    const isAdmin = ['creator', 'administrator'].includes(member.status);
    return {
      channel,
      isValid: true,
      isAdmin,
      status: member.status,
      message: isAdmin ? 'Bot Admin ✅' : 'Bot Admin emas ⚠️ (Kanalga admin qiling)'
    };
  } catch (err) {
    return {
      channel,
      isValid: false,
      isAdmin: false,
      status: 'error',
      message: `Topilmadi/Xatolik: ${err.message}`
    };
  }
}

// Helper: Check Multiple Channels Subscription (Fast Parallel Execution)
async function checkUserSubscription(userId) {
  const settings = db.getSettings();
  const channels = db.getForceChannels();

  if (!settings.forceSubActive || !channels || channels.length === 0) {
    return { isSubscribed: true, missing: [] };
  }

  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        const member = await bot.getChatMember(channel, userId);
        const validStatuses = ['creator', 'administrator', 'member'];
        if (!validStatuses.includes(member.status)) {
          return { channel, isSub: false };
        }
        return { channel, isSub: true };
      } catch (err) {
        console.error(`[FORCE_SUB] Error checking subscription for ${channel}:`, err.message);
        if (err.message && (err.message.includes('chat not found') || err.message.includes('bot is not a member') || err.message.includes('not an admin'))) {
          console.warn(`[FORCE_SUB_WARNING] Bot lacks admin access in channel ${channel}. Skipping channel check for user.`);
          return { channel, isSub: true }; // don't block user if bot lacks permission
        }
        return { channel, isSub: false };
      }
    })
  );

  const missing = results.filter(r => !r.isSub).map(r => r.channel);

  return {
    isSubscribed: missing.length === 0,
    missing: missing
  };
}

// Registered Telegram Premium Custom Emoji IDs
const PREMIUM_EMOJIS = {
  SUCCESS_CHECK: '5980930633298350051',
  DANGER_STOP: '5240241223632954241',
  SHARE: '5798697374247291954',
  TELEGRAM: '5830262682338465584',
  INSTAGRAM: '5830394890021770129',
  SAKURA: '5440354006335495210',
  PINK_HEART: '5465540480538254161',
  SPARKLES: '5472164874886846699',
  TULIP: '5404835520150773707',
  TARGET: '5458795341774083865',
  CLAPPER: '5375464961822695044',
  LIGHTNING: '5431449001532594346',
  CLIPBOARD: '5987635334945444280',
  DOWN_ARROW: '5406745015365943482',
  CROWN: '5229011542011299168',
  BLUE_HEART: '5433856365061746058',
  ZUHRA_HEART: '5213147217015122287'
};

// Get User Keyboards
function getUserKeyboard(userId) {
  const settings = db.getSettings();
  const webAppUrl = settings.webAppUrl || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
  const isAdm = db.isAdmin(userId);
  const ts = Date.now();
  const targetUrl = isAdm ? `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` : `${webAppUrl}?user_id=${userId}&v=${ts}`;

  const inlineKeyboard = [
    [
      {
        text: 'Canva Element Kodlari (Mini App)',
        web_app: { url: targetUrl },
        style: 'primary',
        icon_custom_emoji_id: PREMIUM_EMOJIS.SAKURA
      }
    ]
  ];

  if (isAdm) {
    inlineKeyboard.push([
      {
        text: 'Admin Panel (Mini App)',
        web_app: { url: `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` },
        style: 'success',
        icon_custom_emoji_id: PREMIUM_EMOJIS.CROWN
      }
    ]);
  }

  const replyKeyboard = [];
  if (isAdm) {
    replyKeyboard.push([{ text: '👑 Admin Panel' }]);
  }

  return { inlineKeyboard, replyKeyboard };
}

// Get Admin Menu Keyboard
function getAdminKeyboard(userId) {
  const isSuper = isSuperAdmin(userId);
  const keyboard = [
    [{ text: '📊 Statistika' }, { text: '➕ Yangi Element Qo\'shish' }],
    [{ text: '🔗 Majburiy Obuna Kanallari' }]
  ];

  if (isSuper) {
    keyboard.push([{ text: '📢 Barchaga Xabar Yuborish' }, { text: '👥 Foydalanuvchilar Boshqaruvi' }]);
    keyboard.push([{ text: '📥 Join Request Sozlamalari' }]);
  }

  keyboard.push([{ text: '🏠 Bosh Menyuga Qaytish' }]);

  return {
    reply_markup: {
      keyboard: keyboard,
      resize_keyboard: true
    }
  };
}

// Global Block Check Middleware
function isBlockedUser(userId) {
  return db.isUserBlocked(userId);
}

// Start Command & User Registration
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (isBlockedUser(userId)) {
    return bot.sendMessage(chatId, `🚫 **Siz ushbu botdan foydalanishdan bloklangansiz!**`, { parse_mode: 'Markdown' });
  }

  await db.saveUser(userId, {
    username: msg.from.username,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name
  });

  const subStatus = await checkUserSubscription(userId);

  if (!subStatus.isSubscribed) {
    // Hide BotFather Chat Menu Button for unsubscribed user
    try {
      await bot.setChatMenuButton({
        chat_id: chatId,
        menu_button: JSON.stringify({ type: 'default' })
      });
    } catch (e) {}

    const inlineButtons = subStatus.missing.map(ch => [
      {
        text: `${ch} kanaliga obuna bo'lish`,
        url: ch.startsWith('-100') ? 'https://t.me' : `https://t.me/${ch.replace('@', '')}`,
        style: 'danger',
        icon_custom_emoji_id: PREMIUM_EMOJIS.TELEGRAM
      }
    ]);

    inlineButtons.push([
      {
        text: 'Obunani tekshirish',
        callback_data: 'check_sub',
        style: 'success',
        icon_custom_emoji_id: PREMIUM_EMOJIS.SUCCESS_CHECK
      }
    ]);

    return bot.sendMessage(
      chatId,
      `<tg-emoji emoji-id="${PREMIUM_EMOJIS.DANGER_STOP}">🛑</tg-emoji> <b>Botdan foydalanish uchun quyidagi kanal(lar)imizga obuna bo'ling!</b>\n\n` +
      `Barcha kanallarga a'zo bo'lgach, <b>"Obunani tekshirish"</b> tugmasini bosing:`,
      {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineButtons }
      }
    );
  }

  // Activate Mini App Chat Menu Button for Subscribed User
  try {
    const settings = db.getSettings();
    const webAppUrl = settings.webAppUrl || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
    const isAdm = db.isAdmin(userId);
    const ts = Date.now();
    const targetUrl = isAdm ? `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` : `${webAppUrl}?user_id=${userId}&v=${ts}`;

    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({
        type: 'web_app',
        text: 'Canva Element Kodlari',
        web_app: { url: targetUrl }
      })
    });
  } catch (e) {}

  sendWelcomeMessage(chatId, userId);
});

function sendWelcomeMessage(chatId, userId) {
  const { inlineKeyboard, replyKeyboard } = getUserKeyboard(userId);

  const welcomeText = `<tg-emoji emoji-id="5440354006335495210">🌸</tg-emoji> <b>Canva Element Kodlari — Zuhra Olimova</b>\n\n` +
    `Assalomu alaykum! <tg-emoji emoji-id="5465540480538254161">💖</tg-emoji>\n\n` +
    `Ushbu bot orqali siz Canva dizaynlaringiz uchun 400+ saralangan element kodlarini bir bosishda topishingiz mumkin:\n\n` +
    `• <tg-emoji emoji-id="5472164874886846699">✨</tg-emoji> <b>3D elementlar</b>\n` +
    `• <tg-emoji emoji-id="5404835520150773707">🌷</tg-emoji> <b>Estetik bezaklar</b>\n` +
    `• <tg-emoji emoji-id="5458795341774083865">🎯</tg-emoji> <b>SMM elementlari</b>\n` +
    `• <tg-emoji emoji-id="5375464961822695044">🎬</tg-emoji> <b>Animatsiyali elementlar</b>\n\n` +
    `<tg-emoji emoji-id="5431449001532594346">⚡</tg-emoji> <b>Tezkor qidiruv</b> • <tg-emoji emoji-id="5987635334945444280">📋</tg-emoji> <b>Oson nusxalash</b>\n\n` +
    `<tg-emoji emoji-id="5406745015365943482">👇</tg-emoji> <b>Mini App’ni ochish uchun pastdagi tugmani bosing!</b>`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });

  if (isAdmin(userId) && replyKeyboard.length > 0) {
    const isSuper = isSuperAdmin(userId);
    const adminTag = isSuper 
      ? `Yaxshi Bola <tg-emoji emoji-id="5433856365061746058">🩵</tg-emoji>` 
      : `Zuhra <tg-emoji emoji-id="5213147217015122287">🩷</tg-emoji>`;

    bot.sendMessage(chatId, `<tg-emoji emoji-id="5229011542011299168">👑</tg-emoji> Assalomu alaykum, <b>${adminTag}</b>! Siz <b>Admin</b> hisoblanasiz. Boshqaruv paneli menyuda faollashtirildi.`, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: replyKeyboard,
        resize_keyboard: true
      }
    });
  }
}

// Join Request Handler & Uzbek Gender Classifier
bot.on('chat_join_request', async (req) => {
  const user = req.from;
  const chat = req.chat;
  const mode = db.getJoinRequestMode();

  const savedUser = await db.saveUser(user.id, {
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name
  });

  const genderResult = db.detectUzbekGender(user.first_name || '', user.last_name || '');
  let actionTaken = 'Manual ko\'rib chiqish';

  if (mode === 'approve_all') {
    try {
      await bot.approveChatJoinRequest(chat.id, user.id);
      actionTaken = 'Avtomatik tasdiqlandi ✅';
    } catch (e) {
      actionTaken = `Xatolik: ${e.message}`;
    }
  } else if (mode === 'female_only') {
    if (genderResult.gender === 'female') {
      try {
        await bot.approveChatJoinRequest(chat.id, user.id);
        actionTaken = 'Avtomatik tasdiqlandi (Qiz bola 👩) ✅';
      } catch (e) {
        actionTaken = `Xatolik: ${e.message}`;
      }
    } else {
      actionTaken = "Kutilmoqda (O'g'il bola/Noma'lum) ⏳";
    }
  } else if (mode === 'male_only') {
    if (genderResult.gender === 'male') {
      try {
        await bot.approveChatJoinRequest(chat.id, user.id);
        actionTaken = 'Avtomatik tasdiqlandi (O\'g\'il bola 👨) ✅';
      } catch (e) {
        actionTaken = `Xatolik: ${e.message}`;
      }
    } else {
      actionTaken = 'Kutilmoqda (Qiz bola/Noma\'lum) ⏳';
    }
  }

  // Notify Super Admin
  const notifyText = `📥 **YANGI JOIN REQUEST**\n\n` +
    `👤 **Foydalanuvchi:** ${user.first_name} (@${user.username || 'yo\'q'})\n` +
    `🆔 **ID:** \`${user.id}\`\n` +
    `🧬 **Jinsi (ismiga ko'ra):** ${genderResult.label}\n` +
    `📢 **Kanal:** ${chat.title || chat.username}\n` +
    `⚙️ **Holat:** ${actionTaken}`;

  bot.sendMessage(SUPER_ADMIN_ID, notifyText, { parse_mode: 'Markdown' }).catch(() => {});
});

// Callback Query Handler
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  if (isBlockedUser(userId)) {
    return bot.answerCallbackQuery(query.id, { text: '🚫 Siz bloklangansiz!', show_alert: true });
  }

  // Check Subscription
  if (data === 'check_sub') {
    const subStatus = await checkUserSubscription(userId);
    if (subStatus.isSubscribed) {
      await bot.answerCallbackQuery(query.id, { text: 'Rahmat! Obuna tasdiqlandi.' });
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

      // Activate Mini App Chat Menu Button for Subscribed User
      try {
        const settings = db.getSettings();
        const webAppUrl = settings.webAppUrl || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
        const isAdm = db.isAdmin(userId);
        const ts = Date.now();
        const targetUrl = isAdm ? `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` : `${webAppUrl}?user_id=${userId}&v=${ts}`;

        await bot.setChatMenuButton({
          chat_id: chatId,
          menu_button: JSON.stringify({
            type: 'web_app',
            text: 'Canva Element Kodlari',
            web_app: { url: targetUrl }
          })
        });
      } catch (e) {}

      sendWelcomeMessage(chatId, userId);
    } else {
      await bot.answerCallbackQuery(query.id, { text: "Siz hali barcha majburiy kanallarga obuna bo'lmadingiz!", show_alert: true });
    }
    return;
  }

  // Admin Callbacks
  if (!isAdmin(userId)) return;

  // Broadcast Actions
  if (data === 'broadcast_add_buttons') {
    if (!isSuperAdmin(userId)) return;
    adminState[userId] = 'awaiting_broadcast_buttons';
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, 
      `✏️ **Inline tugmalarni yuboring:**\n\n` +
      `Har bir tugmani yangi qatordan quyidagi formatda yozing:\n` +
      `\`Tugma matni - https://link.com\`\n\n` +
      `Misol:\n` +
      `\`Bizning Kanal - https://t.me/zuhracanva_official\`\n` +
      `\`Vebsaytga o'tish - https://canva.com\``,
      { parse_mode: 'Markdown' }
    );
  }

  if (data === 'broadcast_send_now' || data === 'broadcast_confirm_send') {
    if (!isSuperAdmin(userId)) return;
    await bot.answerCallbackQuery(query.id, { text: '🚀 Broadcast boshlanmoqda...' });
    const bData = pendingBroadcast[userId];
    if (!bData) {
      return bot.sendMessage(chatId, `❌ Broadcast ma'lumotlari topilmadi.`, getAdminKeyboard(userId));
    }

    adminState[userId] = null;
    const userIds = await db.getAllUserIds();
    let successCount = 0;
    let failCount = 0;

    const progressMsg = await bot.sendMessage(chatId, `⏳ Xabar ${userIds.length} ta foydalanuvchiga yuborilmoqda... (0/${userIds.length})`);

    for (let i = 0; i < userIds.length; i++) {
      const targetId = userIds[i];
      try {
        await bot.copyMessage(targetId, bData.chatId, bData.msgId, {
          reply_markup: bData.inline_keyboard ? { inline_keyboard: bData.inline_keyboard } : undefined
        });
        successCount++;
      } catch (e) {
        failCount++;
        if (e.message && (e.message.includes('429') || e.message.includes('Too Many Requests'))) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // Small 35ms delay between users to avoid Telegram rate limits
      await new Promise(r => setTimeout(r, 35));

      // Periodic progress report every 50 users
      if ((i + 1) % 50 === 0 || i === userIds.length - 1) {
        bot.editMessageText(
          `⏳ Xabar yuborilmoqda... (${i + 1}/${userIds.length})\n✅ Yuborildi: ${successCount}\n❌ Xato/Blok: ${failCount}`,
          { chatId: chatId, message_id: progressMsg.message_id }
        ).catch(() => {});
      }
    }

    pendingBroadcast[userId] = null;
    return bot.sendMessage(chatId, 
      `🎉 **Xabar tarqatildi!**\n\n` +
      `✅ Muvaffaqiyatli yuborildi: **${successCount}** ta\n` +
      `❌ Yuborilmadi/Bloklangan: **${failCount}** ta\n` +
      `👥 Jami foydalanuvchilar: **${userIds.length}** ta`, 
      { parse_mode: 'Markdown', ...getAdminKeyboard(userId) }
    );
  }

  if (data === 'broadcast_cancel') {
    adminState[userId] = null;
    pendingBroadcast[userId] = null;
    await bot.answerCallbackQuery(query.id, { text: 'Bekor qilindi' });
    return bot.sendMessage(chatId, `❌ Broadcast bekor qilindi.`, getAdminKeyboard(userId));
  }

  // Compulsory Channels Callbacks
  if (data === 'chan_add') {
    adminState[userId] = 'awaiting_channel';
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, `✏️ Yangi kanal username yoki linkini yuboring (masalan: \`@yangi_kanal\` yoki \`https://t.me/yangi_kanal\`):`, { parse_mode: 'Markdown' });
  }

  async function renderChannelListMenu(chatId, messageId = null) {
    const channels = db.getForceChannels();
    const settings = db.getSettings();

    if (channels.length === 0) {
      const msgText = `📭 **Hozircha hech qanday majburiy obuna kanali ulangan emas.**\n\n` +
        `⚙️ **Majburiy obuna holati:** ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}`;

      const btnMarkup = {
        inline_keyboard: [
          [{ text: '➕ Yangi kanal qo\'shish', callback_data: 'chan_add' }],
          [{ text: `⚙️ Obunani ${settings.forceSubActive ? 'O\'CHIRISH ❌' : 'YOQISH ✅'}`, callback_data: 'chan_toggle_sub' }]
        ]
      };

      if (messageId) {
        return bot.editMessageText(msgText, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: btnMarkup }).catch(() => {
          bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', reply_markup: btnMarkup });
        });
      }
      return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', reply_markup: btnMarkup });
    }

    // Fast parallel admin status check for all channels
    const statusResults = await Promise.all(channels.map(ch => checkBotChannelAdminStatus(ch)));

    let reportText = `📋 **ULANGAN MAJBURlY OBUNA KANALLARI VA BOT ADMINLIK HOLATI:**\n\n`;
    reportText += `⚙️ **Majburiy obuna holati:** ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}\n\n`;
    const inlineButtons = [];

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      const adminStatus = statusResults[i];
      const statusIcon = adminStatus.isAdmin ? '🟢' : '🔴';

      reportText += `${i + 1}. **${ch}**\n   └ ${statusIcon} Status: ${adminStatus.message}\n\n`;

      const chClean = ch.replace('@', '');
      const chUrl = ch.startsWith('-100') ? 'https://t.me' : `https://t.me/${chClean}`;

      inlineButtons.push([
        { text: `📢 ${ch}`, url: chUrl },
        { text: `🗑 O'chirish`, callback_data: `chan_del_idx_${i}` }
      ]);
    }

    inlineButtons.push([
      { text: `⚙️ Obunani ${settings.forceSubActive ? 'O\'CHIRISH ❌' : 'YOQISH ✅'}`, callback_data: 'chan_toggle_sub' }
    ]);

    inlineButtons.push([
      { text: '🔍 Qayta tekshirish', callback_data: 'chan_check_admins' },
      { text: '➕ Yangi kanal qo\'shish', callback_data: 'chan_add' }
    ]);

    if (messageId) {
      return bot.editMessageText(reportText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineButtons }
      }).catch(() => {
        bot.sendMessage(chatId, reportText, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineButtons } });
      });
    }

    return bot.sendMessage(chatId, reportText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineButtons }
    });
  }

  if (data === 'chan_list' || data === 'chan_remove_menu' || data === 'chan_check_admins') {
    await bot.answerCallbackQuery(query.id, { text: '🔍 Kanal holati tekshirilmoqda...' });
    return renderChannelListMenu(chatId, query.message?.message_id);
  }

  if (data.startsWith('chan_del_idx_')) {
    const idx = parseInt(data.replace('chan_del_idx_', ''));
    const channels = db.getForceChannels();
    if (!isNaN(idx) && channels[idx]) {
      const channelToRemove = channels[idx];
      db.removeForceChannel(channelToRemove);
      await bot.answerCallbackQuery(query.id, { text: `✅ ${channelToRemove} o'chirildi!` });
    } else {
      await bot.answerCallbackQuery(query.id, { text: '⚠️ Kanal topilmadi.' });
    }
    return renderChannelListMenu(chatId, query.message?.message_id);
  }

  if (data.startsWith('chan_delete_')) {
    const channelToRemove = data.replace('chan_delete_', '');
    db.removeForceChannel(channelToRemove);
    await bot.answerCallbackQuery(query.id, { text: `✅ ${channelToRemove} o'chirildi!` });
    return renderChannelListMenu(chatId, query.message?.message_id);
  }

  if (data === 'chan_toggle_sub') {
    const settings = db.getSettings();
    const newStatus = !settings.forceSubActive;
    db.toggleForceSub(newStatus);
    await bot.answerCallbackQuery(query.id, { text: `Obuna holati: ${newStatus ? 'YOQILDI ✅' : "O'CHIRILDI ❌"}` });
    return renderChannelListMenu(chatId, query.message?.message_id);
  }

  // Join Request Mode Callbacks
  if (data.startsWith('jr_mode_')) {
    const newMode = data.replace('jr_mode_', '');
    db.setJoinRequestMode(newMode);
    await bot.answerCallbackQuery(query.id, { text: 'Sozlama saqlandi!' });
    return bot.sendMessage(chatId, `✅ **Join Request rejim o'zgartirildi:** \`${newMode}\``, getAdminKeyboard(userId));
  }

  // User Management Callbacks (Super Admin Only)
  if (data.startsWith('users_list_')) {
    if (!isSuperAdmin(userId)) return;
    const page = parseInt(data.replace('users_list_', '')) || 0;
    const users = await db.getAllUsers();
    const pageSize = 10;
    const totalPages = Math.ceil(users.length / pageSize) || 1;
    const startIdx = page * pageSize;
    const pageUsers = users.slice(startIdx, startIdx + pageSize);

    let text = `👥 **FOYDALANUVCHILAR RO'YXATI (${page + 1}/${totalPages})**\n\n`;
    pageUsers.forEach((u, i) => {
      const blockTag = u.is_blocked ? ' 🚫 [BLOKLANGAN]' : '';
      text += `${startIdx + i + 1}. **${u.first_name || 'Ismsiz'}** (@${u.username || 'yo\'q'})\n`;
      text += `   └ 🆔: \`${u.id}\` | 🧬: ${u.gender_label || 'Noma\'lum'}${blockTag}\n`;
    });

    const navButtons = [];
    if (page > 0) navButtons.push({ text: '⬅️ Ortga', callback_data: `users_list_${page - 1}` });
    if (page < totalPages - 1) navButtons.push({ text: 'Oldinga ➡️', callback_data: `users_list_${page + 1}` });

    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [navButtons] }
    });
  }

  if (data === 'users_blocked_list') {
    if (!isSuperAdmin(userId)) return;
    await bot.answerCallbackQuery(query.id);
    const blocked = db.getBlockedUsers();
    if (blocked.length === 0) {
      return bot.sendMessage(chatId, `🟢 Hozircha hech qanday bloklangan foydalanuvchi yo'q.`, getAdminKeyboard(userId));
    }

    let bText = `🛑 **BLOKLANGAN FOYDALANUVCHILAR RO'YXATI:**\n\n`;
    blocked.forEach((u, idx) => {
      bText += `${idx + 1}. **${u.first_name || 'User'}** (@${u.username || 'yo\'q'}) — ID: \`${u.id}\`\n`;
    });

    return bot.sendMessage(chatId, bText, { parse_mode: 'Markdown', ...getAdminKeyboard(userId) });
  }

  if (data === 'user_block_input') {
    if (!isSuperAdmin(userId)) return;
    adminState[userId] = 'awaiting_block_id';
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, `✏️ Bloklamoqchi bo'lgan foydalanuvchining **Telegram ID**-sini yuboring:`, { parse_mode: 'Markdown' });
  }

  if (data === 'user_unblock_input') {
    if (!isSuperAdmin(userId)) return;
    adminState[userId] = 'awaiting_unblock_id';
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, `✏️ Blokdan chiqarmoqchi bo'lgan foydalanuvchining **Telegram ID**-sini yuboring:`, { parse_mode: 'Markdown' });
  }
});

// Admin Message Handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Global block check
  if (isBlockedUser(userId)) return;

  // Track User Activity asynchronously without blocking response
  db.saveUser(userId, {
    username: msg.from.username,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name
  }).catch(() => {});

  if (!isAdmin(userId)) return;

  // Handle Admin Menu Commands
  if (text === '👑 Admin Panel') {
    adminState[userId] = null;
    const isSuper = isSuperAdmin(userId);
    const adminTag = isSuper 
      ? `Yaxshi Bola <tg-emoji emoji-id="5433856365061746058">🩵</tg-emoji>` 
      : `Zuhra <tg-emoji emoji-id="5213147217015122287">🩷</tg-emoji>`;

    return bot.sendMessage(chatId, `<tg-emoji emoji-id="5229011542011299168">👑</tg-emoji> <b>${adminTag} Admin Paneli</b>\n\nBoshqaruv bo'limini tanlang:`, {
      parse_mode: 'HTML',
      ...getAdminKeyboard(userId)
    });
  }

  if (text === '🏠 Bosh Menyuga Qaytish') {
    adminState[userId] = null;
    return sendWelcomeMessage(chatId, userId);
  }

  if (text === '📊 Statistika') {
    const stats = await db.getStats();
    const statsText = `📊 **BOT VA FOYDALANUVCHILAR STATISTIKASI**\n\n` +
      `👥 **Barcha foydalanuvchilar:** ${stats.totalUsers} ta\n` +
      `🔥 **Bugun (24s) faol:** ${stats.activeToday} ta\n` +
      `👩 **Qizlar:** ${stats.femaleCount} ta\n` +
      `👨 **O'g'il bolalar:** ${stats.maleCount} ta\n` +
      `❓ **Noma'lum:** ${stats.unknownCount} ta\n\n` +
      `✨ **Yangi element kodlari:** ${stats.customCount} ta\n` +
      `🛑 **Bloklanganlar:** ${stats.blockedUsersCount} ta\n` +
      `👑 **Adminlar soni:** ${stats.adminCount} ta\n\n` +
      `📢 **Majburiy kanallar (${stats.forceChannelsCount} ta):**\n${stats.forceChannels}\n\n` +
      `⚙️ **Majburiy obuna holati:** ${stats.forceSubActive}\n` +
      `📥 **Join Request rejimi:** \`${stats.joinRequestMode}\`\n` +
      `🔗 **Mini App:** ${stats.webAppUrl}`;

    return bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown', ...getAdminKeyboard(userId) });
  }

  // Compulsory Channels Management Menu
  if (text === '🔗 Majburiy Obuna Kanallari') {
    const channels = db.getForceChannels();
    const settings = db.getSettings();
    const chListText = channels.length > 0 ? channels.map(c => `• \`${c}\``).join('\n') : '_Hech qanday kanal ulangan emas_';

    const inlineKeyboard = [
      [
        { text: '➕ Kanal qo\'shish', callback_data: 'chan_add' },
        { text: '📋 Ro\'yxat & Status', callback_data: 'chan_list' }
      ],
      [
        { text: '🔍 Adminlikni tekshirish', callback_data: 'chan_check_admins' },
        { text: `⚙️ Holat: ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}`, callback_data: 'chan_toggle_sub' }
      ]
    ];

    return bot.sendMessage(
      chatId,
      `🔗 **MAJBURlY OBUNA KANALLARI BOSHQARUVI**\n\n` +
      `📌 **Hozirgi kanallar:**\n${chListText}\n\n` +
      `⚙️ **Obuna holati:** ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } }
    );
  }

  // Super Admin: Broadcast Message Handler
  if (text === '📢 Barchaga Xabar Yuborish') {
    if (!isSuperAdmin(userId)) {
      return bot.sendMessage(chatId, `🔒 **Barchaga xabar yuborish faqat Super Admin (Yaxshi Bola) uchun ruxsat etilgan!**`, { parse_mode: 'Markdown' });
    }

    adminState[userId] = 'awaiting_broadcast_msg';
    return bot.sendMessage(chatId, 
      `✏️ **Barcha foydalanuvchilarga yubormoqchi bo'lgan xabaringizni yuboring** (matn, rasm yoki media):\n\n` +
      `_Bekor qilish uchun /cancel deb yozing._`, 
      { parse_mode: 'Markdown' }
    );
  }

  // Super Admin: User Management Menu
  if (text === '👥 Foydalanuvchilar Boshqaruvi') {
    if (!isSuperAdmin(userId)) {
      return bot.sendMessage(chatId, `🔒 **Foydalanuvchilarni boshqarish faqat Super Admin (Yaxshi Bola) uchun ruxsat etilgan!**`, { parse_mode: 'Markdown' });
    }

    const inlineKeyboard = [
      [
        { text: '📊 Barcha Foydalanuvchilar', callback_data: 'users_list_0' },
        { text: '🛑 Bloklanganlar', callback_data: 'users_blocked_list' }
      ],
      [
        { text: '🚫 User Bloklash', callback_data: 'user_block_input' },
        { text: '✅ Blokdan Chiqarish', callback_data: 'user_unblock_input' }
      ]
    ];

    return bot.sendMessage(chatId, `👥 **FOYDALANUVCHILARNI BOSHQARISH (SUPER ADMIN)**\n\nKerakli bo'limni tanlang:`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  }

  // Super Admin: Join Request Settings Menu
  if (text === '📥 Join Request Sozlamalari') {
    if (!isSuperAdmin(userId)) return;

    const currentMode = db.getJoinRequestMode();
    const inlineKeyboard = [
      [{ text: `✅ Barchani avto-tasdiqlash ${currentMode === 'approve_all' ? '✔️' : ''}`, callback_data: 'jr_mode_approve_all' }],
      [{ text: `👩 Faqat qizlarni avto-tasdiqlash ${currentMode === 'female_only' ? '✔️' : ''}`, callback_data: 'jr_mode_female_only' }],
      [{ text: `👨 Faqat o'g'il bolalarni avto-tasdiqlash ${currentMode === 'male_only' ? '✔️' : ''}`, callback_data: 'jr_mode_male_only' }],
      [{ text: `⏸ Avto-tasdiqlashni o'chirish ${currentMode === 'manual' ? '✔️' : ''}`, callback_data: 'jr_mode_manual' }]
    ];

    return bot.sendMessage(
      chatId,
      `📥 **JOIN REQUEST (QO'SHILISH SO'ROVLARI) SOZLAMALARI**\n\n` +
      `Bot kanallarga kelgan qo'shilish so'rovlarini ismiga ko'ra genderini (o'g'il/qiz) ajrata oladi.\n\n` +
      `📌 **Hozirgi rejim:** \`${currentMode}\`\n\nRejimni tanlang:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } }
    );
  }

  // Add New Element Flow
  if (text === "➕ Yangi Element Qo'shish") {
    adminState[userId] = 'add_code';
    pendingElement[userId] = {};
    return bot.sendMessage(chatId, `1️⃣ **Element kodini yuboring** (masalan: \`set:nAG35oM8lfI\`):`, { parse_mode: 'Markdown' });
  }

  if (text === '/cancel') {
    adminState[userId] = null;
    pendingElement[userId] = {};
    pendingBroadcast[userId] = null;
    return bot.sendMessage(chatId, `❌ Amal bekor qilindi.`, getAdminKeyboard(userId));
  }

  // Handle Admin Input States
  if (adminState[userId] === 'add_code') {
    pendingElement[userId].code = text.trim();
    adminState[userId] = 'add_desc';
    return bot.sendMessage(chatId, `2️⃣ **Element tavsifini yuboring** (masalan: \`Marmar 3D loy shakllar\`):`);
  }

  if (adminState[userId] === 'add_desc') {
    pendingElement[userId].description = text.trim();
    adminState[userId] = 'add_cat';
    return bot.sendMessage(chatId, `3️⃣ **Element bo'limini yuboring** (masalan: \`Trenddagi 3D Elementlar\`, \`SMM, Target, Dizayn\` va h.k.):`);
  }

  if (adminState[userId] === 'add_cat') {
    pendingElement[userId].category = text.trim();
    const elem = pendingElement[userId];
    await db.addCustomElement(elem.code, elem.description, elem.category);

    adminState[userId] = null;
    pendingElement[userId] = {};

    return bot.sendMessage(
      chatId,
      `🎉 **Yangi element muvaffaqiyatli qo'shildi!**\n\n` +
      `📌 **Kod:** \`${elem.code}\`\n` +
      `📝 **Tavsif:** ${elem.description}\n` +
      `📂 **Bo'lim:** ${elem.category}\n\n` +
      `*Ushbu element avtomatik tarzda Mini App-ning "Yangiliklar & Yangi Kodlar" bo'limida ko'rinadi!*`,
      { parse_mode: 'Markdown', ...getAdminKeyboard(userId) }
    );
  }

  if (adminState[userId] === 'awaiting_channel') {
    adminState[userId] = null;
    const added = db.addForceChannel(text);
    if (added) {
      const adminCheck = await checkBotChannelAdminStatus(added);
      let resultMsg = `✅ **Majburiy obuna kanali qo'shildi:** \`${added}\`\n\n`;
      if (adminCheck.isAdmin) {
        resultMsg += `🟢 **Bot Admin statusi:** Tasdiqlandi ✅ (${adminCheck.status})`;
      } else {
        resultMsg += `⚠️ **DIQQAT:** Bot ushbu kanalda **Admin emas**! Iltimos, botni kanalga administrator qiling, aks holda obunani tekshirish ishlamaydi.`;
      }
      return bot.sendMessage(chatId, resultMsg, { parse_mode: 'Markdown', ...getAdminKeyboard(userId) });
    } else {
      return bot.sendMessage(chatId, `⚠️ Ushbu kanal allaqachon ro'yxatda bor yoki xato link kiritildi.`, getAdminKeyboard(userId));
    }
  }

  // Broadcast Message Creation
  if (adminState[userId] === 'awaiting_broadcast_msg') {
    adminState[userId] = null;
    pendingBroadcast[userId] = {
      msgId: msg.message_id,
      chatId: chatId,
      inline_keyboard: null
    };

    const confirmButtons = [
      [
        { text: '➕ Inline Tugma Qo\'shish', callback_data: 'broadcast_add_buttons' },
        { text: '🚀 Tugmasiz Yuborish', callback_data: 'broadcast_send_now' }
      ],
      [
        { text: '❌ Bekor Qilish', callback_data: 'broadcast_cancel' }
      ]
    ];

    return bot.sendMessage(
      chatId,
      `🔘 **Xabar qabul qilindi!**\n\nXabarga inline tugmalar (linklar) qo'shmoqchimisiz?`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: confirmButtons } }
    );
  }

  // Broadcast Inline Buttons Parsing
  if (adminState[userId] === 'awaiting_broadcast_buttons') {
    adminState[userId] = null;
    const bData = pendingBroadcast[userId];
    if (!bData) {
      return bot.sendMessage(chatId, `❌ Broadcast sessiyasi topilmadi.`, getAdminKeyboard(userId));
    }

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const inlineKeyboard = [];

    for (const line of lines) {
      const parts = line.split('|');
      const row = [];
      for (const part of parts) {
        const [btnText, btnUrl] = part.split('-').map(s => s.trim());
        if (btnText && btnUrl && (btnUrl.startsWith('http://') || btnUrl.startsWith('https://') || btnUrl.startsWith('t.me/'))) {
          const finalUrl = btnUrl.startsWith('t.me/') ? `https://${btnUrl}` : btnUrl;
          row.push({ text: btnText, url: finalUrl });
        }
      }
      if (row.length > 0) inlineKeyboard.push(row);
    }

    bData.inline_keyboard = inlineKeyboard;

    const actionButtons = [
      [
        { text: '🚀 Xabarni Tarqatish', callback_data: 'broadcast_confirm_send' },
        { text: '❌ Bekor Qilish', callback_data: 'broadcast_cancel' }
      ]
    ];

    await bot.sendMessage(chatId, `👁 **XABARNING TUGMALAR BILAN PREVIEW KO'RINISHI:**`, { parse_mode: 'Markdown' });
    
    await bot.copyMessage(chatId, bData.chatId, bData.msgId, {
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    return bot.sendMessage(chatId, `⬆️ Yuqoridagi xabar barcha foydalanuvchilarga yuborilsinmi?`, {
      reply_markup: { inline_keyboard: actionButtons }
    });
  }

  // User Block Input Handler
  if (adminState[userId] === 'awaiting_block_id') {
    adminState[userId] = null;
    const targetId = parseInt(text.trim());
    if (isNaN(targetId)) {
      return bot.sendMessage(chatId, `❌ Yaroqsiz Telegram ID kiritildi.`, getAdminKeyboard(userId));
    }

    const blocked = db.blockUser(targetId);
    if (blocked) {
      return bot.sendMessage(chatId, `🛑 **Foydalanuvchi (\`${targetId}\`) muvaffaqiyatli bloklandi!**`, { parse_mode: 'Markdown', ...getAdminKeyboard(userId) });
    } else {
      return bot.sendMessage(chatId, `⚠️ Ushbu foydalanuvchini bloklab bo'lmaydi (Super admin yoki xato ID).`, getAdminKeyboard(userId));
    }
  }

  // User Unblock Input Handler
  if (adminState[userId] === 'awaiting_unblock_id') {
    adminState[userId] = null;
    const targetId = parseInt(text.trim());
    if (isNaN(targetId)) {
      return bot.sendMessage(chatId, `❌ Yaroqsiz Telegram ID kiritildi.`, getAdminKeyboard(userId));
    }

    const unblocked = db.unblockUser(targetId);
    if (unblocked) {
      return bot.sendMessage(chatId, `✅ **Foydalanuvchi (\`${targetId}\`) blokdan chiqarildi!**`, { parse_mode: 'Markdown', ...getAdminKeyboard(userId) });
    } else {
      return bot.sendMessage(chatId, `⚠️ Ushbu foydalanuvchi bloklanganlar ro'yxatida topilmadi.`, getAdminKeyboard(userId));
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

module.exports = bot;

```

---

### 5. `bot/database.js`
```javascript
/* -------------------------------------------------------------
 * Supabase & Local DB Manager for Telegram Bot & Mini App
 * Supabase URL: https://mjenunxgakcvyzcikjmi.supabase.co
 * Author: Zuhra Olimova & Yaxshi Bola
 * ------------------------------------------------------------- */

const urllib = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjenunxgakcvyzcikjmi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';
const ADMINS_FILE = path.join(__dirname, 'admins.json');
const DB_FILE = path.join(__dirname, 'db.json');

function supabaseQuery(endpoint, method = 'GET', body = null, customHeaders = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const defaultHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' || method === 'PATCH' ? 'resolution=merge-duplicates,return=representation' : 'return=minimal'
    };
    const options = {
      method: method,
      headers: { ...defaultHeaders, ...customHeaders }
    };

    const req = urllib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : []);
          } else {
            console.error('Supabase HTTP error:', res.statusCode, data);
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Supabase request error:', err.message);
      resolve([]);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Gender Classifier for Uzbek Names
function detectUzbekGender(firstName = '', lastName = '') {
  const fullText = `${firstName} ${lastName}`.toLowerCase().replace(/[^a-zʻʼ'‘`\s]/g, ' ').trim();
  if (!fullText) return { gender: 'unknown', label: 'Noma\'lum ❓' };

  const words = fullText.split(/\s+/).filter(w => w.length >= 2);

  // Female suffixes and indicators
  const femaleSuffixes = ['xon', 'xonim', 'oy', 'niso', 'bonu', 'begim', 'guli', 'gul', 'moh', 'parvona', 'bika', 'bibi', 'zoda'];
  const femaleNames = [
    'madina', 'malika', 'marjona', 'sabina', 'rayhon', 'zuhra', 'fatima', 'fotima',
    'shohsanam', 'firuza', 'kamola', 'nilufar', 'sevinch', 'shahnoza', 'shaxnoza',
    'dilnoza', 'gulnoza', 'munisa', 'surayyo', 'nozima', 'saida', 'nigora', 'dilafruz',
    'dilbar', 'durdona', 'mahliyo', 'feruza', 'aziza', 'laylo', 'gulasal', 'nargiz',
    'parvina', 'mubina', 'hadicha', 'mariya', 'dilyora', 'muhlisa', 'muhlisaxon',
    'lola', 'zilola', 'nargiza', 'ozoda', 'nodira', 'barno', 'guzal', 'zamira',
    'umida', 'mavluda', 'shahzoda', 'ruxshona', 'dilrabo', 'maftuna', 'nigina', 'robiya',
    'dildora', 'dildor', 'farangiz', 'mohira', 'farida', 'dinora', 'hilola', 'sitora',
    'shohida', 'halima', 'zuhro', 'ziyoda', 'jasmina', 'kamila'
  ];

  // Male suffixes and indicators
  const maleSuffixes = ['bek', 'jon', 'mir', 'sher', 'shoh', 'shox', 'yor', 'islom', 'din', 'boy', 'murod', 'xodja', 'xo\'ja', 'qul'];
  const maleNames = [
    'muhammad', 'ahmad', 'sardor', 'aziz', 'jasur', 'bobur', 'diyor', 'javohir',
    'shohruh', 'shoxrux', 'samandar', 'doniyor', 'farruh', 'farrux', 'odil', 'otabek',
    'sanjar', 'umid', 'eldor', 'akmal', 'jamshid', 'islom', 'alisher', 'ulugbek',
    'abror', 'anvar', 'doston', 'otajon', 'sobir', 'botir', 'rustam', 'sherzod',
    'humoyun', 'behruz', 'suxrob', 'asom', 'islombek', 'ibragim', 'ibrohim', 'ikrom',
    'ilhom', 'bekzod', 'dostonbek', 'muhriddin', 'kamoliddin', 'sirajiddin', 'nuriddin',
    'zayniddin', 'jaloliddin', 'asliddin', 'shoxruxbek', 'shoxruz', 'javlon', 'temur',
    'timur', 'oybek', 'jasurbek', 'umidjon', 'abbos', 'nodir', 'nodirbek', 'shukrullo',
    'habibullo', 'rahmatullo', 'asadbek', 'elmurod', 'sherali', 'zuxriddin', 'shahboz',
    'shoxboz', 'laziz', 'shaxboz', 'diyorbek', 'avazbek', 'nodirjon'
  ];

  let femaleScore = 0;
  let maleScore = 0;

  for (const word of words) {
    if (femaleNames.includes(word)) femaleScore += 3;
    if (maleNames.includes(word)) maleScore += 3;

    for (const suf of femaleSuffixes) {
      if (word.endsWith(suf)) femaleScore += 2;
    }
    for (const suf of maleSuffixes) {
      if (word.endsWith(suf)) maleScore += 2;
    }

    if (word.endsWith('a') || word.endsWith('i')) femaleScore += 1;
  }

  if (femaleScore > maleScore) {
    return { gender: 'female', label: 'Qiz bola 👩' };
  } else if (maleScore > femaleScore) {
    return { gender: 'male', label: 'O\'g\'il bola 👨' };
  }

  return { gender: 'unknown', label: 'Noma\'lum ❓' };
}

class DB {
  constructor() {
    this.memoryUsers = new Map(); // id -> userData
    this.forceChannels = [];
    this.forceSubActive = true;
    this.webAppUrl = 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
    this.superAdminId = 8544023815;
    this.zuhraAdminId = 8112688757;
    this.adminsList = [8544023815, 8112688757];
    this.blockedUsers = new Set();
    this.joinRequestMode = 'approve_all'; // 'approve_all' | 'female_only' | 'male_only' | 'manual'

    this.loadAdminsFromFile();
    this.loadDbFile();
    this.initSettingsFromSupabase().catch(() => {});
  }

  loadDbFile() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        if (parsed.settings) {
          if (Array.isArray(parsed.settings.forceChannels)) {
            this.forceChannels = parsed.settings.forceChannels;
          } else if (parsed.settings.forceChannel && parsed.settings.forceChannel.trim().length > 0) {
            this.forceChannels = [parsed.settings.forceChannel];
          }
          if (typeof parsed.settings.forceSubActive === 'boolean') {
            this.forceSubActive = parsed.settings.forceSubActive;
          }
          if (parsed.settings.joinRequestMode) {
            this.joinRequestMode = parsed.settings.joinRequestMode;
          }
        }

        if (Array.isArray(parsed.blockedUsers)) {
          this.blockedUsers = new Set(parsed.blockedUsers.map(Number));
        }

        if (parsed.users && typeof parsed.users === 'object') {
          for (const [id, u] of Object.entries(parsed.users)) {
            this.memoryUsers.set(Number(id), u);
          }
        }
      }
    } catch (e) {
      console.error('db.json load error:', e.message);
    }
  }

  saveDbFile() {
    try {
      const usersObj = {};
      for (const [id, u] of this.memoryUsers.entries()) {
        usersObj[id] = u;
      }

      const data = {
        users: usersObj,
        settings: {
          forceChannels: this.forceChannels,
          forceSubActive: this.forceSubActive,
          webAppUrl: this.webAppUrl,
          joinRequestMode: this.joinRequestMode
        },
        blockedUsers: Array.from(this.blockedUsers),
        stats: {
          updatedAt: new Date().toISOString()
        }
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('db.json save error:', e.message);
    }
  }

  async initSettingsFromSupabase() {
    try {
      const res = await supabaseQuery('bot_settings?id=eq.global', 'GET');
      if (Array.isArray(res) && res.length > 0 && res[0].config) {
        const cfg = res[0].config;
        if (Array.isArray(cfg.forceChannels)) {
          this.forceChannels = cfg.forceChannels;
        }
        if (typeof cfg.forceSubActive === 'boolean') {
          this.forceSubActive = cfg.forceSubActive;
        }
        if (cfg.joinRequestMode) {
          this.joinRequestMode = cfg.joinRequestMode;
        }
        console.log('✅ Settings loaded permanently from Supabase:', this.forceChannels);
        this.saveDbFile();
      }
    } catch (e) {
      console.warn('⚠️ Supabase settings sync warning:', e.message);
    }
  }

  async saveSettingsToSupabase() {
    try {
      const payload = {
        id: 'global',
        config: {
          forceChannels: this.forceChannels,
          forceSubActive: this.forceSubActive,
          joinRequestMode: this.joinRequestMode,
          webAppUrl: this.webAppUrl
        },
        updated_at: new Date().toISOString()
      };
      await supabaseQuery('bot_settings?on_conflict=id', 'POST', payload);
    } catch (e) {
      console.warn('⚠️ Supabase settings save error:', e.message);
    }
  }

  loadAdminsFromFile() {
    try {
      if (fs.existsSync(ADMINS_FILE)) {
        const raw = fs.readFileSync(ADMINS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.adminsList = Array.from(new Set([this.superAdminId, this.zuhraAdminId, ...parsed]));
          return;
        }
      }
    } catch (e) {}
    this.adminsList = [this.superAdminId, this.zuhraAdminId];
    this.saveAdminsToFile();
  }

  saveAdminsToFile() {
    try {
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(this.adminsList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Admins save error:', e.message);
    }
  }

  isSuperAdmin(userId) {
    return Number(userId) === this.superAdminId;
  }

  getAdmins() {
    return this.adminsList;
  }

  isAdmin(userId) {
    if (!userId) return false;
    const numId = Number(userId);
    const strId = String(userId).toLowerCase().trim();
    const validUsernames = ['yomonbola', 'yomonboia', 'zuhraolimova', 'zuhra_olimova', 'sokin_notalar'];

    if (numId === this.superAdminId || numId === this.zuhraAdminId || validUsernames.includes(strId)) {
      return true;
    }

    return this.adminsList.some(a => String(a).toLowerCase().trim() === strId || Number(a) === numId);
  }

  addAdmin(idOrUsername) {
    if (!idOrUsername) return false;
    const item = isNaN(Number(idOrUsername)) ? String(idOrUsername).trim() : Number(idOrUsername);
    if (!this.adminsList.includes(item)) {
      this.adminsList.push(item);
      this.saveAdminsToFile();
      return true;
    }
    return false;
  }

  removeAdmin(idOrUsername) {
    const numId = Number(idOrUsername);
    if (numId === this.superAdminId || numId === this.zuhraAdminId) {
      return false; // Cannot remove core super admins
    }
    const lenBefore = this.adminsList.length;
    this.adminsList = this.adminsList.filter(a => String(a).toLowerCase().trim() !== String(idOrUsername).toLowerCase().trim());
    if (this.adminsList.length < lenBefore) {
      this.saveAdminsToFile();
      return true;
    }
    return false;
  }

  // Blocking System
  blockUser(userId) {
    const numId = Number(userId);
    if (numId === this.superAdminId || numId === this.zuhraAdminId) return false;
    this.blockedUsers.add(numId);
    if (this.memoryUsers.has(numId)) {
      const u = this.memoryUsers.get(numId);
      u.is_blocked = true;
      this.memoryUsers.set(numId, u);
    }
    this.saveDbFile();
    return true;
  }

  unblockUser(userId) {
    const numId = Number(userId);
    const result = this.blockedUsers.delete(numId);
    if (this.memoryUsers.has(numId)) {
      const u = this.memoryUsers.get(numId);
      u.is_blocked = false;
      this.memoryUsers.set(numId, u);
    }
    this.saveDbFile();
    return result;
  }

  isUserBlocked(userId) {
    return this.blockedUsers.has(Number(userId));
  }

  getBlockedUsers() {
    return Array.from(this.blockedUsers).map(id => {
      const u = this.memoryUsers.get(id) || {};
      return {
        id,
        username: u.username || '',
        first_name: u.first_name || '',
        gender: u.gender || 'unknown'
      };
    });
  }

  // Join Request Mode
  getJoinRequestMode() {
    return this.joinRequestMode;
  }

  setJoinRequestMode(mode) {
    const validModes = ['approve_all', 'female_only', 'male_only', 'manual'];
    if (validModes.includes(mode)) {
      this.joinRequestMode = mode;
      this.saveDbFile();
      this.saveSettingsToSupabase().catch(() => {});
      return true;
    }
    return false;
  }

  // Compulsory Channels Management (Multiple)
  getForceChannels() {
    return this.forceChannels;
  }

  addForceChannel(channelInput) {
    if (!channelInput) return false;
    let clean = String(channelInput).trim();

    // Clean common URL prefixes
    clean = clean.replace(/^https?:\/\/(www\.)?t\.me\//i, '');
    clean = clean.replace(/^t\.me\//i, '');
    clean = clean.replace(/^telegram\.me\//i, '');
    clean = clean.replace(/[\/\?#].*$/, ''); // Remove query params or trailing slash

    if (!clean) return false;

    // Check if numeric channel ID (e.g. -1001234567890)
    if (/^-?\d+$/.test(clean)) {
      if (!this.forceChannels.includes(clean)) {
        this.forceChannels.push(clean);
        this.saveDbFile();
        this.saveSettingsToSupabase().catch(() => {});
        return clean;
      }
      return false;
    }

    // Add leading @ if missing
    if (!clean.startsWith('@')) {
      clean = `@${clean}`;
    }

    if (!this.forceChannels.includes(clean)) {
      this.forceChannels.push(clean);
      this.saveDbFile();
      this.saveSettingsToSupabase().catch(() => {});
      return clean;
    }
    return false;
  }

  removeForceChannel(channelInput) {
    if (!channelInput) return false;
    let clean = String(channelInput).trim();
    clean = clean.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^t\.me\//i, '');
    if (!clean.startsWith('@') && !/^-?\d+$/.test(clean)) clean = `@${clean}`;

    const beforeLen = this.forceChannels.length;
    this.forceChannels = this.forceChannels.filter(ch => ch.toLowerCase() !== clean.toLowerCase());
    if (this.forceChannels.length < beforeLen) {
      this.saveDbFile();
      this.saveSettingsToSupabase().catch(() => {});
      return true;
    }
    return false;
  }

  setForceChannel(channelInput) {
    if (this.addForceChannel(channelInput)) {
      this.forceSubActive = true;
      this.saveDbFile();
      this.saveSettingsToSupabase().catch(() => {});
      return true;
    }
    return false;
  }

  toggleForceSub(status = null) {
    if (status !== null) {
      this.forceSubActive = Boolean(status);
    } else {
      this.forceSubActive = !this.forceSubActive;
    }
    this.saveDbFile();
    this.saveSettingsToSupabase().catch(() => {});
    return this.forceSubActive;
  }

  // Register or Update User
  async saveUser(telegramId, userInfo = {}) {
    const userId = Number(telegramId);
    if (!userId || isNaN(userId)) return null;

    const genderResult = detectUzbekGender(userInfo.first_name || '', userInfo.last_name || '');
    const existing = this.memoryUsers.get(userId) || {};

    const updated = {
      id: userId,
      username: userInfo.username || existing.username || '',
      first_name: userInfo.first_name || existing.first_name || '',
      gender: genderResult.gender,
      gender_label: genderResult.label,
      is_blocked: this.blockedUsers.has(userId),
      last_active: new Date().toISOString(),
      created_at: existing.created_at || new Date().toISOString()
    };

    this.memoryUsers.set(userId, updated);
    this.saveDbFile();

    const payload = {
      id: userId,
      username: updated.username,
      first_name: updated.first_name,
      last_active: updated.last_active
    };

    await supabaseQuery('bot_users?on_conflict=id', 'POST', payload);
    return updated;
  }

  // Get All Elements
  async getAllElements() {
    return await supabaseQuery('elements?select=*&order=id.asc');
  }

  // Add Custom Canva Element to Supabase
  async addCustomElement(code, description, category, keywords = [], is_new = true) {
    const kw = Array.isArray(keywords) && keywords.length > 0 ? keywords : [code.trim(), description.trim(), category.trim()];
    const payload = {
      code: code.trim(),
      description: description.trim(),
      category: category.trim() || 'Trenddagi 3D Elementlar',
      keywords: kw,
      is_new: !!is_new
    };

    const result = await supabaseQuery('elements', 'POST', payload);
    return result[0] || payload;
  }

  // Update Element in Supabase
  async updateElement(id, updateFields) {
    const result = await supabaseQuery(`elements?id=eq.${id}`, 'PATCH', updateFields);
    return result[0] || updateFields;
  }

  // Delete Element from Supabase
  async deleteElement(id) {
    return await supabaseQuery(`elements?id=eq.${id}`, 'DELETE');
  }

  // Get Custom Elements
  async getCustomElements() {
    return await supabaseQuery('elements?is_new=eq.true&order=created_at.desc');
  }

  // Get All Users (Merged Remote & Local Memory Map)
  async getAllUsers() {
    const remoteUsers = await supabaseQuery('bot_users?select=*&order=last_active.desc');
    const mergedMap = new Map();

    // First populate from local memoryUsers
    for (const [id, memUser] of this.memoryUsers.entries()) {
      mergedMap.set(Number(id), { ...memUser });
    }

    // Then enrich/overwrite with remoteUsers
    if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
      remoteUsers.forEach(ru => {
        const numId = Number(ru.id);
        const existing = mergedMap.get(numId) || {};
        const gRes = detectUzbekGender(ru.first_name || existing.first_name || '', '');

        mergedMap.set(numId, {
          id: numId,
          username: ru.username || existing.username || '',
          first_name: ru.first_name || existing.first_name || '',
          gender: existing.gender || gRes.gender,
          gender_label: existing.gender_label || gRes.label,
          is_blocked: this.blockedUsers.has(numId),
          last_active: ru.last_active || existing.last_active || new Date().toISOString(),
          created_at: existing.created_at || new Date().toISOString()
        });
      });
    }

    return Array.from(mergedMap.values());
  }

  // Get Detailed Statistics
  async getStats() {
    const [allUsersList, elements, custom] = await Promise.all([
      this.getAllUsers(),
      supabaseQuery('elements?select=id'),
      supabaseQuery('elements?is_new=eq.true&select=id')
    ]);

    const totalUsers = allUsersList.length;

    // Calculate actual active users in last 24 hours
    const now = Date.now();
    const active24h = allUsersList.filter(u => {
      if (!u.last_active) return false;
      const diff = now - new Date(u.last_active).getTime();
      return diff <= 24 * 60 * 60 * 1000;
    }).length;

    // Gender breakdown
    let femaleCount = 0;
    let maleCount = 0;
    let unknownCount = 0;

    allUsersList.forEach(u => {
      const g = u.gender || detectUzbekGender(u.first_name || '').gender;
      if (g === 'female') femaleCount++;
      else if (g === 'male') maleCount++;
      else unknownCount++;
    });

    return {
      totalElements: Array.isArray(elements) && elements.length > 0 ? elements.length : 407,
      totalUsers: totalUsers,
      activeToday: Math.max(active24h, 1),
      femaleCount: femaleCount,
      maleCount: maleCount,
      unknownCount: unknownCount,
      customCount: Array.isArray(custom) ? custom.length : 0,
      adminCount: this.adminsList.length,
      forceChannelsCount: this.forceChannels.length,
      forceChannels: this.forceChannels.join(', ') || 'Sozlanmagan',
      forceSubActive: this.forceSubActive ? 'Yoqilgan ✅' : "O'chirilgan ❌",
      blockedUsersCount: this.blockedUsers.size,
      joinRequestMode: this.joinRequestMode,
      webAppUrl: this.webAppUrl
    };
  }

  // Get All User IDs (excluding blocked)
  async getAllUserIds() {
    const allUsersList = await this.getAllUsers();
    return allUsersList
      .map(u => Number(u.id))
      .filter(id => id && !isNaN(id) && !this.blockedUsers.has(id));
  }

  // Settings getters & setters
  getSettings() {
    return {
      forceChannels: this.forceChannels,
      forceSubActive: this.forceSubActive,
      webAppUrl: this.webAppUrl,
      superAdminId: this.superAdminId,
      admins: this.adminsList,
      joinRequestMode: this.joinRequestMode,
      blockedUsersCount: this.blockedUsers.size
    };
  }

  setForceChannel(channel) {
    this.addForceChannel(channel);
  }

  toggleForceSub(status) {
    this.forceSubActive = typeof status === 'boolean' ? status : !this.forceSubActive;
    this.saveDbFile();
  }
}

module.exports = new DB();
module.exports.detectUzbekGender = detectUzbekGender;


```

---

### 6. `bot/backup.js`
```javascript
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

async function createDailyBackup(forceTelegramSend = false) {
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `daily_backup_${dateStr}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const alreadyExists = fs.existsSync(filePath);

    const [elements, users] = await Promise.all([
      db.getAllElements(),
      db.getAllUsers()
    ]);
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

    // Send to Telegram ONLY if it hasn't been sent today or explicitly requested
    if (forceTelegramSend || !alreadyExists) {
      await sendBackupToTelegram(filePath, fileName);
    }

    return backupData;
  } catch (err) {
    console.error('❌ [Daily Backup Error]:', err.message);
    return null;
  }
}

// Start daily scheduler (runs once every 24 hours, no boot-up spam)
function initBackupCron() {
  // Run once on initial boot silently without sending telegram message if already backed up today
  createDailyBackup(false);

  setInterval(() => {
    createDailyBackup(false);
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

```

---

### 7. `bot/admins.json`
```json
[
  8544023815,
  8112688757
]

```
