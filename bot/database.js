/* -------------------------------------------------------------
 * JSON Database Manager for Telegram Bot
 * Admin ID: 8544023815
 * ------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const defaultData = {
  users: {},
  settings: {
    forceChannel: '', // e.g. "@mychannel" or "-100123456789"
    forceChannelLink: '', // e.g. "https://t.me/mychannel"
    forceSubActive: false,
    webAppUrl: 'https://canva-element-kodlari-zuhra-olimova.vercel.app'
  },
  stats: {
    totalBroadcasts: 0
  }
};

function loadData() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      saveData(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || {},
      settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      stats: { ...defaultData.stats, ...(parsed.stats || {}) }
    };
  } catch (err) {
    console.error('Error loading DB, using defaults:', err);
    return defaultData;
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

class DB {
  constructor() {
    this.data = loadData();
  }

  // Register or Update User
  saveUser(telegramId, userInfo = {}) {
    const id = String(telegramId);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!this.data.users[id]) {
      this.data.users[id] = {
        id: telegramId,
        username: userInfo.username || '',
        first_name: userInfo.first_name || '',
        created_at: now,
        last_active: now,
        last_active_date: today
      };
    } else {
      this.data.users[id].username = userInfo.username || this.data.users[id].username;
      this.data.users[id].first_name = userInfo.first_name || this.data.users[id].first_name;
      this.data.users[id].last_active = now;
      this.data.users[id].last_active_date = today;
    }
    saveData(this.data);
  }

  // Get Stats
  getStats() {
    const allUsers = Object.values(this.data.users);
    const totalUsers = allUsers.length;
    const today = new Date().toISOString().split('T')[0];
    const activeToday = allUsers.filter(u => u.last_active_date === today).length;

    return {
      totalUsers,
      activeToday,
      forceChannel: this.data.settings.forceChannel || 'Sozlanmagan',
      forceSubActive: this.data.settings.forceSubActive ? 'Yoqilgan ✅' : 'O\'chirilgan ❌',
      webAppUrl: this.data.settings.webAppUrl
    };
  }

  // Get All User IDs
  getAllUserIds() {
    return Object.keys(this.data.users);
  }

  // Settings getters & setters
  getSettings() {
    return this.data.settings;
  }

  setForceChannel(channel, link = '') {
    this.data.settings.forceChannel = channel;
    this.data.settings.forceChannelLink = link || (channel.startsWith('@') ? `https://t.me/${channel.replace('@', '')}` : channel);
    this.data.settings.forceSubActive = !!channel;
    saveData(this.data);
  }

  toggleForceSub(status) {
    this.data.settings.forceSubActive = status;
    saveData(this.data);
  }

  setWebAppUrl(url) {
    this.data.settings.webAppUrl = url;
    saveData(this.data);
  }
}

module.exports = new DB();
