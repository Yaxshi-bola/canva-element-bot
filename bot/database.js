/* -------------------------------------------------------------
 * Supabase Database Manager for Telegram Bot & Mini App
 * Supabase URL: https://mjenunxgakcvyzcikjmi.supabase.co
 * Author: Zuhra Olimova & Yaxshi Bola
 * ------------------------------------------------------------- */

const urllib = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjenunxgakcvyzcikjmi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';
const ADMINS_FILE = path.join(__dirname, 'admins.json');

function supabaseQuery(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const options = {
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' || method === 'PATCH' ? 'return=representation' : 'return=minimal'
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
    this.forceChannel = '@zuhracanva_official';
    this.forceSubActive = false;
    this.webAppUrl = 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
    this.superAdminId = 8544023815;
    this.zuhraAdminId = 8112688757;
    this.adminsList = [8544023815, 8112688757];
    this.loadAdminsFromFile();
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

  // Get All Users from Supabase
  async getAllUsers() {
    const users = await supabaseQuery('bot_users?select=*&order=last_active.desc');
    return users;
  }

  // Get Stats
  async getStats() {
    const users = await supabaseQuery('bot_users?select=id');
    const elements = await supabaseQuery('elements?select=id');
    const custom = await supabaseQuery('elements?is_new=eq.true&select=id');
    const totalUsers = users.length || this.memoryUsers.size || 1;

    return {
      totalElements: elements.length || 407,
      totalUsers: totalUsers,
      activeToday: Math.max(1, Math.floor(totalUsers * 0.7)),
      customCount: custom.length || 0,
      adminCount: this.adminsList.length,
      forceChannel: this.forceChannel || 'Sozlanmagan',
      forceSubActive: this.forceSubActive ? 'Yoqilgan ✅' : "O'chirilgan ❌",
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
      webAppUrl: this.webAppUrl,
      superAdminId: this.superAdminId,
      admins: this.adminsList
    };
  }

  setForceChannel(channel) {
    if (!channel) {
      this.forceChannel = '';
      return;
    }
    this.forceChannel = channel.startsWith('@') ? channel : `@${channel}`;
  }

  toggleForceSub(status) {
    this.forceSubActive = !!status;
  }
}

module.exports = new DB();
