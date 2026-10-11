/**
 * Cloudflare Worker for Canva Element Telegram Bot & Mini App API
 * - 24/7 Serverless Webhook Bot (Never Sleeps)
 * - Cloudflare R2 Storage Integration
 * - Force Channel Subscription Validation
 * - Interactive Admin Inline Keyboards & Management
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers for Mini App
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-telegram-init-data',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health Check / Ping
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        ok: true,
        service: 'Canva Element Bot Worker',
        bot: '@Zuhracanva_bot',
        status: 'Online 24/7 (Edge Webhook)',
        r2_connected: !!env.R2_BUCKET,
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // API: Get Elements from R2 or fallback
    if (url.pathname === '/api/elements' && request.method === 'GET') {
      try {
        if (env.R2_BUCKET) {
          const r2Obj = await env.R2_BUCKET.get('elements.json');
          if (r2Obj) {
            const text = await r2Obj.text();
            return new Response(text, {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (e) {
        console.error('R2 elements error:', e);
      }
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // API: Get / Save Settings
    if (url.pathname === '/api/settings') {
      if (request.method === 'GET') {
        const settings = await getSettingsFromR2(env);
        return new Response(JSON.stringify(settings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          await saveSettingsToR2(env, body);
          return new Response(JSON.stringify({ ok: true, settings: body }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // TELEGRAM WEBHOOK HANDLER
    if (request.method === 'POST') {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (err) {
        console.error('Webhook error:', err);
        return new Response('OK', { status: 200 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Handle incoming Telegram Update
 */
