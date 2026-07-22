/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Mini App — Logic & Admin Panel v4
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp SDK Initialization
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#fff5f9');
    }
  }

  // Supabase REST Config
  const SUPABASE_URL = 'https://mjenunxgakcvyzcikjmi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';

  // Super Admin Default ID
  const SUPER_ADMIN_ID = 8544023815;

  // Data State
  let allElements = window.CANVA_DATA || [];
  let favorites = JSON.parse(localStorage.getItem('zo_canva_favs') || '[]');
  let adminList = JSON.parse(localStorage.getItem('zo_canva_admins') || `[${SUPER_ADMIN_ID}]`);
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
    { class: 'fa-bell', name: 'Qo\'ng'iroq' },
    { class: 'fa-lightbulb', name: 'G'oya' },
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

  // DOM Elements - Passcode Login Modal
  const modalAdminLogin = document.getElementById('modal-admin-login');
  const modalLoginClose = document.getElementById('modal-login-close');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const adminPasscodeInput = document.getElementById('admin-passcode-input');
  const authorBadge = document.getElementById('author-badge');
  const adminLockBtn = document.getElementById('admin-lock-btn');

  // Check Admin Rights
  function checkAdminPermissions() {
    const tgUser = tg?.initDataUnsafe?.user;
    const urlParams = new URLSearchParams(window.location.search);
    const paramAdmin = urlParams.get('admin') === '1';
    const paramUserId = urlParams.get('user_id');
    const localAuth = localStorage.getItem('zo_admin_auth') === 'true';

    let userId = tgUser?.id || paramUserId;
    let username = tgUser?.username;

    const validUsernames = ['yomonbola', 'yomonboia', 'zuhraolimova', 'zuhra_olimova'];

    if (localAuth || paramAdmin) {
      isUserAdmin = true;
    } else if (userId && (Number(userId) === SUPER_ADMIN_ID || adminList.includes(Number(userId)))) {
      isUserAdmin = true;
    } else if (username && (validUsernames.includes(username.toLowerCase()) || adminList.includes(username.toLowerCase()))) {
      isUserAdmin = true;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      isUserAdmin = true;
    } else {
      isUserAdmin = false;
    }

    if (isUserAdmin) {
      navItemAdmin?.classList.remove('hidden');
    } else {
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
    adminPasscodeInput.value = '';
    modalAdminLogin.classList.remove('hidden');
    setTimeout(() => adminPasscodeInput.focus(), 150);
  }

  // Submit Admin Passcode Login
  function handleAdminLoginSubmit() {
    const code = adminPasscodeInput.value.trim();
    const validCodes = ['8544023815', 'admin', 'admin2026', 'zuhra2026', 'zo2026', 'canva2026'];

    if (validCodes.includes(code.toLowerCase()) || adminList.includes(Number(code)) || adminList.includes(code.toLowerCase())) {
      localStorage.setItem('zo_admin_auth', 'true');
      isUserAdmin = true;
      navItemAdmin.classList.remove('hidden');
      modalAdminLogin.classList.add('hidden');
      switchTab('admin');
      showToast('👑 Admin panel faollashtirildi!');
    } else {
      showToast('❌ Parol noto\'g\'ri!');
    }
  }

  // Author badge click count for secret admin access
  let badgeClickCount = 0;
  let badgeClickTimer = null;
  if (authorBadge) {
    authorBadge.addEventListener('click', (e) => {
      badgeClickCount++;
      if (badgeClickTimer) clearTimeout(badgeClickTimer);
      badgeClickTimer = setTimeout(() => { badgeClickCount = 0; }, 1500);

      if (badgeClickCount >= 3) {
        badgeClickCount = 0;
        openAdminLoginModal();
      }
    });
  }

  if (adminLockBtn) {
    adminLockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAdminLoginModal();
    });
  }

  btnSubmitLogin?.addEventListener('click', handleAdminLoginSubmit);
  btnCancelLogin?.addEventListener('click', () => modalAdminLogin.classList.add('hidden'));
  modalLoginClose?.addEventListener('click', () => modalAdminLogin.classList.add('hidden'));
  adminPasscodeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLoginSubmit();
  });

  // Safe Escape Regex
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Highlight Matches
  function highlightMatches(text, query) {
    if (!query || query.trim().length < 2) return text;
    try {
      const escaped = escapeRegExp(query.trim());
      const regex = new RegExp(`(${escaped})`, 'gi');
      return text.replace(regex, '<span class="highlight-text">$1</span>');
    } catch (e) {
      return text;
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
            category: item.category,
            code: item.code,
            description: item.description,
            isNew: item.is_new,
            keywords: item.keywords || []
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

  // Normalize Uzbek Diacritics
  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[‘'’`ʻ]/g, '')
      .replace(/o[ʻ'’`]/g, 'o')
      .replace(/g[ʻ'’`]/g, 'g')
      .trim();
  }

  // Levenshtein Distance
  function levenshtein(a, b) {
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
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return map;
  }

  // Trigger Haptic Feedback
  function triggerHaptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      else tg.HapticFeedback.impactOccurred(type);
    }
  }

  // Toast Popup Message
  let toastTimer = null;
  function showToast(message, codeText = '') {
    toastTitle.textContent = message;
    toastCode.textContent = codeText;
    toast.classList.remove('hidden');

    triggerHaptic('success');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // Copy Code to Clipboard
  function copyToClipboard(text, customToastMsg = 'KOD NUSXALANDI!') {
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
  }

  // Open Canva App Deep Link
  function openCanvaDeepLink(code) {
    copyToClipboard(code, '📋 KOD NUSXALANDI! (Canva -> Elementlar)');

    const canvaWebUrl = `https://www.canva.com/search?tab=elements&q=${encodeURIComponent(code)}`;
    const canvaAppDeepLink = `canva://search?q=${encodeURIComponent(code)}`;

    const now = Date.now();
    window.location.href = canvaAppDeepLink;

    setTimeout(() => {
      if (Date.now() - now < 1800) {
        window.open(canvaWebUrl, '_blank');
      }
    }, 1200);
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
    localStorage.setItem('zo_canva_favs', JSON.stringify(favorites));
    updateStats();
    renderElements();
    renderFavoritesElements();
  }

  // Update Counters & Stats
  function updateStats() {
    const catMap = getCategoriesMap();
    statTotal.textContent = allElements.length;
    statCategories.textContent = Object.keys(catMap).length;
    statFavs.textContent = favorites.length;

    if (isUserAdmin) {
      adminStatTotal.textContent = allElements.length;
      adminStatCategories.textContent = Object.keys(catMap).length;
      adminStatUsers.textContent = '1+';
      adminStatAdmins.textContent = adminList.length;
    }
  }

  // Interleave elements across categories safely for Home View (Non-blocking)
  function getMixedHomeElements(elementsList) {
    if (!Array.isArray(elementsList) || elementsList.length === 0) return [];

    const catBuckets = {};
    elementsList.forEach(item => {
      const cat = item.category || 'Turli xil';
      if (!catBuckets[cat]) catBuckets[cat] = [];
      catBuckets[cat].push(item);
    });

    const categoryKeys = Object.keys(catBuckets);
    const mixed = [];
    const maxBucketSize = Math.max(...Object.values(catBuckets).map(b => b.length));

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
    const results = [];

    // If Home View with no query/tag filter, return interleave mixed elements
    if (currentCategory === 'all' && !currentSearchQuery && !currentTag) {
      return getMixedHomeElements(allElements);
    }

    allElements.forEach(item => {
      if (currentCategory === 'favorites') {
        if (!favorites.includes(item.id)) return;
      } else if (currentCategory !== 'all') {
        if (item.category !== currentCategory) return;
      }

      if (currentTag) {
        const itemStr = `${item.category} ${item.description} ${(item.keywords || []).join(' ')}`.toLowerCase();
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
    const isFav = favorites.includes(item.id);
    const favClass = isFav ? 'active fa-solid' : 'fa-regular';
    const newBadgeHTML = item.isNew ? `<span class="new-badge">NEW</span>` : '';
    const descHTML = highlightMatches(item.description, currentSearchQuery);

    return `
      <div class="element-card" data-id="${item.id}">
        <div class="card-header">
          <span class="category-tag"><i class="fa-solid fa-folder"></i> ${item.category} ${newBadgeHTML}</span>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${item.id}" title="Saqlash">
            <i class="${favClass} fa-star"></i>
          </button>
        </div>
        
        <div class="element-description">
          ${descHTML}
        </div>
        
        <div class="code-box" data-code="${item.code}" title="Nusxalash uchun bosing">
          <span class="code-text">${item.code}</span>
          <i class="fa-regular fa-copy code-copy-icon"></i>
        </div>
        
        <div class="card-actions">
          <button class="btn-copy" data-code="${item.code}">
            <i class="fa-solid fa-copy"></i> Nusxalash
          </button>
          <button class="btn-canva" data-code="${item.code}" title="Canva'da ochish">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Render Main Elements Grid
  function renderElements() {
    const filtered = getFilteredElements();

    if (currentCategory === 'favorites') {
      currentCategoryTitle.textContent = '⭐ Saqlangan elementlar';
    } else if (currentCategory === 'all') {
      currentCategoryTitle.textContent = currentSearchQuery ? `Qidiruv: "${currentSearchQuery}"` : 'Barcha elementlar';
    } else {
      currentCategoryTitle.textContent = currentCategory;
    }

    if (filtered.length === 0) {
      elementsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    elementsGrid.innerHTML = filtered.map(renderCardHTML).join('');
  }

  // Render Categories View Grid with Icons
  function renderCategoriesGrid() {
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
  }

  // Render News Elements View
  function renderNewsElements() {
    const newsItems = allElements.filter(item => item.isNew || item.id <= 30);
    newsElementsGrid.innerHTML = newsItems.map(renderCardHTML).join('');
  }

  // Render Favorites Tab View
  function renderFavoritesElements() {
    const favItems = allElements.filter(item => favorites.includes(item.id));
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
    favoritesElementsGrid.innerHTML = favItems.map(renderCardHTML).join('');
  }

  /* -------------------------------------------------------------
   * Admin Panel Functions
   * ------------------------------------------------------------- */

  // Populate Admin Category Filter & Form Datalist
  function populateCategoryDropdowns() {
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
  }

  // Render Admin Elements Table List
  function renderAdminElements() {
    const query = normalizeText(adminSearchInput.value);
    const catFilter = adminCategoryFilter.value;

    const filtered = allElements.filter(item => {
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
          <span class="admin-item-code">${item.code}</span>
          <span class="admin-item-desc">${item.description}</span>
          <span class="admin-item-cat"><i class="fa-solid fa-folder"></i> ${item.category}</span>
        </div>
        <div class="admin-item-right">
          <button class="btn-admin-edit" data-id="${item.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i> Tahrirlash</button>
          <button class="btn-admin-delete" data-id="${item.id}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  // Open Add Element Modal
  function openAddElementModal() {
    modalElementTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Yangi Element Qo\'shish';
    formElementId.value = '';
    formElementCode.value = '';
    formElementDesc.value = '';
    formElementCat.value = 'Trenddagi 3D Elementlar';
    formElementIcon.value = 'fa-box-open';
    formIconPreview.className = 'fa-solid fa-box-open';
    formElementKeywords.value = '';
    formElementIsNew.checked = true;

    modalElementForm.classList.remove('hidden');
  }

  // Open Edit Element Modal
  function openEditElementModal(id) {
    const item = allElements.find(e => e.id == id);
    if (!item) return;

    modalElementTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Elementni Tahrirlash';
    formElementId.value = item.id;
    formElementCode.value = item.code;
    formElementDesc.value = item.description;
    formElementCat.value = item.category;
    formElementIcon.value = CATEGORY_ICONS[item.category] || 'fa-box-open';
    formIconPreview.className = `fa-solid ${formElementIcon.value}`;
    formElementKeywords.value = (item.keywords || []).join(', ');
    formElementIsNew.checked = !!item.isNew;

    modalElementForm.classList.remove('hidden');
  }

  // Save Element (Create or Update)
  async function saveElementForm() {
    const id = formElementId.value;
    const code = formElementCode.value.trim();
    const description = formElementDesc.value.trim();
    const category = formElementCat.value.trim() || 'Trenddagi 3D Elementlar';
    const iconClass = formElementIcon.value.trim() || 'fa-box-open';
    const keywordsStr = formElementKeywords.value.trim();
    const isNew = formElementIsNew.checked;

    if (!code || !description) {
      showToast('❌ Kod va Tavsifni kiriting!');
      return;
    }

    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [code, description, category];

    // Save Icon Mapping
    CATEGORY_ICONS[category] = iconClass;

    const payload = {
      code,
      description,
      category,
      keywords,
      is_new: isNew
    };

    btnSaveElement.disabled = true;
    btnSaveElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saqlanmoqda...';

    try {
      if (id) {
        // UPDATE existing element in Supabase
        const res = await fetch(`${SUPABASE_URL}/rest/v1/elements?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });

        const idx = allElements.findIndex(e => e.id == id);
        if (idx !== -1) {
          allElements[idx] = { ...allElements[idx], ...payload, isNew };
        }
        showToast('✅ Element muvaffaqiyatli yangilandi!');
      } else {
        // CREATE new element in Supabase
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

      modalElementForm.classList.add('hidden');
      updateStats();
      renderElements();
      renderCategoriesGrid();
      renderNewsElements();
      renderAdminElements();
      populateCategoryDropdowns();
    } catch (e) {
      showToast('⚠️ Xatolik yuz berdi, mahalliy saqlandi.');
    } finally {
      btnSaveElement.disabled = false;
      btnSaveElement.innerHTML = '<i class="fa-solid fa-check"></i> Saqlash';
    }
  }

  // Delete Element
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

      allElements = allElements.filter(e => e.id != id);
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

  // Render Icon Picker
  function renderIconPickerGrid(filter = '') {
    const q = filter.toLowerCase().trim();
    const filtered = POPULAR_ICONS.filter(i => i.name.toLowerCase().includes(q) || i.class.toLowerCase().includes(q));

    iconPickerGrid.innerHTML = filtered.map(icon => `
      <div class="icon-picker-item" data-class="${icon.class}">
        <i class="fa-solid ${icon.class}"></i>
        <span>${icon.name}</span>
      </div>
    `).join('');
  }

  // Render Admins List inside Modal
  function renderAdminsList() {
    adminsListContainer.innerHTML = adminList.map(admin => {
      const isSuper = Number(admin) === SUPER_ADMIN_ID;
      return `
        <div class="admin-user-row">
          <div class="admin-user-info">
            <i class="fa-solid ${isSuper ? 'fa-crown' : 'fa-user-shield'}" style="color: ${isSuper ? '#f59e0b' : '#8b5cf6'}"></i>
            <span>${admin} ${isSuper ? '(Bosh Admin)' : ''}</span>
          </div>
          ${!isSuper ? `<button class="btn-remove-admin" data-admin="${admin}"><i class="fa-solid fa-xmark"></i></button>` : '<span style="font-size: 9px; color: var(--text-muted); font-weight:700;">ASOSIY</span>'}
        </div>
      `;
    }).join('');
  }

  // Add Admin
  function addAdmin() {
    const val = newAdminInput.value.trim();
    if (!val) return;

    const item = isNaN(Number(val)) ? val.toLowerCase() : Number(val);
    if (!adminList.includes(item)) {
      adminList.push(item);
      localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
      newAdminInput.value = '';
      renderAdminsList();
      updateStats();
      showToast('✅ Yangi admin qo\'shildi!');
    } else {
      showToast('⚠️ Ushbu admin allaqachon mavjud!');
    }
  }

  // Remove Admin
  function removeAdmin(item) {
    if (item == SUPER_ADMIN_ID || Number(item) === SUPER_ADMIN_ID) {
      return showToast('❌ Bosh adminni o\'chirib bo\'lmaydi!');
    }
    adminList = adminList.filter(a => String(a) !== String(item));
    localStorage.setItem('zo_canva_admins', JSON.stringify(adminList));
    renderAdminsList();
    updateStats();
    showToast('🗑️ Admin huquqi olindi');
  }

  // Export & Download JSON Backup
  function downloadJSONBackup() {
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
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `canva_elements_backup_${backupData.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('💾 Backup fayli yuklab olindi!');
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
    const codeBox = e.target.closest('.code-box');
    const canvaBtn = e.target.closest('.btn-canva');
    const favBtn = e.target.closest('.fav-btn');
    const catCard = e.target.closest('.category-card');

    const adminEditBtn = e.target.closest('.btn-admin-edit');
    const adminDeleteBtn = e.target.closest('.btn-admin-delete');
    const removeAdminBtn = e.target.closest('.btn-remove-admin');
    const iconItem = e.target.closest('.icon-picker-item');

    if (copyBtn || codeBox) {
      const code = (copyBtn || codeBox).dataset.code;
      copyToClipboard(code);
    } else if (canvaBtn) {
      const code = canvaBtn.dataset.code;
      openCanvaDeepLink(code);
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
      formElementIcon.value = iconClass;
      formIconPreview.className = `fa-solid ${iconClass}`;
      modalIconPicker.classList.add('hidden');
    }
  });

  // Admin Quick Action Buttons
  adminBtnAddElement.addEventListener('click', openAddElementModal);
  adminBtnManageAdmins.addEventListener('click', () => {
    renderAdminsList();
    modalManageAdmins.classList.remove('hidden');
  });
  adminBtnDownloadBackup.addEventListener('click', downloadJSONBackup);
  adminBtnRefresh.addEventListener('click', () => {
    fetchSupabaseElements();
    showToast('🔄 Ma\'lumotlar yangilandi');
  });

  // Admin Form Events
  btnSaveElement.addEventListener('click', saveElementForm);
  btnCancelElement.addEventListener('click', () => modalElementForm.classList.add('hidden'));
  modalElementClose.addEventListener('click', () => modalElementForm.classList.add('hidden'));

  // Icon Picker Modal Events
  btnOpenIconPicker.addEventListener('click', () => {
    renderIconPickerGrid();
    modalIconPicker.classList.remove('hidden');
  });
  btnCloseIconPicker.addEventListener('click', () => modalIconPicker.classList.add('hidden'));
  modalIconClose.addEventListener('click', () => modalIconPicker.classList.add('hidden'));

  iconSearchInput.addEventListener('input', (e) => {
    renderIconPickerGrid(e.target.value);
  });

  formElementIcon.addEventListener('input', (e) => {
    formIconPreview.className = `fa-solid ${e.target.value.trim() || 'fa-box-open'}`;
  });

  // Admin Management Modal Events
  btnSaveNewAdmin.addEventListener('click', addAdmin);
  btnCloseAdminsModal.addEventListener('click', () => modalManageAdmins.classList.add('hidden'));
  modalAdminsClose.addEventListener('click', () => modalManageAdmins.classList.add('hidden'));

  // Admin Filter Inputs
  adminSearchInput.addEventListener('input', renderAdminElements);
  adminCategoryFilter.addEventListener('change', renderAdminElements);

  // Search Input Events
  function updateSearchUIState() {
    const isSearching = !!currentSearchQuery || document.activeElement === searchInput;
    document.body.classList.toggle('is-searching', isSearching);
  }

  let searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !currentSearchQuery);

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

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
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
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    currentCategory = 'all';
    currentTag = '';
    clearSearchBtn.classList.add('hidden');
    document.body.classList.remove('is-searching');
    document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
    document.querySelector('.tag-chip[data-category="all"]').classList.add('active');
    renderElements();
  });

  // Fav Stat Click
  favStatBtn.addEventListener('click', () => {
    switchTab('favorites');
  });

  // Initial Load & Authorization Sync
  checkAdminPermissions();
  updateStats();
  renderElements();
  renderCategoriesGrid();
  fetchSupabaseElements();
});
