/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Mini App — Logic & Admin Panel v5
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp SDK Initialization
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#fff5f9');
      }
    } catch (e) {}
  }

  // Supabase REST Config
  const SUPABASE_URL = 'https://mjenunxgakcvyzcikjmi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';

  // Core Admin Default IDs
  const SUPER_ADMIN_ID = 8544023815;
  const ZUHRA_ADMIN_ID = 8112688757;
  const CORE_ADMINS = [8544023815, 8112688757];

  // Data State with Safe LocalStorage Parsers
  let allElements = Array.isArray(window.CANVA_DATA) ? window.CANVA_DATA : [];
  
  let favorites = [];
  try {
    const rawFavs = localStorage.getItem('zo_canva_favs');
    if (rawFavs) {
      const parsed = JSON.parse(rawFavs);
      if (Array.isArray(parsed)) favorites = parsed;
    }
  } catch (e) {
    favorites = [];
  }

  let adminList = [SUPER_ADMIN_ID, ZUHRA_ADMIN_ID];
  try {
    localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
  } catch (e) {}

  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentTag = '';
  let activeTab = 'home';
  let isUserAdmin = false;

  // DOM Elements - Navigation & Main Views
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const elementsGrid = document.getElementById('elements-grid');
  const newsElementsGrid = document.getElementById('news-elements-grid');
  const favoritesElementsGrid = document.getElementById('favorites-elements-grid');
  const categoriesGrid = document.getElementById('categories-grid');
  const emptyState = document.getElementById('empty-state');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const currentCategoryTitle = document.getElementById('current-category-title');
  const statTotal = document.getElementById('stat-total');
  const statCategories = document.getElementById('stat-categories');
  const statFavs = document.getElementById('stat-favs');
  const favStatBtn = document.getElementById('fav-stat-btn');
  const toast = document.getElementById('toast');
  const toastCode = document.getElementById('toast-code');
  const toastTitle = document.getElementById('toast-title');
  const navItemAdmin = document.getElementById('nav-item-admin');

  // DOM Elements - Admin Panel
  const adminStatTotal = document.getElementById('admin-stat-total');
  const adminStatCategories = document.getElementById('admin-stat-categories');
  const adminStatUsers = document.getElementById('admin-stat-users');
  const adminStatAdmins = document.getElementById('admin-stat-admins');
  const adminBtnAddElement = document.getElementById('admin-btn-add-element');
  const adminBtnManageAdmins = document.getElementById('admin-btn-manage-admins');
  const adminBtnDownloadBackup = document.getElementById('admin-btn-download-backup');
  const adminBtnRefresh = document.getElementById('admin-btn-refresh');
  const adminSearchInput = document.getElementById('admin-search-input');
  const adminCategoryFilter = document.getElementById('admin-category-filter');
  const adminElementsList = document.getElementById('admin-elements-list');

  // DOM Elements - Modals
  const modalElementForm = document.getElementById('modal-element-form');
  const modalElementTitle = document.getElementById('modal-element-title');
  const modalElementClose = document.getElementById('modal-element-close');
  const btnCancelElement = document.getElementById('btn-cancel-element');
  const btnSaveElement = document.getElementById('btn-save-element');
  const formElementId = document.getElementById('form-element-id');
  const formElementCode = document.getElementById('form-element-code');
  const formElementDesc = document.getElementById('form-element-desc');
  const formElementCat = document.getElementById('form-element-cat');
  const formElementIcon = document.getElementById('form-element-icon');
  const formIconPreview = document.getElementById('form-icon-preview');
  const btnOpenIconPicker = document.getElementById('btn-open-icon-picker');
  const formElementKeywords = document.getElementById('form-element-keywords');
  const formElementIsNew = document.getElementById('form-element-isnew');
  const categoriesDatalist = document.getElementById('categories-datalist');

  const modalManageAdmins = document.getElementById('modal-manage-admins');
  const modalAdminsClose = document.getElementById('modal-admins-close');
  const btnCloseAdminsModal = document.getElementById('btn-close-admins-modal');
  const newAdminInput = document.getElementById('new-admin-input');
  const btnSaveNewAdmin = document.getElementById('btn-save-new-admin');
  const adminsListContainer = document.getElementById('admins-list-container');

  const modalIconPicker = document.getElementById('modal-icon-picker');
  const modalIconClose = document.getElementById('modal-icon-close');
  const btnCloseIconPicker = document.getElementById('btn-close-icon-picker');
  const iconSearchInput = document.getElementById('icon-search-input');
  const iconPickerGrid = document.getElementById('icon-picker-grid');

  const modalAdminLogin = document.getElementById('modal-admin-login');
  const modalLoginClose = document.getElementById('modal-login-close');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const adminPasscodeInput = document.getElementById('admin-passcode-input');
  const authorBadge = document.getElementById('author-badge');
  const adminLockBtn = document.getElementById('admin-lock-btn');

  // Curated FontAwesome Icons for Element & Category Picker
  const POPULAR_ICONS = [
    { class: 'fa-box-open', name: '3D Box' },
    { class: 'fa-shapes', name: 'Shakllar' },
    { class: 'fa-sparkles', name: 'Estetik' },
    { class: 'fa-bullhorn', name: 'SMM' },
    { class: 'fa-rocket', name: 'Kosmos' },
    { class: 'fa-face-smile-beam', name: 'Kulgu' },
    { class: 'fa-seedling', name: 'Gullar' },
    { class: 'fa-trophy', name: 'Sport' },
    { class: 'fa-laptop-code', name: 'Texnologiya' },
    { class: 'fa-user-tie', name: 'Kasb' },
    { class: 'fa-film', name: 'Animatsiya' },
    { class: 'fa-leaf', name: 'Kuz' },
    { class: 'fa-graduation-cap', name: 'Talaba' },
    { class: 'fa-chalkboard-user', name: 'O\'qituvchi' },
    { class: 'fa-utensils', name: 'Oshxona' },
    { class: 'fa-moon', name: 'Ramazon' },
    { class: 'fa-font', name: 'Harf' },
    { class: 'fa-baby', name: 'Bolalar' },
    { class: 'fa-heart', name: 'Pushti' },
    { class: 'fa-star', name: 'Yulduz' },
    { class: 'fa-crown', name: 'Toj' },
    { class: 'fa-wand-magic-sparkles', name: 'Sehr' },
    { class: 'fa-fire', name: 'Olov' },
    { class: 'fa-gem', name: 'Olmos' },
    { class: 'fa-palette', name: 'Dizayn' },
    { class: 'fa-icons', name: 'Ikonkalar' },
    { class: 'fa-images', name: 'Rasmlar' },
    { class: 'fa-gift', name: 'Sovg\'a' },
    { class: 'fa-bell', name: "Qo'ng'iroq" },
    { class: 'fa-lightbulb', name: "G'oya" },
    { class: 'fa-circle-check', name: 'Tasdiq' },
    { class: 'fa-music', name: 'Musiqa' },
    { class: 'fa-camera', name: 'Kamera' },
    { class: 'fa-shield-halved', name: 'Himoya' },
    { class: 'fa-border-all', name: 'Kattalik' }
  ];

  // Category Icon Mapping
  const CATEGORY_ICONS = {
    'Trenddagi 3D Elementlar': 'fa-box-open',
    'SMM, Target, Dizayn va Infografika': 'fa-bullhorn',
    'Abstrakt Elementlar va Shakllar': 'fa-shapes',
    'Aesthetic/Estetik Elementlar': 'fa-sparkles',
    'Kosmik Elementlar': 'fa-rocket',
    'Ajoyib va Qiziqarli Elementlar': 'fa-face-smile-beam',
    'Bog\' va Gullar': 'fa-seedling',
    'Sport, Musobaqa va Sovrinlar': 'fa-trophy',
    'Texnologiya, Kompyuter va Telefon': 'fa-laptop-code',
    'Kasblar va Ish Qurollari': 'fa-user-tie',
    'Animatsiyali stikerlar.': 'fa-film',
    'Kuzgi elementlar': 'fa-leaf',
    'Talabalar uchun': 'fa-graduation-cap',
    'O’qituvchilar uchun': 'fa-chalkboard-user',
    'Meva va sabzavotlar, Shirinliklar. Oshxona. Uy va xona': 'fa-utensils',
    'Ramazon': 'fa-moon',
    'Harflar va Raqamlar': 'fa-font',
    'Bolalar uchun': 'fa-baby',
    'Turli xil': 'fa-border-all',
    'Pushti elementlar': 'fa-heart'
  };

  // Uzbek Synonyms Map
  const SYNONYMS = {
    'shifokor': ['doktor', 'tibbiyot', 'medik', 'shifoxona', 'vrach', 'stomatolog'],
    'doktor': ['shifokor', 'tibbiyot', 'medik', 'shifoxona', 'vrach', 'stomatolog'],
    'kitob': ['maktab', 'ta\'lim', 'bilim', 'oqish', 'kutubxona', 'dars', 'daftar'],
    'maktab': ['kitob', 'dars', 'o\'qituvchi', 'talaba', 'bilim', 'alifbo'],
    'meva': ['sabzavot', 'oziq-ovqat', 'taom', 'shirinlik', 'pirog', 'muzqaymoq'],
    'ramazon': ['hayit', 'roza', 'iftor', 'masjid', 'islom', 'umra', 'haj'],
    'harf': ['alifbo', 'matn', 'yozuv', 'shrift', 'raqam'],
    'smm': ['target', 'instagram', 'reklama', 'biznes', 'marketing', 'infografika']
  };

  // Safe Helper: Check if item matches admin list
  function isAdminMatch(list, val) {
    if (!Array.isArray(list) || !val) return false;
    return list.some(a => String(a).toLowerCase() === String(val).toLowerCase() || Number(a) === Number(val));
  }

  // Check Admin Rights
  function checkAdminPermissions() {
    try {
      // Clean up legacy auth keys
      try { localStorage.removeItem('zo_admin_auth'); } catch (e) {}

      const tgUser = tg?.initDataUnsafe?.user;
      const urlParams = new URLSearchParams(window.location?.search || '');
      const paramUserId = urlParams.get('user_id');
      const sessionAuth = sessionStorage.getItem('zo_admin_session') === 'true';

      let userId = tgUser?.id || paramUserId;
      let username = tgUser?.username;

      const validUsernames = ['yomonbola', 'yomonboia', 'zuhraolimova', 'zuhra_olimova', 'sokin_notalar'];

      const isCoreId = userId && CORE_ADMINS.includes(Number(userId));
      const isCoreUsername = username && validUsernames.includes(String(username).toLowerCase());
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isCoreId || isCoreUsername || sessionAuth || isLocalhost) {
        isUserAdmin = true;
      } else {
        isUserAdmin = false;
      }

      if (isUserAdmin) {
        navItemAdmin?.classList.remove('hidden');
      } else {
        navItemAdmin?.classList.add('hidden');
        if (activeTab === 'admin') {
          switchTab('home');
        }
      }
    } catch (e) {
      console.error('Admin check error:', e);
      isUserAdmin = false;
      navItemAdmin?.classList.add('hidden');
    }
  }

  // Open Admin Passcode Login Modal
  function openAdminLoginModal() {
    if (isUserAdmin) {
      switchTab('admin');
      showToast('👑 Siz Admin siz!');
      return;
    }
    if (adminPasscodeInput) adminPasscodeInput.value = '';
    modalAdminLogin?.classList.remove('hidden');
    setTimeout(() => adminPasscodeInput?.focus(), 150);
  }

  // Submit Admin Passcode Login
  function handleAdminLoginSubmit() {
    const code = adminPasscodeInput ? adminPasscodeInput.value.trim() : '';
    const validCodes = ['8544023815', '8112688757'];

    if (validCodes.includes(code)) {
      sessionStorage.setItem('zo_admin_session', 'true');
      isUserAdmin = true;
      navItemAdmin?.classList.remove('hidden');
      modalAdminLogin?.classList.add('hidden');
      switchTab('admin');
      showToast('👑 Admin panel faollashtirildi!');
    } else {
      showToast('❌ Parol noto\'g\'ri!');
    }
  }

  // Author avatar click count (5 fast clicks) for secret admin access
  let badgeClickCount = 0;
  let badgeClickTimer = null;
  if (authorBadge) {
    authorBadge.addEventListener('click', (e) => {
      badgeClickCount++;
      if (badgeClickTimer) clearTimeout(badgeClickTimer);
      badgeClickTimer = setTimeout(() => { badgeClickCount = 0; }, 1500);

      if (badgeClickCount >= 5) {
        badgeClickCount = 0;
        openAdminLoginModal();
      }
    });
  }

  btnSubmitLogin?.addEventListener('click', handleAdminLoginSubmit);
  btnCancelLogin?.addEventListener('click', () => modalAdminLogin?.classList.add('hidden'));
  modalLoginClose?.addEventListener('click', () => modalAdminLogin?.classList.add('hidden'));
  adminPasscodeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLoginSubmit();
  });

  // Safe Escape Regex
  function escapeRegExp(string) {
    if (!string) return '';
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Highlight Matches
  function highlightMatches(text, query) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    if (!query || String(query).trim().length < 2) return str;
    try {
      const escaped = escapeRegExp(String(query).trim());
      const regex = new RegExp(`(${escaped})`, 'gi');
      return str.replace(regex, '<span class="highlight-text">$1</span>');
    } catch (e) {
      return str;
    }
  }

  // Fetch elements from Supabase REST API
  async function fetchSupabaseElements() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/elements?select=*&order=id.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allElements = data.map(item => ({
            id: item.id,
            category: item.category || 'Turli xil',
            code: item.code || '',
            description: item.description || '',
            isNew: !!item.is_new,
            keywords: Array.isArray(item.keywords) ? item.keywords : []
          }));
          updateStats();
          renderElements();
          renderCategoriesGrid();
          renderNewsElements();
          if (isUserAdmin) {
            renderAdminElements();
            populateCategoryDropdowns();
          }
        }
      }
    } catch (e) {
      console.log('Supabase fetch info:', e);
    }
  }

  // Fetch admins & ensure designated core admins list
  async function fetchSupabaseAdmins() {
    try {
      adminList = [SUPER_ADMIN_ID, ZUHRA_ADMIN_ID];
      localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
      updateStats();
      if (isUserAdmin) renderAdminsList();
    } catch (e) {
      console.log('Admins list sync info:', e);
    }
  }

  // Normalize Uzbek Diacritics
  function normalizeText(text) {
    if (!text) return '';
    return String(text).toLowerCase()
      .replace(/[‘'’`ʻ]/g, '')
      .replace(/o[ʻ'’`]/g, 'o')
      .replace(/g[ʻ'’`]/g, 'g')
      .trim();
  }

  // Levenshtein Distance
  function levenshtein(a, b) {
    if (!a) return (b || '').length;
    if (!b) return a.length;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Search Match Score
  function calculateSearchScore(rawQuery, item) {
    if (!item) return 0;
    const query = normalizeText(rawQuery);
    if (!query) return 1;

    let score = 0;
    const descNorm = normalizeText(item.description);
    const catNorm = normalizeText(item.category);
    const codeNorm = normalizeText(item.code);
    const keywordsNorm = normalizeText((item.keywords || []).join(' '));

    if (codeNorm.includes(query)) score += 1000;
    if (descNorm.includes(query)) score += 500;
    if (catNorm.includes(query)) score += 300;
    if (keywordsNorm.includes(query)) score += 200;

    for (const [key, syns] of Object.entries(SYNONYMS)) {
      const keyNorm = normalizeText(key);
      const isQueryInSyns = query.includes(keyNorm) || syns.some(s => query.includes(normalizeText(s)));
      if (isQueryInSyns) {
        if (descNorm.includes(keyNorm) || catNorm.includes(keyNorm) || syns.some(s => descNorm.includes(normalizeText(s)))) {
          score += 150;
        }
      }
    }

    const qWords = query.split(/\s+/);
    const targetWords = `${descNorm} ${catNorm} ${keywordsNorm}`.split(/[\s,.'"-]+/);

    for (const qw of qWords) {
      if (qw.length < 3) continue;
      for (const tw of targetWords) {
        if (tw.length < 3) continue;
        if (tw.startsWith(qw)) score += 100;
        const dist = levenshtein(qw, tw);
        if (dist <= 2 && Math.abs(qw.length - tw.length) <= 2) {
          score += (80 - dist * 20);
        }
      }
    }

    return score;
  }

  // Get Categories Map
  function getCategoriesMap() {
    const map = {};
    allElements.forEach(item => {
      if (item && item.category) {
        map[item.category] = (map[item.category] || 0) + 1;
      }
    });
    return map;
  }

  // Trigger Haptic Feedback
  function triggerHaptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      try {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
      } catch (e) {}
    }
  }

  // Toast Popup Message
  let toastTimer = null;
  function showToast(message, codeText = '') {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = message;
    if (toastCode) toastCode.textContent = codeText;
    toast.classList.remove('hidden');

    triggerHaptic('success');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // Copy Code to Clipboard
  function copyToClipboard(text, customToastMsg = 'KOD NUSXALANDI!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(customToastMsg, text);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(customToastMsg, text);
    });
  // Share Element to Friends / Telegram Chats
  function shareElement(code, desc) {
    if (!code) return;
    const cleanDesc = desc ? String(desc) : 'Canva premium element kodi';
    const shareMessage = `✨ Canva Element Kodi: ${code}\n📝 Tavsif: ${cleanDesc}\n\n🌸 400+ saralangan Canva elementlarini bepul topish uchun botimizga kiring:\n👉 https://t.me/canva_element_bot`;

    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/canva_element_bot')}&text=${encodeURIComponent(`✨ Canva Element Kodi: ${code}\n📝 Tavsif: ${cleanDesc}`)}`;
        window.Telegram.WebApp.openTelegramLink(tgShareUrl);
        showToast('🔗 Ulashish oynasi ochildi!');
        return;
      }
    } catch (e) {}

    if (navigator.share) {
      navigator.share({
        title: 'Canva Element Kodi',
        text: shareMessage
      }).catch((err) => {
        if (err && err.name !== 'AbortError') {
          copyToClipboard(shareMessage, '🔗 Ulashish matni nusxalandi!');
        }
      });
    } else {
      copyToClipboard(shareMessage, '🔗 Ulashish matni nusxalandi!');
    }
  }

  // Toggle Favorite
  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index > -1) {
      favorites.splice(index, 1);
      showToast('Saqlanganlardan olindi');
    } else {
      favorites.push(id);
      showToast('Saqlanganlarga qo\'shildi ⭐');
    }
    try {
      localStorage.setItem('zo_canva_favs', JSON.stringify(favorites));
    } catch (e) {}

    updateStats();
    renderElements();
    renderFavoritesElements();
  }

  // Update Counters & Stats
  function updateStats() {
    try {
      const catMap = getCategoriesMap();
      if (statTotal) statTotal.textContent = allElements.length;
      if (statCategories) statCategories.textContent = Object.keys(catMap).length;
      if (statFavs) statFavs.textContent = favorites.length;

      if (isUserAdmin) {
        if (adminStatTotal) adminStatTotal.textContent = allElements.length;
        if (adminStatCategories) adminStatCategories.textContent = Object.keys(catMap).length;
        if (adminStatUsers) adminStatUsers.textContent = '1+';
        if (adminStatAdmins) adminStatAdmins.textContent = adminList.length;
      }
    } catch (e) {
      console.error('Update stats error:', e);
    }
  }

  // Interleave elements across categories safely for Home View (Non-blocking)
  function getMixedHomeElements(elementsList) {
    if (!Array.isArray(elementsList) || elementsList.length === 0) return [];

    const catBuckets = {};
    elementsList.forEach(item => {
      if (!item) return;
      const cat = item.category || 'Turli xil';
      if (!catBuckets[cat]) catBuckets[cat] = [];
      catBuckets[cat].push(item);
    });

    const categoryKeys = Object.keys(catBuckets);
    const mixed = [];
    const maxBucketSize = Math.max(0, ...Object.values(catBuckets).map(b => b.length));

    for (let r = 0; r < maxBucketSize; r++) {
      for (let k = 0; k < categoryKeys.length; k++) {
        const item = catBuckets[categoryKeys[k]][r];
        if (item) {
          mixed.push(item);
        }
      }
    }

    return mixed;
  }

  // Filter & Rank Elements
  function getFilteredElements() {
    if (!Array.isArray(allElements)) return [];

    // If Home View with no query/tag filter, return interleave mixed elements
    if (currentCategory === 'all' && !currentSearchQuery && !currentTag) {
      return getMixedHomeElements(allElements);
    }

    const results = [];

    allElements.forEach(item => {
      if (!item) return;

      if (currentCategory === 'favorites') {
        if (!favorites.includes(item.id)) return;
      } else if (currentCategory !== 'all') {
        if (item.category !== currentCategory) return;
      }

      if (currentTag) {
        const itemStr = `${item.category || ''} ${item.description || ''} ${(item.keywords || []).join(' ')}`.toLowerCase();
        if (currentTag === '3d' && !itemStr.includes('3d')) return;
        if (currentTag === 'smm' && !itemStr.includes('smm') && !itemStr.includes('target') && !itemStr.includes('infografika')) return;
        if (currentTag === 'estetik' && !itemStr.includes('estetik') && !itemStr.includes('aesthetic')) return;
        if (currentTag === 'ramazon' && !itemStr.includes('ramazon') && !itemStr.includes('haj') && !itemStr.includes('umra')) return;
        if (currentTag === 'harf' && !itemStr.includes('harf') && !itemStr.includes('raqam') && !itemStr.includes('2026')) return;
      }

      if (currentSearchQuery) {
        const score = calculateSearchScore(currentSearchQuery, item);
        if (score > 0) {
          results.push({ item, score });
        }
      } else {
        results.push({ item, score: 1 });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.item);
  }

  // Generate Ultra-Compact Card HTML
  function renderCardHTML(item) {
    if (!item) return '';
    try {
      const itemId = item.id || Math.random();
      const isFav = Array.isArray(favorites) && (favorites.includes(itemId) || favorites.includes(String(itemId)));
      const favClass = isFav ? 'active fa-solid' : 'fa-regular';
      const newBadgeHTML = item.isNew ? `<span class="new-badge">NEW</span>` : '';
      const safeDesc = item.description ? String(item.description).replace(/"/g, '&quot;') : '';
      const safeCode = item.code ? String(item.code) : '';
      const safeCategory = item.category ? String(item.category) : 'Elementlar';
      const descHTML = highlightMatches(item.description ? String(item.description) : '', currentSearchQuery);

      return `
        <div class="element-card" data-id="${itemId}">
          <div class="card-header">
            <span class="category-tag"><i class="fa-solid fa-folder"></i> ${safeCategory} ${newBadgeHTML}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${itemId}" title="Saqlash">
              <i class="${favClass} fa-star"></i>
            </button>
          </div>
          
          <div class="element-description">
            ${descHTML}
          </div>
          
          <div class="code-box" data-code="${safeCode}" title="Nusxalash uchun bosing">
            <span class="code-text">${safeCode}</span>
            <i class="fa-regular fa-copy code-copy-icon"></i>
          </div>
          
          <div class="card-actions">
            <button class="btn-copy" data-code="${safeCode}">
              <i class="fa-solid fa-copy"></i> Nusxalash
            </button>
            <button class="btn-share" data-code="${safeCode}" data-desc="${safeDesc}" title="Do'stlarga ulashish">
              <i class="fa-solid fa-share-nodes"></i> Ulashish
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error rendering card:', err);
      return '';
    }
  }

  // Render Main Elements Grid
  function renderElements() {
    try {
      if (!elementsGrid) return;
      const filtered = getFilteredElements();

      if (currentCategoryTitle) {
        if (currentCategory === 'favorites') {
          currentCategoryTitle.textContent = '⭐ Saqlangan elementlar';
        } else if (currentCategory === 'all') {
          currentCategoryTitle.textContent = currentSearchQuery ? `Qidiruv: "${currentSearchQuery}"` : 'Barcha elementlar';
        } else {
          currentCategoryTitle.textContent = currentCategory;
        }
      }

      if (!filtered || filtered.length === 0) {
        elementsGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      const cardsHTML = filtered.map(renderCardHTML).filter(Boolean).join('');
      elementsGrid.innerHTML = cardsHTML;
    } catch (err) {
      console.error('Error rendering elements grid:', err);
    }
  }

  // Render Categories View Grid with Icons
  function renderCategoriesGrid() {
    try {
      if (!categoriesGrid) return;
      const catMap = getCategoriesMap();
      let html = '';

      for (const [cat, count] of Object.entries(catMap)) {
        const icon = CATEGORY_ICONS[cat] || 'fa-layer-group';
        html += `
          <div class="category-card" data-category="${cat}">
            <div class="cat-icon-circle"><i class="fa-solid ${icon}"></i></div>
            <div class="cat-title">${cat}</div>
            <span class="cat-count-badge">${count} ta element</span>
          </div>
        `;
      }
      categoriesGrid.innerHTML = html;
    } catch (e) {
      console.error('Render categories error:', e);
    }
  }

  // Render News Elements View
  function renderNewsElements() {
    try {
      if (!newsElementsGrid) return;
      const newsItems = allElements.filter(item => item && (item.isNew || item.id <= 30));
      newsElementsGrid.innerHTML = newsItems.map(renderCardHTML).filter(Boolean).join('');
    } catch (e) {
      console.error('Render news error:', e);
    }
  }

  // Render Favorites Tab View
  function renderFavoritesElements() {
    try {
      if (!favoritesElementsGrid) return;
      const favItems = allElements.filter(item => item && favorites.includes(item.id));
      if (favItems.length === 0) {
        favoritesElementsGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>
            <h3>Saqlanganlar bo'sh</h3>
            <p>Sevimli elementlaringizni yulduzcha ⭐ tugmasi orqali saqlab qo'yishingiz mumkin.</p>
          </div>
        `;
        return;
      }
      favoritesElementsGrid.innerHTML = favItems.map(renderCardHTML).filter(Boolean).join('');
    } catch (e) {
      console.error('Render favorites error:', e);
    }
  }

  /* -------------------------------------------------------------
   * Admin Panel Functions
   * ------------------------------------------------------------- */

  function populateCategoryDropdowns() {
    try {
      if (!adminCategoryFilter || !categoriesDatalist) return;
      const catMap = getCategoriesMap();
      const categories = Object.keys(catMap);

      let filterHtml = '<option value="all">Barcha Bo\'limlar</option>';
      let datalistHtml = '';

      categories.forEach(cat => {
        filterHtml += `<option value="${cat}">${cat} (${catMap[cat]})</option>`;
        datalistHtml += `<option value="${cat}">`;
      });

      adminCategoryFilter.innerHTML = filterHtml;
      categoriesDatalist.innerHTML = datalistHtml;
    } catch (e) {}
  }

  function renderAdminElements() {
    try {
      if (!adminElementsList) return;
      const query = normalizeText(adminSearchInput ? adminSearchInput.value : '');
      const catFilter = adminCategoryFilter ? adminCategoryFilter.value : 'all';

      const filtered = allElements.filter(item => {
        if (!item) return false;
        if (catFilter !== 'all' && item.category !== catFilter) return false;
        if (!query) return true;
        const str = `${item.code} ${item.description} ${item.category} ${(item.keywords || []).join(' ')}`.toLowerCase();
        return str.includes(query);
      });

      if (filtered.length === 0) {
        adminElementsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 11px;">Hech narsa topilmadi.</div>`;
        return;
      }

      adminElementsList.innerHTML = filtered.map(item => `
        <div class="admin-item-row" data-id="${item.id}">
          <div class="admin-item-left">
            <span class="admin-item-code">${item.code || ''}</span>
            <span class="admin-item-desc">${item.description || ''}</span>
            <span class="admin-item-cat"><i class="fa-solid fa-folder"></i> ${item.category || ''}</span>
          </div>
          <div class="admin-item-right">
            <button class="btn-admin-edit" data-id="${item.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i> Tahrirlash</button>
            <button class="btn-admin-delete" data-id="${item.id}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error('Render admin elements error:', e);
    }
  }

  function populateCategoryDropdowns() {
    const catSelect = document.getElementById('form-element-cat-select');
    const adminCatFilter = document.getElementById('admin-category-filter');
    const categoriesDatalist = document.getElementById('categories-datalist');
    const catMap = getCategoriesMap();
    const allCategories = Array.from(new Set([...Object.keys(CATEGORY_ICONS), ...Object.keys(catMap)]));

    if (catSelect) {
      let optionsHTML = allCategories.map(c => `<option value="${c}">${c}</option>`).join('');
      optionsHTML += `<option value="__custom__">➕ Yangi kategoriya kiritish...</option>`;
      catSelect.innerHTML = optionsHTML;
    }

    if (adminCatFilter) {
      let filterHTML = `<option value="all">Barcha Bo'limlar</option>`;
      filterHTML += allCategories.map(c => `<option value="${c}">${c}</option>`).join('');
      adminCatFilter.innerHTML = filterHTML;
    }

    if (categoriesDatalist) {
      categoriesDatalist.innerHTML = allCategories.map(c => `<option value="${c}">`).join('');
    }
  }

  // Handle Category Select Change
  const formElementCatSelect = document.getElementById('form-element-cat-select');
  const formElementCatCustom = document.getElementById('form-element-cat-custom');

  if (formElementCatSelect) {
    formElementCatSelect.addEventListener('change', () => {
      if (formElementCatSelect.value === '__custom__') {
        formElementCatCustom?.classList.remove('hidden');
        formElementCatCustom?.focus();
      } else {
        formElementCatCustom?.classList.add('hidden');
      }
    });
  }

  function openAddElementModal() {
    if (!modalElementForm) return;
    populateCategoryDropdowns();
    if (modalElementTitle) modalElementTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Yangi Element Qo\'shish';
    if (formElementId) formElementId.value = '';
    if (formElementCode) formElementCode.value = '';
    if (formElementDesc) formElementDesc.value = '';
    
    if (formElementCatSelect) formElementCatSelect.value = 'Trenddagi 3D Elementlar';
    if (formElementCatCustom) {
      formElementCatCustom.value = '';
      formElementCatCustom.classList.add('hidden');
    }
    
    if (formElementIcon) formElementIcon.value = 'fa-box-open';
    if (formIconPreview) formIconPreview.className = 'fa-solid fa-box-open';
    if (formElementKeywords) formElementKeywords.value = '';
    if (formElementIsNew) formElementIsNew.checked = true;

    modalElementForm.classList.remove('hidden');
  }

  function openEditElementModal(id) {
    const item = allElements.find(e => e && e.id == id);
    if (!item || !modalElementForm) return;

    populateCategoryDropdowns();
    if (modalElementTitle) modalElementTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Elementni Tahrirlash';
    if (formElementId) formElementId.value = item.id;
    if (formElementCode) formElementCode.value = item.code || '';
    if (formElementDesc) formElementDesc.value = item.description || '';
    
    const targetCat = item.category || 'Trenddagi 3D Elementlar';
    if (formElementCatSelect) {
      const hasOption = Array.from(formElementCatSelect.options).some(opt => opt.value === targetCat);
      if (hasOption) {
        formElementCatSelect.value = targetCat;
        if (formElementCatCustom) formElementCatCustom.classList.add('hidden');
      } else {
        formElementCatSelect.value = '__custom__';
        if (formElementCatCustom) {
          formElementCatCustom.value = targetCat;
          formElementCatCustom.classList.remove('hidden');
        }
      }
    }

    if (formElementIcon) formElementIcon.value = CATEGORY_ICONS[item.category] || 'fa-box-open';
    if (formIconPreview) formIconPreview.className = `fa-solid ${formElementIcon.value}`;
    if (formElementKeywords) formElementKeywords.value = (item.keywords || []).join(', ');
    if (formElementIsNew) formElementIsNew.checked = !!item.isNew;

    modalElementForm.classList.remove('hidden');
  }

  async function saveElementForm() {
    const id = formElementId ? formElementId.value : '';
    const code = formElementCode ? formElementCode.value.trim() : '';
    const description = formElementDesc ? formElementDesc.value.trim() : '';
    
    let category = formElementCatSelect ? formElementCatSelect.value : 'Trenddagi 3D Elementlar';
    if (category === '__custom__') {
      category = formElementCatCustom ? formElementCatCustom.value.trim() : '';
    }
    if (!category) category = 'Trenddagi 3D Elementlar';

    const iconClass = (formElementIcon ? formElementIcon.value.trim() : '') || 'fa-box-open';
    const keywordsStr = formElementKeywords ? formElementKeywords.value.trim() : '';
    const isNew = formElementIsNew ? formElementIsNew.checked : true;

    if (!code || !description) {
      showToast('❌ Kod va Tavsifni kiriting!');
      return;
    }

    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [code, description, category];
    CATEGORY_ICONS[category] = iconClass;

    const payload = {
      code,
      description,
      category,
      keywords,
      is_new: isNew
    };

    if (btnSaveElement) {
      btnSaveElement.disabled = true;
      btnSaveElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saqlanmoqda...';
    }

    try {
      if (id) {
        await fetch(`${SUPABASE_URL}/rest/v1/elements?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });

        const idx = allElements.findIndex(e => e && e.id == id);
        if (idx !== -1) {
          allElements[idx] = { ...allElements[idx], ...payload, isNew };
        }
        showToast('✅ Element muvaffaqiyatli yangilandi!');
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/elements`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const createdArr = await res.json();
          const created = createdArr[0] || payload;
          allElements.unshift({
            id: created.id || Date.now(),
            code: created.code,
            description: created.description,
            category: created.category,
            isNew: created.is_new,
            keywords: created.keywords
          });
        } else {
          allElements.unshift({
            id: Date.now(),
            code,
            description,
            category,
            isNew,
            keywords
          });
        }
        showToast('🎉 Yangi element qo\'shildi!');
      }

      modalElementForm?.classList.add('hidden');
      updateStats();
      renderElements();
      renderCategoriesGrid();
      renderNewsElements();
      renderAdminElements();
      populateCategoryDropdowns();
    } catch (e) {
      showToast('⚠️ Xatolik yuz berdi, mahalliy saqlandi.');
    } finally {
      if (btnSaveElement) {
        btnSaveElement.disabled = false;
        btnSaveElement.innerHTML = '<i class="fa-solid fa-check"></i> Saqlash';
      }
    }
  }

  async function deleteElement(id) {
    if (!confirm('Ushbu elementni o\'chirmoqchimisiz?')) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/elements?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      allElements = allElements.filter(e => e && e.id != id);
      showToast('🗑️ Element o\'chirildi');
      updateStats();
      renderElements();
      renderCategoriesGrid();
      renderNewsElements();
      renderAdminElements();
    } catch (e) {
      showToast('❌ O\'chirishda xatolik');
    }
  }

  function renderIconPickerGrid(filter = '') {
    if (!iconPickerGrid) return;
    const q = filter.toLowerCase().trim();
    const filtered = POPULAR_ICONS.filter(i => i.name.toLowerCase().includes(q) || i.class.toLowerCase().includes(q));

    iconPickerGrid.innerHTML = filtered.map(icon => `
      <div class="icon-picker-item" data-class="${icon.class}">
        <i class="fa-solid ${icon.class}"></i>
        <span>${icon.name}</span>
      </div>
    `).join('');
  }

  function renderAdminsList() {
    if (!adminsListContainer) return;
    const ADMIN_NAMES = {
      8544023815: "Yaxshi Bola 🩵",
      "8544023815": "Yaxshi Bola 🩵",
      8112688757: "Zuhra 🩷",
      "8112688757": "Zuhra 🩷"
    };

    // Strictly enforce the 2 core admins
    adminList = [SUPER_ADMIN_ID, ZUHRA_ADMIN_ID];

    adminsListContainer.innerHTML = adminList.map(admin => {
      const numAdmin = Number(admin);
      const isSuper = numAdmin === SUPER_ADMIN_ID;
      const isZuhra = numAdmin === ZUHRA_ADMIN_ID;
      const displayName = ADMIN_NAMES[numAdmin] || ADMIN_NAMES[String(admin)] || (isSuper ? "Yaxshi Bola 🩵" : "Zuhra 🩷");
      const badgeText = isSuper ? '(Asosiy Admin)' : '(Admin)';
      const iconColor = isSuper ? '#0ea5e9' : '#ec4899';

      return `
        <div class="admin-user-row" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.95); margin-bottom:10px; border-radius:14px; border:1px solid ${isSuper ? 'rgba(14,165,233,0.3)' : 'rgba(236,72,153,0.3)'}; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div class="admin-user-info" style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid ${isSuper ? 'fa-crown' : 'fa-user-shield'}" style="color: ${iconColor}; font-size: 18px;"></i>
            <div>
              <strong style="color:#1e293b; font-size:15px; display:block;">${displayName}</strong>
              <small style="opacity:0.75; font-size:12px; color:#64748b;">ID: ${admin} <span style="color:${iconColor}; font-weight:600;">${badgeText}</span></small>
            </div>
          </div>
          <span style="font-size:11px; color:${iconColor}; font-weight:700; background:${isSuper ? 'rgba(14,165,233,0.12)' : 'rgba(236,72,153,0.12)'}; padding:4px 12px; border-radius:20px; border: 1px solid ${isSuper ? 'rgba(14,165,233,0.2)' : 'rgba(236,72,153,0.2)'};">
            ${isSuper ? 'ASOSIY ADMIN' : 'ADMIN'}
          </span>
        </div>
      `;
    }).join('');
  }

  async function addAdmin() {
    const val = newAdminInput ? newAdminInput.value.trim() : '';
    if (!val) return;

    const item = isNaN(Number(val)) ? val.toLowerCase() : Number(val);
    if (!adminList.includes(item)) {
      adminList.push(item);
      try {
        localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
      } catch (e) {}
      if (newAdminInput) newAdminInput.value = '';
      renderAdminsList();
      updateStats();
      showToast('✅ Yangi admin qo\'shildi!');

      // Sync with Supabase bot_users table
      try {
        const isNum = !isNaN(Number(val));
        const payload = isNum 
          ? { id: Number(val), username: `admin_${val}`, first_name: 'Admin' } 
          : { id: Math.floor(Math.random() * 1000000000), username: String(val).replace('@',''), first_name: 'Admin' };
        
        await fetch(`${SUPABASE_URL}/rest/v1/bot_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    } else {
      showToast('⚠️ Ushbu admin allaqachon mavjud!');
    }
  }

  async function removeAdmin(item) {
    if (item == SUPER_ADMIN_ID || Number(item) === SUPER_ADMIN_ID || item == ZUHRA_ADMIN_ID || Number(item) === ZUHRA_ADMIN_ID) {
      return showToast('❌ Asosiy adminlarni o\'chirib bo\'lmaydi!');
    }
    adminList = adminList.filter(a => String(a) !== String(item));
    try {
      localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
    } catch (e) {}
    renderAdminsList();
    updateStats();
    showToast('🗑️ Admin huquqi olindi');

    if (!isNaN(Number(item))) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/bot_users?id=eq.${item}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
      } catch (e) {}
    }
  }

  function downloadJSONBackup() {
    const modalBackupDownload = document.getElementById('modal-backup-download');
    const backupCountElem = document.getElementById('backup-count-elem');
    const backupCountAdmin = document.getElementById('backup-count-admin');
    const backupDateStr = document.getElementById('backup-date-str');
    const backupDirectLink = document.getElementById('backup-direct-link');
    const backupCopyTextBtn = document.getElementById('backup-copy-text-btn');
    const backupPreviewText = document.getElementById('backup-preview-text');

    const backupData = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      app: 'Canva Element Kodlari',
      author: 'Zuhra Olimova',
      totalElements: allElements.length,
      admins: adminList,
      categories: Object.keys(getCategoriesMap()),
      elements: allElements
    };

    const jsonStr = JSON.stringify(backupData, null, 2);

    if (backupCountElem) backupCountElem.textContent = `${allElements.length} ta element`;
    if (backupCountAdmin) backupCountAdmin.textContent = `${adminList.length} ta admin`;
    if (backupDateStr) backupDateStr.textContent = `Vaqt: ${backupData.date}`;
    if (backupPreviewText) backupPreviewText.value = jsonStr;

    if (backupDirectLink) {
      backupDirectLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      backupDirectLink.download = `canva_elements_backup_${backupData.date}.json`;
    }

    if (backupCopyTextBtn) {
      backupCopyTextBtn.onclick = () => {
        copyToClipboard(jsonStr, '📋 Backup JSON nusxalandi!');
      };
    }

    modalBackupDownload?.classList.remove('hidden');
    showToast('💾 Zaxira fayli tayyorlandi!');
  }

  // Switch Bottom Navbar Tabs
  function switchTab(tabName) {
    if (tabName === 'admin' && !isUserAdmin) {
      openAdminLoginModal();
      return;
    }

    activeTab = tabName;

    document.querySelectorAll('.bottom-navbar .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    triggerHaptic('light');

    if (tabName === 'categories') renderCategoriesGrid();
    if (tabName === 'news') renderNewsElements();
    if (tabName === 'favorites') renderFavoritesElements();
    if (tabName === 'admin') {
      renderAdminElements();
      populateCategoryDropdowns();
    }
  }

  // Bottom Navbar Click Listener
  document.querySelectorAll('.bottom-navbar .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Global Event Delegation for Elements Grid & Admin Table
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy');
    const shareBtn = e.target.closest('.btn-share');
    const codeBox = e.target.closest('.code-box');
    const favBtn = e.target.closest('.fav-btn');
    const catCard = e.target.closest('.category-card');

    const adminEditBtn = e.target.closest('.btn-admin-edit');
    const adminDeleteBtn = e.target.closest('.btn-admin-delete');
    const removeAdminBtn = e.target.closest('.btn-remove-admin');
    const iconItem = e.target.closest('.icon-picker-item');

    if (copyBtn || codeBox) {
      const code = (copyBtn || codeBox).dataset.code;
      copyToClipboard(code);
    } else if (shareBtn) {
      const code = shareBtn.dataset.code;
      const desc = shareBtn.dataset.desc;
      shareElement(code, desc);
    } else if (favBtn) {
      const id = parseInt(favBtn.dataset.id, 10) || favBtn.dataset.id;
      toggleFavorite(id);
    } else if (catCard) {
      currentCategory = catCard.dataset.category;
      switchTab('home');
      renderElements();
    } else if (adminEditBtn) {
      openEditElementModal(adminEditBtn.dataset.id);
    } else if (adminDeleteBtn) {
      deleteElement(adminDeleteBtn.dataset.id);
    } else if (removeAdminBtn) {
      removeAdmin(removeAdminBtn.dataset.admin);
    } else if (iconItem) {
      const iconClass = iconItem.dataset.class;
      if (formElementIcon) formElementIcon.value = iconClass;
      if (formIconPreview) formIconPreview.className = `fa-solid ${iconClass}`;
      modalIconPicker?.classList.add('hidden');
    }
  });

  // Admin Quick Action Buttons
  adminBtnAddElement?.addEventListener('click', openAddElementModal);
  adminBtnManageAdmins?.addEventListener('click', () => {
    renderAdminsList();
    modalManageAdmins?.classList.remove('hidden');
  });
  adminBtnDownloadBackup?.addEventListener('click', downloadJSONBackup);
  adminBtnRefresh?.addEventListener('click', () => {
    fetchSupabaseElements();
    showToast('🔄 Ma\'lumotlar yangilandi');
  });

  // Admin Form Events
  btnSaveElement?.addEventListener('click', saveElementForm);
  btnCancelElement?.addEventListener('click', () => modalElementForm?.classList.add('hidden'));
  modalElementClose?.addEventListener('click', () => modalElementForm?.classList.add('hidden'));

  // Icon Picker Modal Events
  btnOpenIconPicker?.addEventListener('click', () => {
    renderIconPickerGrid();
    modalIconPicker?.classList.remove('hidden');
  });
  btnCloseIconPicker?.addEventListener('click', () => modalIconPicker?.classList.add('hidden'));
  modalIconClose?.addEventListener('click', () => modalIconPicker?.classList.add('hidden'));

  iconSearchInput?.addEventListener('input', (e) => {
    renderIconPickerGrid(e.target.value);
  });

  formElementIcon?.addEventListener('input', (e) => {
    if (formIconPreview) formIconPreview.className = `fa-solid ${e.target.value.trim() || 'fa-box-open'}`;
  });

  // Admin Management Modal Events
  btnSaveNewAdmin?.addEventListener('click', addAdmin);
  btnCloseAdminsModal?.addEventListener('click', () => modalManageAdmins?.classList.add('hidden'));
  modalAdminsClose?.addEventListener('click', () => modalManageAdmins?.classList.add('hidden'));

  // Admin Filter Inputs
  adminSearchInput?.addEventListener('input', renderAdminElements);
  adminCategoryFilter?.addEventListener('change', renderAdminElements);

  // Search Input Events
  function updateSearchUIState() {
    const isSearching = !!currentSearchQuery || document.activeElement === searchInput;
    document.body.classList.toggle('is-searching', isSearching);
  }

  let searchDebounce = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      clearSearchBtn?.classList.toggle('hidden', !currentSearchQuery);

      if (activeTab !== 'home') switchTab('home');
      updateSearchUIState();

      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderElements();
      }, 100);
    });

    searchInput.addEventListener('focus', () => updateSearchUIState());
    searchInput.addEventListener('blur', () => {
      if (!currentSearchQuery) document.body.classList.remove('is-searching');
    });
  }

  clearSearchBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn?.classList.add('hidden');
    document.body.classList.remove('is-searching');
    renderElements();
    triggerHaptic('light');
  });

  // Hot Tag Chips Event
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
      chip.classList.add('active');

      if (chip.dataset.category) {
        currentCategory = chip.dataset.category;
        currentTag = '';
      } else if (chip.dataset.tag) {
        currentTag = chip.dataset.tag;
        currentCategory = 'all';
      }

      if (activeTab !== 'home') switchTab('home');
      renderElements();
      triggerHaptic('light');
    });
  });

  // Reset Filter
  resetFilterBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    currentCategory = 'all';
    currentTag = '';
    clearSearchBtn?.classList.add('hidden');
    document.body.classList.remove('is-searching');
    document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
    const allChip = document.querySelector('.tag-chip[data-category="all"]');
    if (allChip) allChip.classList.add('active');
    renderElements();
  });

  // Fav Stat Click
  favStatBtn?.addEventListener('click', () => {
    switchTab('favorites');
  });

  // Backup Modal Events
  document.getElementById('modal-backup-close')?.addEventListener('click', () => {
    document.getElementById('modal-backup-download')?.classList.add('hidden');
  });
  document.getElementById('btn-close-backup-modal')?.addEventListener('click', () => {
    document.getElementById('modal-backup-download')?.classList.add('hidden');
  });

  // Initial Safe Execution
  try { checkAdminPermissions(); } catch (e) { console.error('Admin check error:', e); }
  try { updateStats(); } catch (e) { console.error('Stats error:', e); }
  try { renderElements(); } catch (e) { console.error('Render elements error:', e); }
  try { renderCategoriesGrid(); } catch (e) { console.error('Categories error:', e); }
  try { fetchSupabaseElements(); } catch (e) { console.error('Supabase fetch error:', e); }
  try { fetchSupabaseAdmins(); } catch (e) { console.error('Supabase admins fetch error:', e); }
});
