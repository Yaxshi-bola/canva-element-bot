/* -------------------------------------------------------------
 * JSON Database Manager for Telegram Bot & Custom Elements
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const defaultData = {
  users: {},
  customElements: [
    {
      id: 'custom_1',
      category: 'Trenddagi 3D Elementlar',
      code: 'set:nAG35oM8lfI',
      description: 'Shisha element 3D (Yangi)',
      date: new Date().toISOString(),
      isNew: true
    }
  ],
  settings: {
    forceChannel: '',
    forceChannelLink: '',
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
      customElements: parsed.customElements || defaultData.customElements,
      settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      stats: { ...defaultData.stats, ...(parsed.stats || {}) }
    };
  } catch (err) {
    console.error('Error loading DB:', err);
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

  // Add Custom Canva Element
  addCustomElement(code, description, category) {
    const newElement = {
      id: `custom_${Date.now()}`,
      code: code.trim(),
      description: description.trim(),
      category: category.trim() || 'Trenddagi 3D Elementlar',
      date: new Date().toISOString(),
      isNew: true
    };
    this.data.customElements.unshift(newElement);
    saveData(this.data);
    return newElement;
  }

  // Get Custom Elements
  getCustomElements() {
    return this.data.customElements || [];
  }

  // Get Stats
  getStats() {
    const allUsers = Object.values(this.data.users);
    const totalUsers = allUsers.length;
    const today = new Date().toISOString().split('T')[0];
    const activeToday = allUsers.filter(u => u.last_active_date === today).length;
    const customCount = (this.data.customElements || []).length;

    return {
      totalUsers,
      activeToday,
      customCount,
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
}

module.exports = new DB();
