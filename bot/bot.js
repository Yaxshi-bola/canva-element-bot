/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Bot & Admin Panel
 * Token: 8914431726:AAEsGTEXLUCLaL0gSq9ztAt7EBubh1Ge27o
 * Super Admin ID: 8544023815
 * Author: Zuhra Olimova & Yaxshi Bola
 * ------------------------------------------------------------- */

const path = require('path');
const fs = require('fs');

// Auto load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {}
}

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
  const webAppUrl = settings.webAppUrl || 'https://canva-elements.pages.dev';
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
    ],
    [
      {
        text: '👑 Canva Pro olish (Mini App)',
        web_app: { url: targetUrl },
        style: 'success',
        icon_custom_emoji_id: PREMIUM_EMOJIS.CROWN
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

  const replyKeyboard = [
    [{ text: '👑 Canva Pro olish (Mini App)' }]
  ];
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
    [{ text: '🔗 Majburiy Obuna Kanallari' }, { text: '💎 Canva Pro Sozlamalari' }]
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

// Deliver Canva Pro to Subscribed User (No exposed link on button, direct delivery)
async function handleGetCanvaPro(chatId, userId, query = null) {
  if (isBlockedUser(userId)) {
    if (query) return bot.answerCallbackQuery(query.id, { text: '🚫 Siz bloklangansiz!', show_alert: true });
    return bot.sendMessage(chatId, `🚫 **Siz bloklangansiz!**`, { parse_mode: 'Markdown' });
  }

  // 1. Verify compulsory channels subscription
  const subStatus = await checkUserSubscription(userId);

  if (!subStatus.isSubscribed) {
    if (query) {
      await bot.answerCallbackQuery(query.id, {
        text: "⚠️ Canva Pro faqat kanalimiz a'zolari uchun bepul! Iltimos, avval kanalimizga obuna bo'ling.",
        show_alert: true
      });
    }

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
        text: '✅ A\'zo bo\'ldim / Canva Pro olish',
        callback_data: 'check_sub_and_canva',
        style: 'success',
        icon_custom_emoji_id: PREMIUM_EMOJIS.SUCCESS_CHECK
      }
    ]);

    const lockText = `<tg-emoji emoji-id="${PREMIUM_EMOJIS.DANGER_STOP}">🛑</tg-emoji> <b>Canva Pro (Team) olish uchun kanal(lar)imizga obuna bo'ling!</b>\n\n` +
      `Bizning <b>Canva Pro (Team)</b> jamoamiz faqat kanalimizning sodiq a'zolari uchun bepul taqdim etiladi.\n\n` +
      `Quyidagi homiy kanallarga a'zo bo'lgach, <b>"A'zo bo'ldim / Canva Pro olish"</b> tugmasini bosing:`;

    return bot.sendMessage(chatId, lockText, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineButtons }
    });
  }

  if (query) {
    await bot.answerCallbackQuery(query.id);
  }

  // 2. User is verified! Check Canva Pro settings
  const canvaSettings = db.getCanvaProSettings();

  if (!canvaSettings.isEnabled || !canvaSettings.link) {
    const closedText = `😔 <b>Hozircha Canva Pro (Team) jamoamizda bo'sh o'rinlar qolmagan!</b>\n\n` +
      `Jamoamiz to'lganligi sababli yangi havola tayyorlanmoqda. Yangi joylar ochilishi bilan kanalimizda e'lon qilamiz.\n\n` +
      `Iltimos, kanalimizni kuzatib boring! <tg-emoji emoji-id="${PREMIUM_EMOJIS.PINK_HEART}">💖</tg-emoji>`;

    return bot.sendMessage(chatId, closedText, { parse_mode: 'HTML' });
  }

  // 3. Inform user that Canva Pro is claimed ONLY inside the Mini App
  const settings = db.getSettings();
  const webAppUrl = settings.webAppUrl || 'https://canva-elements.pages.dev';
  const isAdm = db.isAdmin(userId);
  const ts = Date.now();
  const targetUrl = isAdm ? `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` : `${webAppUrl}?user_id=${userId}&v=${ts}`;

  const expiryLine = canvaSettings.expiryDate 
    ? `⏳ <b>Amal qilish muddati:</b> <b>${canvaSettings.expiryDate}</b>\n\n` 
    : '';

  const infoText = `👑 <b>CANVA PRO (TEAM) QO'SHILISH</b>\n\n` +
    expiryLine +
    `Canva Pro jamoasiga qo'shilish <b>faqat Mini App ilovasi</b> orqali amalga oshiriladi!\n\n` +
    `Ilovani ochib, bosh sahifadagi <b>"Canva Pro-ga Qo'shilish"</b> tugmasini bosing:`;

  const claimButtons = [
    [
      {
        text: '📱 Mini App orqali Canva Pro olish',
        web_app: { url: targetUrl },
        style: 'success',
        icon_custom_emoji_id: PREMIUM_EMOJIS.CROWN
      }
    ]
  ];

  return bot.sendMessage(chatId, infoText, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: claimButtons }
  });
}

