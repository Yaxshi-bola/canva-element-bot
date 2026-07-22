/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Bot & Expanded Admin Panel
 * Token: 8914431726:AAEsGTEXLUCLaL0gSq9ztAt7EBubh1Ge27o
 * Admin ID: 8544023815
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

const BOT_TOKEN = process.env.BOT_TOKEN || '8914431726:AAEsGTEXLUCLaL0gSq9ztAt7EBubh1Ge27o';
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

// Get User Keyboards
function getUserKeyboard(userId) {
  const settings = db.getSettings();
  const webAppUrl = settings.webAppUrl || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
  const isAdm = db.isAdmin(userId);
  const targetUrl = isAdm ? `${webAppUrl}?admin=1&user_id=${userId}` : `${webAppUrl}?user_id=${userId}`;

  const inlineKeyboard = [
    [
      {
        text: '🌸 Canva Element Kodlari (Mini App)',
        web_app: { url: targetUrl }
      }
    ]
  ];

  if (isAdm) {
    inlineKeyboard.push([
      {
        text: '👑 Admin Panel (Mini App)',
        web_app: { url: `${webAppUrl}?admin=1&user_id=${userId}` }
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
      `⚠️ **Botdan foydalanish uchun rasmiy kanalimizga obuna bo'ling!**\n\nQuyidagi tugma orqali kanalga a'zo bo'ling va **"✅ Obunani tekshirish"** tugmasini bosing:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: "📢 Kanalga a'zo bo'lish", url: channelLink }],
            [{ text: '✅ Obunani tekshirish', callback_data: 'check_sub' }]
          ]
        }
      }
    );
  }

  sendWelcomeMessage(chatId, userId);
});

function sendWelcomeMessage(chatId, userId) {
  const { inlineKeyboard, replyKeyboard } = getUserKeyboard(userId);

  const welcomeText = `🌸 **Canva Element Kodlari Katalogi — Zuhra Olimova**\n\n` +
    `Assalomu alaykum!\n\n` +
    `Ushbu bot orqali siz Canva dizaynlaringiz uchun 400+ saralangan 3D, Estetik, SMM va Animatsiyali element kodlarini bir bosishda topishingiz mumkin.\n\n` +
    `👇 **Mini App-ni ochish uchun pastdagi tugmani bosing:**`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });

  if (isAdmin(userId) && replyKeyboard.length > 0) {
    const adminName = Number(userId) === 8544023815 ? "Yaxshi Bola 🩵" : "Zuhra 🩷";
    bot.sendMessage(chatId, `👑 Assalomu alaykum, **${adminName}**! Siz **Admin** hisoblanasiz. Boshqaruv paneli menyuda faollashtirildi.`, {
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
    const adminName = Number(userId) === 8544023815 ? "Yaxshi Bola 🩵" : "Zuhra 🩷";
    return bot.sendMessage(chatId, `👑 **${adminName} Admin Paneli**\n\nBoshqaruv bo'limini tanlang:`, getAdminKeyboard());
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
