/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Bot & Expanded Admin Panel
 * Token: 8914431726:AAEsGTEXLUCLaL0gSq9ztAt7EBubh1Ge27o
 * Admin ID: 8544023815
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ FATAL: BOT_TOKEN environment variable is not defined!');
  process.exit(1);
}
const ADMIN_ID = 8544023815;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Canva Element Kodlari Bot starting...');

// Admin state tracking
const adminState = {};
const pendingElement = {};

// Helper: Check Admin
function isAdmin(userId) {
  return db.isAdmin(userId);
}

// Helper: Check Channel Subscription
async function checkUserSubscription(userId) {
  const settings = db.getSettings();
  if (!settings.forceSubActive || !settings.forceChannel) {
    return true;
  }

  try {
    const member = await bot.getChatMember(settings.forceChannel, userId);
    const validStatuses = ['creator', 'administrator', 'member'];
    return validStatuses.includes(member.status);
  } catch (err) {
    console.error('Error checking subscription:', err.message);
    return true;
  }
}

// Registered Telegram Premium Custom Emoji IDs
const PREMIUM_EMOJIS = {
  SUCCESS_CHECK: '5980930633298350051',  // Green Checkmark (Yashil Ptichka / Success)
  DANGER_STOP: '5240241223632954241',    // Red Stop Circle (Qizil Kres / Danger)
  SHARE: '5798697374247291954',          // Share Icon (Ulashish)
  TELEGRAM: '5830262682338465584',       // Telegram Shield Icon
  INSTAGRAM: '5830394890021770129',      // Instagram Shield Icon
  SAKURA: '5440354006335495210',         // Sakura Flower
  PINK_HEART: '5465540480538254161',     // Sparkling Pink Heart
  SPARKLES: '5472164874886846699',       // Sparkles (3D)
  TULIP: '5404835520150773707',          // Tulip (Estetik)
  TARGET: '5458795341774083865',         // Target (SMM)
  CLAPPER: '5375464961822695044',        // Movie Clapper (Animatsiya)
  LIGHTNING: '5431449001532594346',      // Lightning (Tezkor Qidiruv)
  CLIPBOARD: '5987635334945444280',      // Clipboard (Nusxalash)
  DOWN_ARROW: '5406745015365943482',     // Down Arrow
  CROWN: '5229011542011299168',          // Admin Crown
  BLUE_HEART: '5433856365061746058',     // Yaxshi Bola Blue Heart
  ZUHRA_HEART: '5213147217015122287'     // Zuhra Pink Heart
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
function getAdminKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📊 Statistika' }, { text: '➕ Yangi Element Qo\'shish' }],
        [{ text: '📢 Barchaga Xabar Yuborish' }, { text: '🔗 Majburiy Obuna Kanalini Sozlash' }],
        [{ text: '🔄 Obuna Holatini O\'zgartirish' }, { text: '🏠 Bosh Menyuga Qaytish' }]
      ],
      resize_keyboard: true
    }
  };
}