async function handleTelegramUpdate(update, env) {
  const botToken = env.BOT_TOKEN;
  const superAdminId = Number(env.SUPER_ADMIN_ID || 8544023815);
  const webAppUrl = env.WEB_APP_URL || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';

  if (!botToken) return;

  try {
    // 1. Process Messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const userId = msg.from?.id;
      const text = (msg.text || '').trim();
      const firstName = msg.from?.first_name || 'Foydalanuvchi';

      if (!chatId || !userId) return;

      // Save user to R2 in background
      if (env.R2_BUCKET) {
        try {
          const userData = {
            id: userId,
            username: msg.from?.username || '',
            first_name: firstName,
            last_name: msg.from?.last_name || '',
            updated_at: new Date().toISOString()
          };
          await env.R2_BUCKET.put(`users/${userId}.json`, JSON.stringify(userData));
        } catch (e) {}
      }

      // /start command
      if (text.startsWith('/start')) {
        const settings = await getSettingsFromR2(env);
        const isSub = await checkSubscription(botToken, userId, settings.forceChannels, settings.forceSubActive);

        if (!isSub.subscribed) {
          let channelButtons = isSub.missing.map((ch, idx) => {
            const cleanName = ch.replace('@', '');
            const url = ch.startsWith('-100') ? `https://t.me/c/${ch.replace('-100', '')}` : `https://t.me/${cleanName}`;
            return [{ text: `📢 ${idx + 1}-kanalga a'zo bo'lish`, url: url }];
          });

          channelButtons.push([{ text: '✅ A\'zo bo\'ldim / Tekshirish', callback_data: 'check_sub' }]);

          const promptText = `🛑 <b>Botdan foydalanish uchun homiy kanalimizga obuna bo'ling!</b>\n\n` +
            `Kanallarga a'zo bo'lgach, <b>"A'zo bo'ldim / Tekshirish"</b> tugmasini bosing:`;

          await tgSendMessage(botToken, chatId, promptText, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: channelButtons }
          });
          return;
        }

        // Subscribed -> send welcome message
        await sendWelcome(botToken, chatId, userId, firstName, webAppUrl, userId === superAdminId);
        return;
      }

      // /admin command
      if (text === '/admin' || text === '/stat') {
        if (userId === superAdminId) {
          await renderAdminDashboard(botToken, chatId, userId, env);
          return;
        }
      }

      // /addchannel command
      if (text.startsWith('/addchannel') && userId === superAdminId) {
        const parts = text.split(/\s+/);
        const chInput = parts[1];
        if (!chInput) {
          await tgSendMessage(botToken, chatId, '⚠️ Iltimos, kanal username kiritilgan bo\'lishi kerak:\n<code>/addchannel @kanal_username</code>', { parse_mode: 'HTML' });
          return;
        }
        const settings = await getSettingsFromR2(env);
        let clean = chInput.trim().replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/[\/\?#].*$/, '');
        if (!clean.startsWith('@') && !/^-?\d+$/.test(clean)) clean = '@' + clean;

        if (!settings.forceChannels.includes(clean)) {
          settings.forceChannels.push(clean);
          settings.forceSubActive = true;
          await saveSettingsToR2(env, settings);
          await tgSendMessage(botToken, chatId, `✅ <b>Kanal muvaffaqiyatli qo'shildi:</b> <code>${clean}</code>\nMajburiy obuna avtomatik faollashtirildi!`, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔗 Kanallar ro\'yxati', callback_data: 'admin_channels' }],
                [{ text: '◀️ Admin menyusi', callback_data: 'admin_main' }]
              ]
            }
          });
        } else {
          await tgSendMessage(botToken, chatId, `⚠️ Bu kanal allaqachon ro'yxatda mavjud: <code>${clean}</code>`, { parse_mode: 'HTML' });
        }
        return;
      }

      // /delchannel command
      if (text.startsWith('/delchannel') && userId === superAdminId) {
        const parts = text.split(/\s+/);
        const chInput = parts[1];
        if (!chInput) {
          await tgSendMessage(botToken, chatId, '⚠️ Format: <code>/delchannel @kanal_username</code>', { parse_mode: 'HTML' });
          return;
        }
        const settings = await getSettingsFromR2(env);
        let clean = chInput.trim();
        if (!clean.startsWith('@') && !/^-?\d+$/.test(clean)) clean = '@' + clean;

        const idx = settings.forceChannels.indexOf(clean);
        if (idx !== -1) {
          settings.forceChannels.splice(idx, 1);
          await saveSettingsToR2(env, settings);
          await tgSendMessage(botToken, chatId, `🗑 <b>Kanal o'chirildi:</b> <code>${clean}</code>`, { parse_mode: 'HTML' });
        } else {
          await tgSendMessage(botToken, chatId, `⚠️ Kanal topilmadi: <code>${clean}</code>`, { parse_mode: 'HTML' });
        }
        return;
      }
    }

    // 2. Process Callback Queries
    if (update.callback_query) {
      const q = update.callback_query;
      const chatId = q.message?.chat?.id;
      const userId = q.from?.id;
      const messageId = q.message?.message_id;
      const data = q.data;
      const firstName = q.from?.first_name || 'Foydalanuvchi';

      if (!chatId || !userId) return;

      // User: Check Subscription
      if (data === 'check_sub') {
        const settings = await getSettingsFromR2(env);
        const isSub = await checkSubscription(botToken, userId, settings.forceChannels, settings.forceSubActive);

        if (isSub.subscribed) {
          await tgAnswerCallbackQuery(botToken, q.id, '✅ Obuna tasdiqlandi!');
          try {
            await tgDeleteMessage(botToken, chatId, messageId);
          } catch (e) {}
          await sendWelcome(botToken, chatId, userId, firstName, webAppUrl, userId === superAdminId);
        } else {
          await tgAnswerCallbackQuery(botToken, q.id, '⚠️ Siz hali homiy kanallarga a\'zo bo\'lmadingiz!', true);
        }
        return;
      }

      // ADMIN ONLY ACTIONS
      if (userId === superAdminId) {
        // Admin: Main Dashboard
        if (data === 'admin_main') {
          await tgAnswerCallbackQuery(botToken, q.id);
          await renderAdminDashboard(botToken, chatId, userId, env, messageId);
          return;
        }

        // Admin: Toggle Force Subscription
        if (data === 'admin_toggle_sub') {
          const settings = await getSettingsFromR2(env);
          settings.forceSubActive = !settings.forceSubActive;
          await saveSettingsToR2(env, settings);
          await tgAnswerCallbackQuery(botToken, q.id, `Obuna: ${settings.forceSubActive ? 'Yoqildi ✅' : 'O\'chirildi ❌'}`);
          await renderAdminDashboard(botToken, chatId, userId, env, messageId);
          return;
        }

        // Admin: Channels Menu
        if (data === 'admin_channels') {
          await tgAnswerCallbackQuery(botToken, q.id);
          await renderChannelsMenu(botToken, chatId, env, messageId);
          return;
        }

        // Admin: Delete Channel by Index
        if (data.startsWith('admin_del_chan_')) {
          const idx = parseInt(data.replace('admin_del_chan_', ''), 10);
          const settings = await getSettingsFromR2(env);
          if (settings.forceChannels && settings.forceChannels[idx]) {
            const removed = settings.forceChannels.splice(idx, 1)[0];
            await saveSettingsToR2(env, settings);
            await tgAnswerCallbackQuery(botToken, q.id, `🗑 ${removed} o'chirildi!`);
            await renderChannelsMenu(botToken, chatId, env, messageId);
          } else {
            await tgAnswerCallbackQuery(botToken, q.id, '⚠️ Kanal topilmadi!');
          }
          return;
        }

        // Admin: Add Channel Prompt
        if (data === 'admin_prompt_add') {
          await tgAnswerCallbackQuery(botToken, q.id);
          const promptMsg = `➕ <b>YANGI HOMIY KANAL QO'SHISH</b>\n\n` +
            `Kanal qo'shish uchun botga quyidagi buyruqni yuboring:\n` +
            `<code>/addchannel @kanal_username</code>\n\n` +
            `<i>Eslatma: Botni ushbu kanalga administrator qilib qo'yishni unutmang!</i>`;
          await tgSendMessage(botToken, chatId, promptMsg, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '◀️ Orqaga', callback_data: 'admin_channels' }]
              ]
            }
          });
          return;
        }

        // Admin: Statistics
        if (data === 'admin_stats') {
          await tgAnswerCallbackQuery(botToken, q.id);
          const settings = await getSettingsFromR2(env);
          
          let userCount = 'Noma\'lum';
          if (env.R2_BUCKET) {
            try {
              const list = await env.R2_BUCKET.list({ prefix: 'users/' });
              userCount = list.objects ? list.objects.length : '0';
            } catch (e) {}
          }

          const statsText = `📊 <b>BOT STATISTIKASI VA BULUT HOLATI</b>\n\n` +
            `👥 <b>Ro'yxatdan o'tgan foydalanuvchilar:</b> ${userCount} ta\n` +
            `🎨 <b>Canva elementlari:</b> 408+ ta\n` +
            `📢 <b>Majburiy kanallar:</b> ${settings.forceChannels?.length || 0} ta\n` +
            `⚙️ <b>Majburiy obuna:</b> ${settings.forceSubActive ? 'FAOL ✅' : 'NOFAOL ❌'}\n` +
            `☁️ <b>Cloudflare R2 Bucket:</b> <code>canva-elements</code> (Ulangan ✅)\n` +
            `⚡ <b>Ishlash tartibi:</b> Serverless Cloudflare Worker 24/7`;

          await tgEditMessageText(botToken, chatId, messageId, statsText, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔄 Yangilash', callback_data: 'admin_stats' },
                  { text: '◀️ Orqaga', callback_data: 'admin_main' }
                ]
              ]
            }
          });
          return;
        }

        // Admin: Backup trigger
        if (data === 'admin_backup') {
          const settings = await getSettingsFromR2(env);
          const backupObj = {
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            settings: settings
          };
          if (env.R2_BUCKET) {
            await env.R2_BUCKET.put(`backups/manual_${backupObj.date}.json`, JSON.stringify(backupObj, null, 2));
          }
          await tgAnswerCallbackQuery(botToken, q.id, '💾 R2 ga zaxira nusxa saqlandi!', true);
          return;
        }
      }
    }

    // 3. Process Chat Join Request
    if (update.chat_join_request) {
      const req = update.chat_join_request;
      const userChatId = req.user_chat_id;
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/approveChatJoinRequest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: req.chat.id, user_id: req.from.id })
        });
        await tgSendMessage(botToken, userChatId, `🎉 <b>Kanalga qo'shilish so'rovingiz qabul qilindi!</b>\n\nCanva element kodlaridan foydalanish uchun /start bosing.`, { parse_mode: 'HTML' });
      } catch (e) {}
    }
  } catch (err) {
    console.error('handleTelegramUpdate top-level error:', err);
  }
}

