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
    this.forceChannels = ['@zuhracanva_official'];
    this.forceSubActive = false;
    this.webAppUrl = 'https://canva-element-kodlari-zuhra-olimova.vercel.app';
    this.superAdminId = 8544023815;
    this.zuhraAdminId = 8112688757;
    this.adminsList = [8544023815, 8112688757];
    this.blockedUsers = new Set();
    this.joinRequestMode = 'approve_all'; // 'approve_all' | 'female_only' | 'male_only' | 'manual'

    this.loadAdminsFromFile();
    this.loadDbFile();
  }

  loadDbFile() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        if (parsed.settings) {
          if (Array.isArray(parsed.settings.forceChannels) && parsed.settings.forceChannels.length > 0) {
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
      return true;
    }
    return false;
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
    const allUsersList = await this.getAllUsers();
    const elements = await supabaseQuery('elements?select=id');
    const custom = await supabaseQuery('elements?is_new=eq.true&select=id');

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
      totalElements: elements.length || 407,
      totalUsers: totalUsers,
      activeToday: Math.max(active24h, 1),
      femaleCount: femaleCount,
      maleCount: maleCount,
      unknownCount: unknownCount,
      customCount: custom.length || 0,
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

