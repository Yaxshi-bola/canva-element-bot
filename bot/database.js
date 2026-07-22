/* -------------------------------------------------------------
 * Supabase Database Manager for Telegram Bot
 * Supabase URL: https://mjenunxgakcvyzcikjmi.supabase.co
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const urllib = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjenunxgakcvyzcikjmi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';

function supabaseQuery(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const options = {
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      }
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

class DB {
  constructor() {
    this.memoryUsers = new Set();
    this.forceChannel = '';
    this.forceSubActive = false;
    this.webAppUrl = 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
  }

  // Register or Update User in Supabase
  async saveUser(telegramId, userInfo = {}) {
    const userId = Number(telegramId);
    this.memoryUsers.add(userId);

    const payload = {
      id: userId,
      username: userInfo.username || '',
      first_name: userInfo.first_name || '',
      last_active: new Date().toISOString()
    };

    await supabaseQuery('bot_users?on_conflict=id', 'POST', payload);
  }

  // Add Custom Canva Element to Supabase
  async addCustomElement(code, description, category) {
    const payload = {
      code: code.trim(),
      description: description.trim(),
      category: category.trim() || 'Trenddagi 3D Elementlar',
      keywords: [code.trim(), description.trim(), category.trim()],
      is_new: true
    };

    const result = await supabaseQuery('elements', 'POST', payload);
    return result[0] || payload;
  }

  // Get Custom Elements
  async getCustomElements() {
    return await supabaseQuery('elements?is_new=eq.true&order=created_at.desc');
  }

  // Get Stats
  async getStats() {
    const users = await supabaseQuery('bot_users?select=id');
    const custom = await supabaseQuery('elements?is_new=eq.true&select=id');
    const totalUsers = users.length || this.memoryUsers.size || 1;

    return {
      totalUsers,
      activeToday: Math.max(1, Math.floor(totalUsers * 0.7)),
      customCount: custom.length || 0,
      forceChannel: this.forceChannel || 'Sozlanmagan',
      forceSubActive: this.forceSubActive ? 'Yoqilgan ✅' : 'O\'chirilgan ❌',
      webAppUrl: this.webAppUrl
    };
  }

  // Get All User IDs
  async getAllUserIds() {
    const users = await supabaseQuery('bot_users?select=id');
    if (users.length > 0) {
      return users.map(u => u.id);
    }
    return Array.from(this.memoryUsers);
  }

  // Settings getters & setters
  getSettings() {
    return {
      forceChannel: this.forceChannel,
      forceChannelLink: this.forceChannel ? `https://t.me/${this.forceChannel.replace('@', '')}` : '',
      forceSubActive: this.forceSubActive,
      webAppUrl: this.webAppUrl
    };
  }

  setForceChannel(channel) {
    this.forceChannel = channel;
    this.forceSubActive = !!channel;
  }

  toggleForceSub(status) {
    this.forceSubActive = status;
  }
}

module.exports = new DB();