// Render Admin Canva Pro Settings Menu
async function renderCanvaProAdminMenu(chatId, userId, messageId = null) {
  if (!isAdmin(userId)) return;
  const pro = db.getCanvaProSettings();
  const linkDisplay = pro.link ? `<code>${pro.link}</code>` : '<i>Kiritilmagan / Bo\'sh ⚠️</i>';
  const statusDisplay = pro.isEnabled ? 'YOQILGAN (FAOL) ✅' : 'TO\'XTATILGAN (NOFAOL) ❌';

  const menuText = `💎 <b>CANVA PRO (TEAM) SOZLAMALARI</b>\n\n` +
    `📌 <b>Hozirgi taklif havolasi:</b>\n${linkDisplay}\n\n` +
    `📅 <b>Amal qilish muddati:</b> <b>${pro.expiryDate || 'Belgilanmagan (Doimiy)'}</b>\n` +
    `⚙️ <b>Holat:</b> ${statusDisplay}\n` +
    `👥 <b>Mini App orqali olganlar:</b> <b>${pro.claimsCount}</b> ta\n\n` +
    `<i>ℹ️ Havolani va muddatni pastdagi tugmalar orqali osongina kiritishingiz mumkin:</i>`;

  const inlineKeyboard = [
    [
      { text: '🔗 Havola kiritish', callback_data: 'admin_canva_set_link' },
      { text: '📅 Muddatni tanlash', callback_data: 'admin_canva_choose_expiry' }
    ],
    [
      { text: `⚙️ Holat: ${pro.isEnabled ? "O'chirish ❌" : "Yoqish ✅"}`, callback_data: 'admin_canva_toggle' },
      { text: '🔄 Hisoblagichni 0 qilish', callback_data: 'admin_canva_reset' }
    ],
    [
      { text: '🗑 Havolani o\'chirish', callback_data: 'admin_canva_del' },
      { text: '◀️ Admin menyusi', callback_data: 'admin_back_to_menu' }
    ]
  ];

  if (messageId) {
    return bot.editMessageText(menuText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    }).catch(() => {
      bot.sendMessage(chatId, menuText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
    });
  }

  return bot.sendMessage(chatId, menuText, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

// Render Expiry Selection Menu with Quick Preset Buttons
async function renderCanvaExpirySelectionMenu(chatId, userId, messageId = null) {
  if (!isAdmin(userId)) return;
  const pro = db.getCanvaProSettings();
  const currentExp = pro.expiryDate ? `<code>${pro.expiryDate}</code>` : '<i>Belgilanmagan</i>';

  const text = `📅 <b>CANVA PRO MUDDATINI TANLANG</b>\n\n` +
    `📌 <b>Hozirgi muddat:</b> ${currentExp}\n\n` +
    `Quyidagi tugmalardan birini bosing — muddat avtomatik saqlanadi va Mini App'da ko'rinadi:`;

  const inlineKeyboard = [
    [
      { text: '📅 1 oy', callback_data: 'admin_canva_exp_1m' },
      { text: '📅 2 oy', callback_data: 'admin_canva_exp_2m' },
      { text: '📅 3 oy', callback_data: 'admin_canva_exp_3m' }
    ],
    [
      { text: '📅 6 oy', callback_data: 'admin_canva_exp_6m' },
      { text: '📅 2026-yil oxirigacha', callback_data: 'admin_canva_exp_year' }
    ],
    [
      { text: '♾ Doimiy (Cheksiz)', callback_data: 'admin_canva_exp_forever' },
      { text: '✏️ O\'zim yozaman', callback_data: 'admin_canva_exp_custom' }
    ],
    [
      { text: '◀️ Orqaga (Canva menyu)', callback_data: 'admin_canva_menu' }
    ]
  ];

  if (messageId) {
    return bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    }).catch(() => {
      bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
    });
  }

  return bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
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
    const webAppUrl = settings.webAppUrl || 'https://canva-elements.pages.dev';
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
    `• <tg-emoji emoji-id="5375464961822695044">🎬</tg-emoji> <b>Animatsiyali elementlar</b>\n` +
    `• <tg-emoji emoji-id="5229011542011299168">👑</tg-emoji> <b>Canva Pro (Team)</b> — kanalimiz a'zolariga bepul!\n\n` +
    `<tg-emoji emoji-id="5431449001532594346">⚡</tg-emoji> <b>Tezkor qidiruv</b> • <tg-emoji emoji-id="5987635334945444280">📋</tg-emoji> <b>Oson nusxalash</b>\n\n` +
    `<tg-emoji emoji-id="5406745015365943482">👇</tg-emoji> <b>Kerakli bo'limni tanlash uchun pastdagi tugmalardan foydalaning:</b>`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });

  if (isAdmin(userId)) {
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
  } else if (replyKeyboard.length > 0) {
    bot.sendMessage(chatId, `👇 Pastdagi menyudan ham foydalanishingiz mumkin:`, {
      reply_markup: {
        keyboard: replyKeyboard,
        resize_keyboard: true
      }
    }).catch(() => {});
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
        const webAppUrl = settings.webAppUrl || 'https://canva-elements.pages.dev';
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

  // Canva Pro Claim Callback (User)
  if (data === 'get_canva_pro') {
    return handleGetCanvaPro(chatId, userId, query);
  }

  // Check Sub and Deliver Canva Pro Callback (User)
  if (data === 'check_sub_and_canva') {
    const subStatus = await checkUserSubscription(userId);
    if (subStatus.isSubscribed) {
      await bot.answerCallbackQuery(query.id, { text: 'Obuna tasdiqlandi! Canva Pro ochilmoqda...' });
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      return handleGetCanvaPro(chatId, userId);
    } else {
      await bot.answerCallbackQuery(query.id, {
        text: "Siz hali barcha majburiy kanallarga obuna bo'lmadingiz! Iltimos, avval kanallarga a'zo bo'ling.",
        show_alert: true
      });
      return;
    }
  }

  // Admin Callbacks
  if (!isAdmin(userId)) return;

  // Canva Pro Admin Callbacks
  if (data === 'admin_canva_menu') {
    await bot.answerCallbackQuery(query.id);
    return renderCanvaProAdminMenu(chatId, userId, query.message?.message_id);
  }

  if (data === 'admin_canva_choose_expiry') {
    await bot.answerCallbackQuery(query.id);
    return renderCanvaExpirySelectionMenu(chatId, userId, query.message?.message_id);
  }

  if (data.startsWith('admin_canva_exp_')) {
    const expType = data.replace('admin_canva_exp_', '');
    let expiryVal = '';
    if (expType === '1m') expiryVal = '1 oy';
    else if (expType === '2m') expiryVal = '2 oy';
    else if (expType === '3m') expiryVal = '3 oy';
    else if (expType === '6m') expiryVal = '6 oy';
    else if (expType === 'year') expiryVal = '2026-yil oxirigacha';
    else if (expType === 'forever') expiryVal = 'Doimiy';
    else if (expType === 'custom') {
      adminState[userId] = 'awaiting_canva_pro_expiry';
      await bot.answerCallbackQuery(query.id);
      return bot.sendMessage(
        chatId,
        `📅 <b>Canva Pro amal qilish muddatini yozib yuboring:</b>\n\n` +
        `Masalan:\n<code>30-noyabrgacha</code> yoki <code>15-dekabrgacha</code>\n\n` +
        `<i>Shunchaki matnni yuboring:</i>`,
        { parse_mode: 'HTML', reply_markup: { force_reply: true } }
      );
    }

    if (expiryVal) {
      db.setCanvaProExpiry(expiryVal);
      await bot.answerCallbackQuery(query.id, { text: `✅ Muddat "${expiryVal}" ga sozlandi!` });
      return renderCanvaProAdminMenu(chatId, userId, query.message?.message_id);
    }
  }

  if (data === 'admin_canva_set_link' || data === 'admin_canva_edit') {
    adminState[userId] = 'awaiting_canva_pro_link';
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(
      chatId,
      `🔗 <b>Yangi Canva Pro (Team) taklif havolasini yuboring:</b>\n\n` +
      `Masalan:\n<code>https://www.canva.com/brand/join?token=xxxxxx</code>\n\n` +
      `<i>Havolani shu yerga xabar qilib yuboring:</i>`,
      { parse_mode: 'HTML', reply_markup: { force_reply: true } }
    );
  }

  if (data === 'admin_canva_toggle') {
    const newStatus = db.toggleCanvaPro();
    await bot.answerCallbackQuery(query.id, { text: `Holat: ${newStatus ? 'YOQILDI ✅' : "O'CHIRILDI ❌"}` });
    return renderCanvaProAdminMenu(chatId, userId, query.message?.message_id);
  }

  if (data === 'admin_canva_reset') {
    db.resetCanvaProClaims();
    await bot.answerCallbackQuery(query.id, { text: 'Hisoblagich 0 qilindi!' });
    return renderCanvaProAdminMenu(chatId, userId, query.message?.message_id);
  }

  if (data === 'admin_canva_del') {
    db.deleteCanvaProLink();
    await bot.answerCallbackQuery(query.id, { text: "Canva Pro havolasi o'chirildi!" });
    return renderCanvaProAdminMenu(chatId, userId, query.message?.message_id);
  }

  if (data === 'admin_back_to_menu') {
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(chatId, `👑 <b>Admin Paneli</b>\n\nBoshqaruv bo'limini tanlang:`, {
      parse_mode: 'HTML',
      ...getAdminKeyboard(userId)
    });
  }

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

  // Canva Pro Claim via Persistent Reply Button (Accessible to ALL users)
  if (text === '👑 Canva Pro olish' || text === '👑 Canva Pro olish (Mini App)') {
    return handleGetCanvaPro(chatId, userId);
  }

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

  if (text === '💎 Canva Pro Sozlamalari' || text === '/canvapro') {
    adminState[userId] = null;
    return renderCanvaProAdminMenu(chatId, userId);
  }

  // Quick Canva Pro Link Command (/setcanva)
  if (text && text.startsWith('/setcanva')) {
    const raw = text.replace(/^\/setcanva\s*/i, '').trim();
    if (!raw) {
      return renderCanvaProAdminMenu(chatId, userId);
    }
    const [rawLink, rawExpiry] = raw.split('|').map(s => s.trim());
    const saved = db.setCanvaProLink(rawLink, rawExpiry || null);
    const expiryMsg = rawExpiry ? `\n📅 <b>Muddati:</b> <code>${rawExpiry}</code>` : '';
    return bot.sendMessage(
      chatId,
      `✅ <b>Canva Pro ma'lumotlari muvaffaqiyatli saqlandi!</b>\n\n` +
      `🔗 <b>Havola:</b> <code>${saved}</code>${expiryMsg}\n` +
      `⚙️ <b>Holat:</b> FAOL ✅\n\n` +
      `Foydalanuvchilar Mini App orqali Canva Pro olishlari mumkin!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 Canva Pro Sozlamalari', callback_data: 'admin_canva_menu' }],
            [{ text: '📅 Muddatni tanlash', callback_data: 'admin_canva_choose_expiry' }]
          ]
        }
      }
    );
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
      `💎 **Canva Pro olganlar:** ${stats.canvaProClaims} ta (${stats.hasCanvaProLink ? (stats.canvaProEnabled ? 'Faol ✅' : 'To\'xtatilgan ❌') : 'Havola yo\'q ⚠️'})\n\n` +
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

  // Canva Pro Link Input Handler
  if (adminState[userId] === 'awaiting_canva_pro_link') {
    adminState[userId] = null;
    let cleanText = text.trim();
    if (!cleanText.startsWith('http://') && !cleanText.startsWith('https://')) {
      cleanText = `https://${cleanText}`;
    }
    const [cleanLink, cleanExpiry] = cleanText.split('|').map(s => s.trim());
    const saved = db.setCanvaProLink(cleanLink, cleanExpiry || null);
    const expiryMsg = cleanExpiry ? `\n📅 <b>Muddati:</b> <code>${cleanExpiry}</code>` : '';
    return bot.sendMessage(
      chatId,
      `✅ <b>Canva Pro taklif havolasi muvaffaqiyatli saqlandi va faollashtirildi!</b>\n\n` +
      `🔗 <b>Havola:</b> <code>${saved}</code>${expiryMsg}\n` +
      `⚙️ <b>Holat:</b> FAOL ✅\n\n` +
      `Foydalanuvchilar Mini App orqali Canva Pro jamoasiga qo'shila oladilar!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 Canva Pro Menyu', callback_data: 'admin_canva_menu' }],
            [{ text: '📅 Muddatni tanlash', callback_data: 'admin_canva_choose_expiry' }]
          ]
        }
      }
    );
  }

  // Canva Pro Expiry Input Handler
  if (adminState[userId] === 'awaiting_canva_pro_expiry') {
    adminState[userId] = null;
    const cleanExpiry = text.trim();
    db.setCanvaProExpiry(cleanExpiry);
    return bot.sendMessage(
      chatId,
      `✅ <b>Canva Pro amal qilish muddati belgilandi!</b>\n\n` +
      `📅 <b>Muddat:</b> <code>${cleanExpiry}</code>\n\n` +
      `Ushbu muddat Mini App'da foydalanuvchilarga ko'rinib turadi!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 Canva Pro Menyu', callback_data: 'admin_canva_menu' }]
          ]
        }
      }
    );
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