// Start Command & User Registration
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  db.saveUser(userId, {
    username: msg.from.username,
    first_name: msg.from.first_name
  });

  const isSubscribed = await checkUserSubscription(userId);

  if (!isSubscribed) {
    const settings = db.getSettings();
    const channelLink = settings.forceChannelLink || `https://t.me/${settings.forceChannel.replace('@', '')}`;

    return bot.sendMessage(
      chatId,
      `<b>Botdan foydalanish uchun rasmiy kanalimizga obuna bo'ling!</b>\n\nQuyidagi tugma orqali kanalga a'zo bo'ling va <b>"Obunani tekshirish"</b> tugmasini bosing:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: "Kanalga a'zo bo'lish", 
                url: channelLink,
                style: 'danger',
                icon_custom_emoji_id: PREMIUM_EMOJIS.TELEGRAM
              }
            ],
            [
              { 
                text: 'Obunani tekshirish', 
                callback_data: 'check_sub',
                style: 'success',
                icon_custom_emoji_id: PREMIUM_EMOJIS.SUCCESS_CHECK
              }
            ]
          ]
        }
      }
    );
  }

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
    const isSuper = Number(userId) === 8544023815;
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

// Callback Query Handler
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;

  if (query.data === 'check_sub') {
    const isSub = await checkUserSubscription(userId);
    if (isSub) {
      await bot.answerCallbackQuery(query.id, { text: '✅ Rahmat! Obuna tasdiqlandi.' });
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      sendWelcomeMessage(chatId, userId);
    } else {
      await bot.answerCallbackQuery(query.id, { text: "❌ Siz hali kanalga obuna bo'lmadingiz!", show_alert: true });
    }
  }
});

// Admin Panel Handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Track User Activity
  db.saveUser(userId, {
    username: msg.from.username,
    first_name: msg.from.first_name
  });

  if (!isAdmin(userId)) return;

  // Handle Admin Menu Buttons
  if (text === '👑 Admin Panel') {
    adminState[userId] = null;
    const isSuper = Number(userId) === 8544023815;
    const adminTag = isSuper 
      ? `Yaxshi Bola <tg-emoji emoji-id="5433856365061746058">🩵</tg-emoji>` 
      : `Zuhra <tg-emoji emoji-id="5213147217015122287">🩷</tg-emoji>`;

    return bot.sendMessage(chatId, `<tg-emoji emoji-id="5229011542011299168">👑</tg-emoji> <b>${adminTag} Admin Paneli</b>\n\nBoshqaruv bo'limini tanlang:`, {
      parse_mode: 'HTML',
      ...getAdminKeyboard()
    });
  }

  if (text === '🏠 Bosh Menyuga Qaytish') {
    adminState[userId] = null;
    return sendWelcomeMessage(chatId, userId);
  }

  if (text === '📊 Statistika') {
    const stats = db.getStats();
    const statsText = `📊 **BOT STATISTIKASI**\n\n` +
      `👤 **Barcha foydalanuvchilar:** ${stats.totalUsers} ta\n` +
      `🔥 **Bugun faol foydalanuvchilar:** ${stats.activeToday} ta\n` +
      `✨ **Admin qo'shgan yangi kodlar:** ${stats.customCount} ta\n\n` +
      `📢 **Majburiy obuna kanali:** ${stats.forceChannel}\n` +
      `⚙️ **Majburiy obuna holati:** ${stats.forceSubActive}\n` +
      `🔗 **Mini App Havolasi:** ${stats.webAppUrl}`;

    return bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown', ...getAdminKeyboard() });
  }

  if (text === "🔄 Obuna Holatini O'zgartirish") {
    const settings = db.getSettings();
    const newStatus = !settings.forceSubActive;
    db.toggleForceSub(newStatus);
    return bot.sendMessage(chatId, `⚙️ Majburiy obuna holati o'zgartirildi: **${newStatus ? 'YOQILDI ✅' : "O'CHIRILDI ❌"}**`, getAdminKeyboard());
  }

  if (text === '🔗 Majburiy Obuna Kanalini Sozlash') {
    adminState[userId] = 'awaiting_channel';
    return bot.sendMessage(chatId, `✏️ Majburiy obuna kanali username-ini yuboring (masalan: \`@kanaliz_nomi\`):\n\n*Eslatma: Bot ushbu kanalda administrator bo'lishi kerak!*`, { parse_mode: 'Markdown' });
  }

  if (text === '📢 Barchaga Xabar Yuborish') {
    adminState[userId] = 'awaiting_broadcast';
    return bot.sendMessage(chatId, `✏️ Barcha foydalanuvchilarga yubormoqchi bo'lgan xabaringizni yuboring (matn, rasm yoki media):\n\n_Bekor qilish uchun /cancel deb yozing._`, { parse_mode: 'Markdown' });
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
    return bot.sendMessage(chatId, `❌ Amal bekor qilindi.`, getAdminKeyboard());
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
    db.addCustomElement(elem.code, elem.description, elem.category);

    adminState[userId] = null;
    pendingElement[userId] = {};

    return bot.sendMessage(
      chatId,
      `🎉 **Yangi element muvaffaqiyatli qo'shildi!**\n\n` +
      `📌 **Kod:** \`${elem.code}\`\n` +
      `📝 **Tavsif:** ${elem.description}\n` +
      `📂 **Bo'lim:** ${elem.category}\n\n` +
      `*Ushbu element avtomatik tarzda Mini App-ning "Yangiliklar & Yangi Kodlar" bo'limida ko'rinadi!*`,
      { parse_mode: 'Markdown', ...getAdminKeyboard() }
    );
  }

  if (adminState[userId] === 'awaiting_channel') {
    adminState[userId] = null;
    const channelInput = text.trim();
    db.setForceChannel(channelInput);
    return bot.sendMessage(chatId, `✅ Majburiy obuna kanali o'rnatildi: **${channelInput}**`, getAdminKeyboard());
  }

  if (adminState[userId] === 'awaiting_broadcast') {
    adminState[userId] = null;
    const userIds = db.getAllUserIds();
    let successCount = 0;

    await bot.sendMessage(chatId, `⏳ Xabar ${userIds.length} ta foydalanuvchiga yuborilmoqda...`);

    for (const targetId of userIds) {
      try {
        await bot.copyMessage(targetId, chatId, msg.message_id);
        successCount++;
      } catch (e) {
        // User blocked
      }
    }

    return bot.sendMessage(chatId, `🎉 **Xabar muvaffaqiyatli tarqatildi!**\n\n✅ Yuborildi: **${successCount}** / ${userIds.length} ta foydalanuvchiga.`, getAdminKeyboard());
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

module.exports = bot;