/**
 * Render Super Admin Dashboard
 */
async function renderAdminDashboard(botToken, chatId, userId, env, messageId = null) {
  const settings = await getSettingsFromR2(env);
  const webAppUrl = env.WEB_APP_URL || 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
  const superAdminId = Number(env.SUPER_ADMIN_ID || 8544023815);

  const channelsList = settings.forceChannels?.length > 0 
    ? settings.forceChannels.map(c => `• <code>${c}</code>`).join('\n')
    : '<i>Hozircha kanallar yo\'q</i>';

  const adminText = `👑 <b>SUPER ADMIN BOSHQARUV PANELI</b>\n\n` +
    `🆔 <b>Admin ID:</b> <code>${superAdminId}</code>\n` +
    `⚙️ <b>Majburiy obuna:</b> ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}\n\n` +
    `📢 <b>Ulangan kanallar (${settings.forceChannels?.length || 0} ta):</b>\n${channelsList}\n\n` +
    `Kerakli bo'limni tanlang:`;

  const inlineKeyboard = [
    [
      { text: '📊 Statistika', callback_data: 'admin_stats' },
      { text: '🔗 Kanallar boshqaruvi', callback_data: 'admin_channels' }
    ],
    [
      { text: '➕ Kanal qo\'shish', callback_data: 'admin_prompt_add' },
      { text: `⚙️ Obuna: ${settings.forceSubActive ? 'O\'chirish ❌' : 'Yoqish ✅'}`, callback_data: 'admin_toggle_sub' }
    ],
    [
      { text: '💾 Zaxira nusxa (R2)', callback_data: 'admin_backup' },
      { text: '🎨 Mini App (Admin)', web_app: { url: `${webAppUrl}?admin=1&user_id=${userId}` } }
    ]
  ];

  if (messageId) {
    await tgEditMessageText(botToken, chatId, messageId, adminText, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  } else {
    await tgSendMessage(botToken, chatId, adminText, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  }
}

/**
 * Render Channels List Menu with Delete Buttons
 */
async function renderChannelsMenu(botToken, chatId, env, messageId = null) {
  const settings = await getSettingsFromR2(env);
  const channels = settings.forceChannels || [];

  let text = `🔗 <b>MAJBURlY OBUNA KANALLARI RO'YXATI</b>\n\n`;
  text += `⚙️ <b>Holat:</b> ${settings.forceSubActive ? 'YOQILGAN ✅' : 'O\'CHIRILGAN ❌'}\n\n`;

  const inlineKeyboard = [];

  if (channels.length === 0) {
    text += `<i>Hozircha hech qanday kanal ulanmagan.</i>`;
  } else {
    text += `Kanalni o'chirish uchun uning yonidagi qizil tugmani bosing:\n`;
    channels.forEach((ch, idx) => {
      inlineKeyboard.push([
        { text: `❌ ${ch} ni o'chirish`, callback_data: `admin_del_chan_${idx}` }
      ]);
    });
  }

  inlineKeyboard.push([
    { text: '➕ Yangi kanal qo\'shish', callback_data: 'admin_prompt_add' },
    { text: `⚙️ Obuna: ${settings.forceSubActive ? 'O\'chirish ❌' : 'Yoqish ✅'}`, callback_data: 'admin_toggle_sub' }
  ]);
  inlineKeyboard.push([
    { text: '◀️ Asosiy menyu', callback_data: 'admin_main' }
  ]);

  if (messageId) {
    await tgEditMessageText(botToken, chatId, messageId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  } else {
    await tgSendMessage(botToken, chatId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  }
}

/**
 * Send Welcome Message with Mini App Button
 */
async function sendWelcome(botToken, chatId, userId, firstName, webAppUrl, isAdmin = false) {
  const ts = Date.now();
  const appUrl = isAdmin 
    ? `${webAppUrl}?admin=1&user_id=${userId}&v=${ts}` 
    : `${webAppUrl}?user_id=${userId}&v=${ts}`;

  const welcomeText = `🌸 <b>Canva Element Kodlari — Zuhra Olimova</b>\n\n` +
    `Assalomu alaykum, <b>${escapeHtml(firstName)}</b>! 💖\n\n` +
    `Ushbu bot orqali siz Canva dizaynlaringiz uchun <b>400+</b> saralangan element kodlarini bir bosishda topishingiz mumkin:\n\n` +
    `• ✨ <b>3D elementlar</b>\n` +
    `• 🌷 <b>Estetik bezaklar</b>\n` +
    `• 🎯 <b>SMM elementlari</b>\n` +
    `• 🎬 <b>Animatsiyali elementlar</b>\n\n` +
    `⚡ <b>Tezkor qidiruv</b> • 📋 <b>Oson nusxalash</b>\n\n` +
    `👇 <b>Mini App’ni ochish uchun pastdagi tugmani bosing!</b>`;

  const inlineKeyboard = [
    [
      {
        text: '🎨 Canva Element Kodlari (Mini App)',
        web_app: { url: appUrl }
      }
    ]
  ];

  if (isAdmin) {
    inlineKeyboard.push([
      { text: '👑 Admin Boshqaruv Paneli', callback_data: 'admin_main' }
    ]);
  }

  await tgSendMessage(botToken, chatId, welcomeText, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

/**
 * Check User Subscription
 */
async function checkSubscription(botToken, userId, channels, forceSubActive) {
  if (!forceSubActive || !Array.isArray(channels) || channels.length === 0) {
    return { subscribed: true, missing: [] };
  }

  const missing = [];
  for (const channel of channels) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${userId}`);
      const data = await res.json();
      if (data.ok) {
        const status = data.result?.status;
        if (!['creator', 'administrator', 'member'].includes(status)) {
          missing.push(channel);
        }
      } else {
        // If bot is not admin in channel, do NOT block user
        console.warn('Channel check warning:', data.description);
      }
    } catch (e) {
      console.error('getChatMember error:', e);
    }
  }

  return {
    subscribed: missing.length === 0,
    missing: missing
  };
}

/**
 * Get Settings from R2
 */
async function getSettingsFromR2(env) {
  let settings = {
    forceChannels: [],
    forceSubActive: false,
    webAppUrl: env.WEB_APP_URL || 'https://canva-element-kodlari-zuhra-olimova.vercel.app',
    banners: []
  };

  if (env.R2_BUCKET) {
    try {
      const obj = await env.R2_BUCKET.get('settings.json');
      if (obj) {
        const text = await obj.text();
        const parsed = JSON.parse(text);
        return { ...settings, ...parsed };
      }
    } catch (e) {
      console.warn('getSettingsFromR2 parse error:', e);
    }
  }
  return settings;
}

/**
 * Save Settings to R2
 */
async function saveSettingsToR2(env, settings) {
  if (env.R2_BUCKET) {
    try {
      await env.R2_BUCKET.put('settings.json', JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error('saveSettingsToR2 error:', e);
    }
  }
}

/**
 * Telegram API Helpers
 */
async function tgSendMessage(token, chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...options })
  });
  return res.json();
}

async function tgEditMessageText(token, chatId, messageId, text, options = {}) {
  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, ...options })
  });
  return res.json();
}

async function tgAnswerCallbackQuery(token, queryId, text = '', showAlert = false) {
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: queryId, text, show_alert: showAlert })
  });
  return res.json();
}

async function tgDeleteMessage(token, chatId, messageId) {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
  return res.json();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
