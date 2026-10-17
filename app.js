/* -------------------------------------------------------------
 * Canva Element Kodlari — Apple VisionOS / Modern Tech JS
 * Hammaga Yetadi
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  // Telegram WebApp Initialization
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#F8FAFC');
      tg.setBackgroundColor('#F8FAFC');
    } catch (e) {}
  }

  // Core App State
  let allElements = Array.isArray(window.CANVA_DATA) ? window.CANVA_DATA : [];
  let favorites = JSON.parse(localStorage.getItem('hy_canva_favs') || localStorage.getItem('zo_canva_favs') || '[]');
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentTag = '';
  let activeTab = 'home';
  let isUserAdmin = false;

  const SUPER_ADMIN_ID = 8544023815;
  let adminList = JSON.parse(localStorage.getItem('hy_canva_admins') || localStorage.getItem('zo_canva_admins') || `[${SUPER_ADMIN_ID}]`);

  const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : 'https://canva-bot.canva-bot.workers.dev';

  // DOM Element References
  const elementsGrid = document.getElementById('elements-grid');
  const newsElementsGrid = document.getElementById('news-elements-grid');
  const favoritesElementsGrid = document.getElementById('favorites-elements-grid');
  const favEmptyState = document.getElementById('fav-empty-state');
  const categoriesGrid = document.getElementById('categories-grid');
  const adminElementsList = document.getElementById('admin-elements-list');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const emptyState = document.getElementById('empty-state');
  const currentCategoryTitle = document.getElementById('current-category-title');

  const statTotal = document.getElementById('stat-total');
  const authorBadge = document.getElementById('author-badge');
  const toast = document.getElementById('toast');

  // Modals & Triggers
  const modalElementForm = document.getElementById('modal-element-form');
  const modalElementTitle = document.getElementById('modal-element-title');
  const modalElementClose = document.getElementById('modal-element-close');
  const btnCancelElement = document.getElementById('btn-cancel-element');
  const btnSaveElement = document.getElementById('btn-save-element');

  const formElementId = document.getElementById('form-element-id');
  const formElementCode = document.getElementById('form-element-code');
  const formElementDesc = document.getElementById('form-element-desc');
  const formElementCatVal = document.getElementById('form-element-cat-val');
  const formElementCatLabel = document.getElementById('form-element-cat-label');
  const formElementCatTrigger = document.getElementById('form-element-cat-trigger');
  const formElementCatCustom = document.getElementById('form-element-cat-custom');
  const formElementKeywords = document.getElementById('form-element-keywords');
  const formElementIsNew = document.getElementById('form-element-isnew');

  const modalManageAdmins = document.getElementById('modal-manage-admins');
  const modalAdminsClose = document.getElementById('modal-admins-close');
  const btnCloseAdminsModal = document.getElementById('btn-close-admins-modal');
  const adminsListContainer = document.getElementById('admins-list-container');

  const modalAdminLogin = document.getElementById('modal-admin-login');
  const modalLoginClose = document.getElementById('modal-login-close');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const adminPasscodeInput = document.getElementById('admin-passcode-input');

  const adminBtnAddElement = document.getElementById('admin-btn-add-element');
  const adminBtnManageAdmins = document.getElementById('admin-btn-manage-admins');
  const adminBtnDownloadBackup = document.getElementById('admin-btn-download-backup');
  const adminBtnRefresh = document.getElementById('admin-btn-refresh');
  const adminBtnChannels = document.getElementById('admin-btn-channels');
  const adminBtnBanners = document.getElementById('admin-btn-banners');
  const adminBtnSettings = document.getElementById('admin-btn-settings');
  const adminLockBtn = document.getElementById('admin-lock-btn');

  const adminSearchInput = document.getElementById('admin-search-input');
  const adminFilterCatTrigger = document.getElementById('admin-filter-cat-trigger');
  const adminFilterCatLabel = document.getElementById('admin-filter-cat-label');

  // Channel & Banner Modals DOM Elements
  const modalManageChannels = document.getElementById('modal-manage-channels');
  const modalChannelsClose = document.getElementById('modal-channels-close');
  const btnCloseChannelsModal = document.getElementById('btn-close-channels-modal');
  const channelsForceSubToggle = document.getElementById('channels-force-sub-toggle');
  const newChannelInput = document.getElementById('new-channel-input');
  const btnAddChannel = document.getElementById('btn-add-channel');
  const channelsListContainer = document.getElementById('channels-list-container');

  const modalManageBanners = document.getElementById('modal-manage-banners');
  const modalBannersClose = document.getElementById('modal-banners-close');
  const btnCloseBannersModal = document.getElementById('btn-close-banners-modal');

  // Canva Pro Promo Card & Modal DOM Elements
  const canvaProPromoCard = document.getElementById('canva-pro-promo-card');
  const proCardStatusBadge = document.getElementById('pro-card-status-badge');
  const proCardStatusText = document.getElementById('pro-card-status-text');
  const proCardExpiryPill = document.getElementById('pro-card-expiry-pill');
  const proCardExpiryText = document.getElementById('pro-card-expiry-text');
  const btnCanvaProClaim = document.getElementById('btn-canva-pro-claim');

  const adminBtnCanvaPro = document.getElementById('admin-btn-canva-pro');
  const modalManageCanvaPro = document.getElementById('modal-manage-canva-pro');
  const modalCanvaProClose = document.getElementById('modal-canva-pro-close');
  const btnCloseCanvaProModal = document.getElementById('btn-close-canva-pro-modal');
  const canvaProActiveToggle = document.getElementById('canva-pro-active-toggle');
  const canvaProLinkInput = document.getElementById('canva-pro-link-input');
  const canvaProExpiryInput = document.getElementById('canva-pro-expiry-input');
  const canvaProClaimsStat = document.getElementById('canva-pro-claims-stat');
  const btnResetCanvaProClaims = document.getElementById('btn-reset-canva-pro-claims');
  const btnSaveCanvaPro = document.getElementById('btn-save-canva-pro');

  // Haptic Feedback Helper
  function triggerHaptic(type = 'light') {
    try {
      if (tg?.HapticFeedback) {
        if (type === 'light' || type === 'medium' || type === 'heavy') {
          tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'success' || type === 'error' || type === 'warning') {
          tg.HapticFeedback.notificationOccurred(type);
        }
      }
    } catch (e) {}
  }

  let toastTimer = null;

  // Toast Notification (Micro-Pill Apple Dynamic Island Style)
  function showToast(msg = 'Nusxalandi') {
    const toastTitle = document.getElementById('toast-title');
    if (toastTitle) toastTitle.textContent = msg;

    if (toast) {
      toast.classList.remove('hidden');
      toast.classList.remove('toast-anim');
      void toast.offsetWidth; // re-trigger animation
      toast.classList.add('toast-anim');
    }
    triggerHaptic('success');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast?.classList.add('hidden');
    }, 1200);
  }

  // Copy to Clipboard Helper with In-Place Feedback & Anti-Zoom Fallback
  function copyToClipboard(text, customToastMsg = 'Nusxalandi', triggerEl = null) {
    if (!text) return;

    // In-place button tactile visual feedback
    if (triggerEl) {
      triggerEl.classList.add('copied-active');
      const originalHtml = triggerEl.innerHTML;
      if (triggerEl.classList.contains('btn-copy') || triggerEl.classList.contains('btn-copy-action')) {
        triggerEl.innerHTML = '<i class="fa-solid fa-check"></i> <span>Nusxalandi</span>';
      }
      setTimeout(() => {
        triggerEl.classList.remove('copied-active');
        if (triggerEl.classList.contains('btn-copy') || triggerEl.classList.contains('btn-copy-action')) {
          triggerEl.innerHTML = originalHtml;
        }
      }, 1100);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(customToastMsg);
      }).catch(() => {
        fallbackCopyTextToClipboard(text, customToastMsg);
      });
    } else {
      fallbackCopyTextToClipboard(text, customToastMsg);
    }
  }

  function fallbackCopyTextToClipboard(text, customToastMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', ''); // Prevents mobile keyboard & viewport shifts
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.fontSize = '16px'; // Prevents iOS Safari & Chrome from auto-zooming 300%
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      showToast(customToastMsg);
    } catch (err) {
      showToast("❌ Nusxalab bo'lmadi");
    }
    document.body.removeChild(textArea);
  }

  // Share / Uzatish Element Helper (Opens Native Telegram Share, No Floating Popup)
  function shareElement(code, description, triggerEl = null) {
    if (triggerEl) {
      triggerEl.classList.add('copied-active');
      const origHtml = triggerEl.innerHTML;
      triggerEl.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        triggerEl.classList.remove('copied-active');
        triggerEl.innerHTML = origHtml;
      }, 1100);
    }

    triggerHaptic('light');

    const shareText = `🎨 Canva Element Kodi: ${code}\n📌 Tavsif: ${description || 'Canva elementi'}\n\n✨ Mini App: Hammaga Yetadi`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://canva-elements.pages.dev')}&text=${encodeURIComponent(shareText)}`;

    try {
      if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(shareUrl);
        return;
      }
    } catch (e) {
      console.warn('openTelegramLink failed:', e);
    }

    try {
      if (tg && typeof tg.openLink === 'function') {
        tg.openLink(shareUrl, { try_instant_view: false });
        return;
      }
    } catch (e2) {
      console.warn('openLink failed:', e2);
    }

    window.open(shareUrl, '_blank');
  }

  // Admin Verification Logic (Hide Admin tab by default for non-admins)
  function checkAdminPermissions() {
    const currentUserId = getTelegramUserId() || tg?.initDataUnsafe?.user?.id;
    const currentUsername = tg?.initDataUnsafe?.user?.username?.toLowerCase();
    const navItemAdmin = document.getElementById('nav-item-admin');
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');

    let adminUnlocked = false;
    try {
      adminUnlocked = localStorage.getItem('hy_admin_unlocked') === 'true' || localStorage.getItem('zo_admin_unlocked') === 'true';
    } catch(e) {}

    const uId = currentUserId ? Number(currentUserId) : null;
    const isIdAdmin = uId && (uId === SUPER_ADMIN_ID || adminList.includes(uId) || adminList.includes(String(uId)));
    const isNameAdmin = currentUsername && (currentUsername === 'yaxshibola' || currentUsername === 'yomonbola' || adminList.includes(`@${currentUsername}`) || adminList.includes(currentUsername));
    const isExplicitAdminUrl = adminParam === '1' && (uId === SUPER_ADMIN_ID || isIdAdmin);

    if (isIdAdmin || isNameAdmin || isExplicitAdminUrl || adminUnlocked) {
      isUserAdmin = true;
    } else {
      isUserAdmin = false;
    }

    if (navItemAdmin) {
      if (isUserAdmin) {
        navItemAdmin.classList.remove('hidden');
      } else {
        navItemAdmin.classList.add('hidden');
      }
    }
  }

  // Admin Secret 5-Click Unlock
  let badgeClickCounter = 0;
  let badgeClickTimer = null;
  authorBadge?.addEventListener('click', () => {
    badgeClickCounter++;
    if (badgeClickTimer) clearTimeout(badgeClickTimer);

    if (badgeClickCounter >= 5) {
      badgeClickCounter = 0;
      if (!isUserAdmin) {
        openAdminLoginModal();
      } else {
        switchTab('admin');
        showToast('🔓 Admin rejimidasiz');
      }
    } else {
      badgeClickTimer = setTimeout(() => {
        badgeClickCounter = 0;
      }, 1500);
    }
  });

  function openAdminLoginModal() {
    if (adminPasscodeInput) adminPasscodeInput.value = '';
    modalAdminLogin?.classList.remove('hidden');
    adminPasscodeInput?.focus();
  }

  btnSubmitLogin?.addEventListener('click', () => {
    const passcode = adminPasscodeInput?.value?.trim();
    if (passcode === '777' || passcode === '2026' || passcode === 'yetadi') {
      isUserAdmin = true;
      try { 
        localStorage.setItem('hy_admin_unlocked', 'true'); 
      } catch(e) {}
      checkAdminPermissions();
      modalAdminLogin?.classList.add('hidden');
      document.getElementById('sub-gate-overlay')?.classList.add('hidden');
      revealMainAppContent();
      switchTab('admin');
      showToast('🔑 Admin panelga xush kelibsiz!');
    } else {
      showToast("❌ Noto'g'ri parol!");
      triggerHaptic('error');
    }
  });

  btnCancelLogin?.addEventListener('click', () => modalAdminLogin?.classList.add('hidden'));
  modalLoginClose?.addEventListener('click', () => modalAdminLogin?.classList.add('hidden'));

  adminLockBtn?.addEventListener('click', () => {
    isUserAdmin = false;
    try { localStorage.setItem('hy_admin_unlocked', 'false'); } catch(e) {}
    checkAdminPermissions();
    switchTab('home');
    showToast('🔒 Admin rejimidan chiqildi');
  });

  // Data Fetching from Supabase Backend API
  async function fetchSupabaseElements() {
    try {
    const API_BASE = `${API_HOST}/api/elements`;

      const res = await fetch(API_BASE, { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allElements = data.map(item => ({
            id: item.id,
            code: item.code,
            description: item.description,
            category: item.category,
            isNew: item.is_new !== undefined ? item.is_new : true,
            keywords: Array.isArray(item.keywords) ? item.keywords : []
          }));
          updateStats();
          renderElements();
          renderCategoriesGrid();
          renderNewsElements();
          renderAdminElements();
        }
      }
    } catch (e) {
      console.log('Using pre-bundled CANVA_DATA');
    }
  }

  // Update Counters & Stats
  function updateStats() {
    if (statTotal) statTotal.textContent = allElements.length;
  }

  // Category Icon Mapping
  const CATEGORY_ICONS = {
    'Trenddagi 3D Elementlar': 'fa-box-open',
    'SMM, Target, Dizayn va Infografika': 'fa-bullhorn',
    'Abstrakt Elementlar va Shakllar': 'fa-shapes',
    'Aesthetic/Estetik Elementlar': 'fa-wand-magic-sparkles',
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

  function getCategoriesMap() {
    const map = {};
    allElements.forEach(item => {
      if (item && item.category) {
        map[item.category] = (map[item.category] || 0) + 1;
      }
    });
    return map;
  }

  // Toggle Favorite Item
  function toggleFavorite(id) {
    const numId = Number(id) || id;
    const index = favorites.indexOf(numId);
    if (index === -1) {
      favorites.push(numId);
      showToast('⭐ Saqlanganlarga qo\'shildi');
    } else {
      favorites.splice(index, 1);
      showToast('🗑️ Saqlanganlardan olindi');
    }
    try {
      localStorage.setItem('hy_canva_favs', JSON.stringify(favorites));
    } catch (e) {}

    renderElements();
    renderFavoritesElements();
    renderNewsElements();
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Render Single Card HTML
  function renderCardHTML(item) {
    if (!item) return '';
    const isFav = favorites.includes(item.id) || favorites.includes(String(item.id));
    const safeCode = escapeAttr(item.code || '');
    const safeDesc = escapeAttr(item.description || 'Canva elementi');
    const safeCat = escapeAttr(item.category || "Bo'lim");

    return `
      <div class="element-card" data-id="${item.id}">
        <div class="card-header-row">
          <span class="category-tag-badge">${safeCat}</span>
          <button class="fav-star-btn ${isFav ? 'active' : ''} fav-btn" data-id="${item.id}" aria-label="Saqlash">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="element-card-title">${safeDesc}</div>

        <div class="code-block-container code-box" data-code="${safeCode}">
          <span class="code-text">${safeCode}</span>
          <i class="fa-regular fa-copy code-copy-icon"></i>
        </div>

        <div class="card-bottom-row">
          <button class="btn-copy-action btn-copy" data-code="${safeCode}">
            <i class="fa-regular fa-copy"></i> Nusxalash
          </button>
          <button class="btn-share-icon btn-share" data-code="${safeCode}" data-desc="${safeDesc}" aria-label="Ulashish">
            <i class="fa-solid fa-arrow-up-from-bracket"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Render Elements Grid for Home Tab
  function renderElements() {
    if (!elementsGrid) return;

    let filtered = [...allElements];

    if (currentCategory !== 'all') {
      filtered = filtered.filter(item => item && item.category === currentCategory);
    }

    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        if (!item) return false;
        const codeMatch = item.code && item.code.toLowerCase().includes(q);
        const descMatch = item.description && item.description.toLowerCase().includes(q);
        const catMatch = item.category && item.category.toLowerCase().includes(q);
        const kwMatch = Array.isArray(item.keywords) && item.keywords.some(k => String(k).toLowerCase().includes(q));
        return codeMatch || descMatch || catMatch || kwMatch;
      });
    }

    if (currentTag) {
      const tagLower = currentTag.toLowerCase().trim();
      filtered = filtered.filter(item => {
        if (!item || !Array.isArray(item.keywords)) return false;
        return item.keywords.some(k => String(k).toLowerCase() === tagLower);
      });
    }

    // Automatically hide banner during active search or category filtering so results show instantly
    const featuredBanner = document.getElementById('featured-carousel-card');
    const isFilteredOrSearching = !!currentSearchQuery || currentCategory !== 'all' || !!currentTag;

    if (featuredBanner) {
      if (isFilteredOrSearching) {
        featuredBanner.classList.add('hidden');
      } else {
        featuredBanner.classList.remove('hidden');
      }
    }

    if (filtered.length === 0) {
      elementsGrid.innerHTML = '';
      emptyState?.classList.remove('hidden');
    } else {
      emptyState?.classList.add('hidden');
      elementsGrid.innerHTML = filtered.map(renderCardHTML).filter(Boolean).join('');
    }

    if (currentCategoryTitle) {
      if (currentSearchQuery) {
        currentCategoryTitle.textContent = `Qidiruv natijalari (${filtered.length})`;
      } else if (currentCategory !== 'all') {
        currentCategoryTitle.textContent = `${currentCategory} (${filtered.length})`;
      } else {
        currentCategoryTitle.textContent = "Yangi qo'shilgan elementlar";
      }
    }
  }

  // Render Categories View Grid
  function renderCategoriesGrid() {
    try {
      if (!categoriesGrid) return;
      const catMap = getCategoriesMap();
      let html = '';

      for (const [cat, count] of Object.entries(catMap)) {
        const icon = CATEGORY_ICONS[cat] || 'fa-layer-group';
        html += `
          <div class="category-card" data-category="${cat}">
            <div class="cat-icon-wrapper"><i class="fa-solid ${icon}"></i></div>
            <div class="cat-card-title">${cat}</div>
            <span class="cat-card-count">${count} ta element</span>
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
      let newsItems = allElements.filter(item => item && (item.isNew || item.id <= 50));
      if (currentCategory && currentCategory !== 'all') {
        newsItems = allElements.filter(item => item && item.category === currentCategory);
      }
      newsElementsGrid.innerHTML = newsItems.map(renderCardHTML).filter(Boolean).join('');
    } catch (e) {
      console.error('Render news error:', e);
    }
  }

  // Render Favorites Tab View
  function renderFavoritesElements() {
    try {
      if (!favoritesElementsGrid) return;

      const favItems = allElements.filter(item => item && (favorites.includes(item.id) || favorites.includes(String(item.id))));
      
      if (favItems.length === 0) {
        if (favEmptyState) favEmptyState.classList.remove('hidden');
        favoritesElementsGrid.classList.add('hidden');
      } else {
        if (favEmptyState) favEmptyState.classList.add('hidden');
        favoritesElementsGrid.classList.remove('hidden');
        favoritesElementsGrid.innerHTML = favItems.map(renderCardHTML).filter(Boolean).join('');
      }
    } catch (e) {
      console.error('Render favorites error:', e);
    }
  }

  /* -------------------------------------------------------------
   * VisionOS Custom Category Picker Modal Logic
   * ------------------------------------------------------------- */
  let pickerTarget = 'form'; // 'form' or 'admin'

  function openCategoryPicker(target = 'form') {
    pickerTarget = target;
    const modalCategoryPicker = document.getElementById('modal-category-picker');
    const pickerSearch = document.getElementById('cat-picker-search');
    
    if (pickerSearch) pickerSearch.value = '';
    renderCategoryPickerList();
    modalCategoryPicker?.classList.remove('hidden');
  }

  function renderCategoryPickerList(filterText = '') {
    const listElem = document.getElementById('custom-categories-list');
    if (!listElem) return;

    const catMap = getCategoriesMap();
    const q = filterText.toLowerCase().trim();
    let html = '';

    if (pickerTarget === 'admin' || pickerTarget === 'filter') {
      html += `
        <div class="custom-cat-item ${currentCategory === 'all' ? 'selected' : ''}" data-cat="all">
          <div class="cat-item-info">
            <div class="cat-item-icon"><i class="fa-solid fa-border-all"></i></div>
            <span class="cat-item-name">Barcha Bo'limlar</span>
          </div>
          <span class="cat-item-count">${allElements.length} ta</span>
        </div>
      `;
    }

    for (const [cat, count] of Object.entries(catMap)) {
      if (q && !cat.toLowerCase().includes(q)) continue;
      const icon = CATEGORY_ICONS[cat] || 'fa-layer-group';
      const isSelected = pickerTarget === 'form' 
        ? (formElementCatVal?.value === cat)
        : (currentCategory === cat);

      html += `
        <div class="custom-cat-item ${isSelected ? 'selected' : ''}" data-cat="${cat}">
          <div class="cat-item-info">
            <div class="cat-item-icon"><i class="fa-solid ${icon}"></i></div>
            <span class="cat-item-name">${cat}</span>
          </div>
          <span class="cat-item-count">${count} ta</span>
        </div>
      `;
    }

    if (pickerTarget === 'form') {
      html += `
        <div class="custom-cat-item" data-cat="__custom__" style="border-style: dashed; border-color: var(--primary-pink);">
          <div class="cat-item-info">
            <div class="cat-item-icon" style="background: var(--pink-soft-bg); color: var(--primary-pink);"><i class="fa-solid fa-plus"></i></div>
            <span class="cat-item-name" style="color: var(--primary-pink);">Yangi bo'lim yaratish...</span>
          </div>
        </div>
      `;
    }

    listElem.innerHTML = html;
  }

  formElementCatTrigger?.addEventListener('click', () => openCategoryPicker('form'));
  adminFilterCatTrigger?.addEventListener('click', () => openCategoryPicker('admin'));

  document.getElementById('modal-cat-picker-close')?.addEventListener('click', () => {
    document.getElementById('modal-category-picker')?.classList.add('hidden');
  });

  document.getElementById('cat-picker-search')?.addEventListener('input', (e) => {
    renderCategoryPickerList(e.target.value);
  });

  document.getElementById('custom-categories-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.custom-cat-item');
    if (!item) return;
    const cat = item.dataset.cat;

    if (pickerTarget === 'form') {
      if (cat === '__custom__') {
        if (formElementCatCustom) formElementCatCustom.classList.remove('hidden');
        if (formElementCatLabel) formElementCatLabel.textContent = "Yangi bo'lim nomi...";
        if (formElementCatVal) formElementCatVal.value = '';
      } else {
        if (formElementCatCustom) formElementCatCustom.classList.add('hidden');
        if (formElementCatVal) formElementCatVal.value = cat;
        if (formElementCatLabel) formElementCatLabel.textContent = cat;
      }
    } else if (pickerTarget === 'admin') {
      currentCategory = cat;
      if (adminFilterCatLabel) adminFilterCatLabel.textContent = cat === 'all' ? "Barcha Bo'limlar" : cat;
      renderAdminElements();
    } else if (pickerTarget === 'filter') {
      currentCategory = cat;
      currentTag = '';
      document.querySelectorAll('.tag-chip').forEach(t => {
        t.classList.toggle('active', t.dataset.category === cat || (cat === 'all' && t.dataset.category === 'all'));
      });
      if (activeTab === 'news') {
        renderNewsElements();
      } else {
        if (activeTab !== 'home') switchTab('home');
        renderElements();
      }
    }

    document.getElementById('modal-category-picker')?.classList.add('hidden');
    triggerHaptic('light');
  });

  /* -------------------------------------------------------------
   * Admin Panel & Admin Management Functions
   * ------------------------------------------------------------- */

  function renderAdminElements() {
    if (!adminElementsList) return;

    let filtered = [...allElements];

    if (adminSearchInput && adminSearchInput.value.trim()) {
      const q = adminSearchInput.value.toLowerCase().trim();
      filtered = filtered.filter(item => {
        if (!item) return false;
        return (item.code && item.code.toLowerCase().includes(q)) ||
               (item.description && item.description.toLowerCase().includes(q));
      });
    }

    if (currentCategory !== 'all') {
      filtered = filtered.filter(item => item && item.category === currentCategory);
    }

    if (filtered.length === 0) {
      adminElementsList.innerHTML = '<div style="padding:16px; text-align:center; color:#9E96A8; font-size:12px;">Elementlar topilmadi</div>';
      return;
    }

    adminElementsList.innerHTML = filtered.slice(0, 100).map(item => `
      <div class="admin-item-row">
        <div class="admin-item-left">
          <span class="admin-item-code">${item.code}</span>
          <span class="admin-item-desc">${item.description}</span>
          <span class="admin-item-cat">${item.category}</span>
        </div>
        <div class="admin-item-right">
          <button class="btn-admin-edit" data-id="${item.id}">Tahrirlash</button>
          <button class="btn-admin-delete" data-id="${item.id}">O'chirish</button>
        </div>
      </div>
    `).join('');
  }

  function openAddElementModal() {
    if (!modalElementForm) return;
    if (modalElementTitle) modalElementTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Yangi Element Qo\'shish';
    if (formElementId) formElementId.value = '';
    if (formElementCode) formElementCode.value = '';
    if (formElementDesc) formElementDesc.value = '';
    
    if (formElementCatVal) formElementCatVal.value = 'Trenddagi 3D Elementlar';
    if (formElementCatLabel) formElementCatLabel.textContent = 'Trenddagi 3D Elementlar';
    if (formElementCatCustom) {
      formElementCatCustom.value = '';
      formElementCatCustom.classList.add('hidden');
    }
    
    if (formElementKeywords) formElementKeywords.value = '';
    if (formElementIsNew) formElementIsNew.checked = true;

    modalElementForm.classList.remove('hidden');
  }

  function openEditElementModal(id) {
    const item = allElements.find(e => e && e.id == id);
    if (!item || !modalElementForm) return;

    if (modalElementTitle) modalElementTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Elementni Tahrirlash';
    if (formElementId) formElementId.value = item.id;
    if (formElementCode) formElementCode.value = item.code || '';
    if (formElementDesc) formElementDesc.value = item.description || '';
    
    const targetCat = item.category || 'Trenddagi 3D Elementlar';
    if (formElementCatVal) formElementCatVal.value = targetCat;
    if (formElementCatLabel) formElementCatLabel.textContent = targetCat;
    if (formElementCatCustom) formElementCatCustom.classList.add('hidden');

    if (formElementKeywords) formElementKeywords.value = (item.keywords || []).join(', ');
    if (formElementIsNew) formElementIsNew.checked = !!item.isNew;

    modalElementForm.classList.remove('hidden');
  }

  async function saveElementForm() {
    const id = formElementId ? formElementId.value : '';
    const code = formElementCode ? formElementCode.value.trim() : '';
    const description = formElementDesc ? formElementDesc.value.trim() : '';
    
    let category = formElementCatVal ? formElementCatVal.value : 'Trenddagi 3D Elementlar';
    if (!category && formElementCatCustom) {
      category = formElementCatCustom.value.trim();
    }
    if (!category) category = 'Trenddagi 3D Elementlar';

    const keywordsStr = formElementKeywords ? formElementKeywords.value.trim() : '';
    const isNew = formElementIsNew ? formElementIsNew.checked : true;

    if (!code || !description) {
      showToast('❌ Kod va Tavsifni kiriting!');
      return;
    }

    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [code, description, category];

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

    const API_BASE = `${API_HOST}/api/elements`;

    const initData = tg?.initData || '';
    const tgUser = tg?.initDataUnsafe?.user;
    const adminId = getActiveAdminId();
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      'x-user-id': String(adminId || tgUser?.id || '')
    };

    try {
      if (id) {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('API Error');

        const idx = allElements.findIndex(e => e && e.id == id);
        if (idx !== -1) {
          allElements[idx] = { ...allElements[idx], ...payload, isNew };
        }
        showToast('✅ Element muvaffaqiyatli yangilandi!');
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const resData = await res.json();
          const created = resData.element || payload;
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

    const API_BASE = `${API_HOST}/api/elements`;

    const initData = tg?.initData || '';
    const tgUser = tg?.initDataUnsafe?.user;
    const adminId = getActiveAdminId();
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      'x-user-id': String(adminId || tgUser?.id || '')
    };

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!res.ok) throw new Error('Delete failed');

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

  // Dynamic Admin List & Management Functions
  function renderAdminsList() {
    if (!adminsListContainer) return;
    const ADMIN_NAMES = {
      8544023815: "Yaxshi Bola 🩵",
      "8544023815": "Yaxshi Bola 🩵"
    };

    const uniqueAdmins = Array.from(new Set([SUPER_ADMIN_ID, ...adminList]));
    adminList = uniqueAdmins;

    adminsListContainer.innerHTML = adminList.map(admin => {
      const numAdmin = Number(admin);
      const isSuper = numAdmin === SUPER_ADMIN_ID;
      const displayName = ADMIN_NAMES[numAdmin] || (isSuper ? "Asosiy Administrator 🩵" : `Admin (${admin})`);

      return `
        <div class="admin-user-row" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--card-bg); margin-bottom:8px; border-radius:var(--radius-md); border:1px solid var(--card-border);">
          <div class="admin-user-info" style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid ${isSuper ? 'fa-crown' : 'fa-user-shield'}" style="color: ${isSuper ? '#0ea5e9' : '#6366F1'}; font-size: 16px;"></i>
            <div>
              <strong style="color:var(--text-primary); font-size:13px; display:block;">${displayName}</strong>
              <small style="font-size:11px; color:var(--text-secondary);">ID / User: ${admin}</small>
            </div>
          </div>
          ${isSuper 
            ? `<span style="font-size:10px; color:#0ea5e9; font-weight:700; background:rgba(14,165,233,0.1); padding:3px 10px; border-radius:12px;">ASOSIY ADMIN</span>`
            : `<button class="btn-remove-admin" data-admin="${admin}" style="padding:4px 10px; border-radius:12px; background:rgba(239,68,68,0.1); color:#ef4444; border:none; font-size:11px; font-weight:700; cursor:pointer;">O'chirish</button>`
          }
        </div>
      `;
    }).join('');
  }

  async function addAdmin() {
    const input = document.getElementById('new-admin-input');
    const val = input ? input.value.trim() : '';
    if (!val) {
      return showToast("⚠️ Admin ID yoki Username yozing!");
    }

    const item = isNaN(Number(val)) ? val : Number(val);
    if (!adminList.includes(item) && !adminList.includes(String(item))) {
      adminList.push(item);
      try {
        localStorage.setItem('hy_canva_admins', JSON.stringify(adminList));
      } catch (e) {}

      if (input) input.value = '';
      renderAdminsList();
      checkAdminPermissions();
      showToast("✅ Yangi admin qo'shildi!");

      const API_BASE = `${API_HOST}/api`;

      try {
        await fetch(`${API_BASE}/admins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: item })
        });
      } catch (e) {}
    } else {
      showToast("⚠️ Ushbu admin allaqachon mavjud!");
    }
  }

  async function removeAdmin(item) {
    const numAdmin = Number(item);
    if (numAdmin === SUPER_ADMIN_ID) {
      return showToast("❌ Asosiy adminni o'chirib bo'lmaydi!");
    }

    adminList = adminList.filter(a => String(a) !== String(item) && Number(a) !== numAdmin);
    try {
      localStorage.setItem('hy_canva_admins', JSON.stringify(adminList));
    } catch (e) {}

    renderAdminsList();
    checkAdminPermissions();
    showToast("🗑️ Admin huquqi olindi");

    const API_BASE = `${API_HOST}/api`;

    try {
      await fetch(`${API_BASE}/admins/${item}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  }

  // Backup & JSON Download Implementation
  function downloadJSONBackup() {
    const modalBackupDownload = document.getElementById('modal-backup-download');
    const backupCountElem = document.getElementById('backup-count-elem');
    const backupCountAdmin = document.getElementById('backup-count-admin');
    const backupDateStr = document.getElementById('backup-date-str');
    const backupDirectLink = document.getElementById('backup-direct-link');
    const backupCopyTextBtn = document.getElementById('backup-copy-text-btn');
    const backupPreviewText = document.getElementById('backup-preview-text');

    const dateStr = new Date().toISOString().split('T')[0];

    const backupData = {
      timestamp: new Date().toISOString(),
      date: dateStr,
      app: 'Canva Element Kodlari — Hammaga Yetadi',
      author: 'Hammaga Yetadi',
      totalElements: allElements.length,
      admins: adminList,
      categories: Object.keys(getCategoriesMap()),
      elements: allElements
    };

    const jsonStr = JSON.stringify(backupData, null, 2);

    if (backupCountElem) backupCountElem.textContent = `${allElements.length} ta element`;
    if (backupCountAdmin) backupCountAdmin.textContent = `${adminList.length} ta admin`;
    if (backupDateStr) backupDateStr.textContent = `Sana: ${dateStr}`;
    if (backupPreviewText) backupPreviewText.value = jsonStr;

    // Create Downloadable Blob URL
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);

    if (backupDirectLink) {
      backupDirectLink.href = blobUrl;
      backupDirectLink.download = `canva_elements_backup_${dateStr}.json`;
    }

    if (backupCopyTextBtn) {
      backupCopyTextBtn.onclick = () => {
        copyToClipboard(jsonStr, '📋 Backup kodi nusxalandi!');
      };
    }

    // Auto-trigger browser file download link
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `canva_elements_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    modalBackupDownload?.classList.remove('hidden');
    showToast('💾 Zaxira fayli yuklab olindi!');
  }

  // Admin Settings Modal Logic
  async function openAdminSettingsModal() {
    const modalSettings = document.getElementById('modal-admin-settings');
    const channelInput = document.getElementById('settings-channel-input');
    const forceSubToggle = document.getElementById('settings-force-sub-toggle');

    let savedSettings = { channel: '@hammagayetadi', forceSub: true };
    try {
      const stored = localStorage.getItem('hy_canva_settings') || localStorage.getItem('zo_canva_settings');
      if (stored) savedSettings = JSON.parse(stored);
    } catch(e) {}

    if (channelInput) channelInput.value = savedSettings.channel || '@hammagayetadi';
    if (forceSubToggle) forceSubToggle.checked = !!savedSettings.forceSub;

    modalSettings?.classList.remove('hidden');

    try {
      const res = await fetch(`${API_HOST}/api/settings`);
      if (res.ok) {
        const live = await res.json();
        if (channelInput && Array.isArray(live.forceChannels) && live.forceChannels.length > 0) {
          channelInput.value = live.forceChannels[0];
        }
        if (forceSubToggle && typeof live.forceSubActive === 'boolean') {
          forceSubToggle.checked = live.forceSubActive;
        }
      }
    } catch (e) {}
  }

  async function saveAdminSettings() {
    const channelInput = document.getElementById('settings-channel-input');
    const forceSubToggle = document.getElementById('settings-force-sub-toggle');

    const channelVal = channelInput ? channelInput.value.trim() : '@hammagayetadi';
    const isEnabled = forceSubToggle ? forceSubToggle.checked : true;

    const settingsObj = { channel: channelVal, forceSub: isEnabled };
    try {
      localStorage.setItem('hy_canva_settings', JSON.stringify(settingsObj));
    } catch(e) {}

    const API_BASE = `${API_HOST}/api`;

    try {
      await fetch(`${API_BASE}/settings/force-sub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUsername: channelVal, isEnabled })
      });
    } catch(e) {}

    document.getElementById('modal-admin-settings')?.classList.add('hidden');
    showToast('⚙️ Bot sozlamalari saqlandi!');
  }

  // Dynamic Auto-sliding Featured Banner Carousel Logic
  let currentSlideIndex = 0;
  let carouselTimer = null;
  let activeBanners = [
    { slot: 1, imageUrl: 'assets/user_banner3.jpg', linkUrl: '' },
    { slot: 2, imageUrl: 'assets/user_banner2.jpg', linkUrl: '' },
    { slot: 3, imageUrl: 'assets/user_banner1.jpg', linkUrl: '' }
  ];

  async function fetchBannersAndRenderCarousel() {
    try {
      const res = await fetch(`${API_HOST}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          activeBanners = data.banners;
        }
      }
    } catch (e) {
      console.warn('Banners fetch warning:', e);
    }
    renderCarouselDOM();
  }

  function renderCarouselDOM() {
    const carouselTrack = document.getElementById('carousel-track');
    const carouselDots = document.getElementById('carousel-dots');
    if (!carouselTrack || !carouselDots) return;

    carouselTrack.innerHTML = '';
    carouselDots.innerHTML = '';
    if (carouselTimer) clearInterval(carouselTimer);

    const bannerCount = activeBanners.length;
    const slideWidthPercent = 100 / Math.max(1, bannerCount);

    activeBanners.forEach((b, index) => {
      // Slide element
      const slideDiv = document.createElement('div');
      slideDiv.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
      slideDiv.style.flex = `0 0 100%`;
      slideDiv.style.cursor = b.linkUrl ? 'pointer' : 'default';

      const img = document.createElement('img');
      img.src = b.imageUrl || 'assets/user_banner1.jpg';
      img.className = 'banner-full-img';
      img.alt = `Canva Banner ${b.slot}`;
      img.loading = 'lazy';
      
      // Link click handler
      if (b.linkUrl && b.linkUrl.trim()) {
        slideDiv.addEventListener('click', () => {
          let targetUrl = b.linkUrl.trim();
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
          }
          if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(targetUrl);
          } else {
            window.open(targetUrl, '_blank');
          }
        });
      }

      slideDiv.appendChild(img);
      carouselTrack.appendChild(slideDiv);

      // Dot element
      const dot = document.createElement('span');
      dot.className = `dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('data-slide', index);
      dot.addEventListener('click', () => {
        goToSlide(index);
        restartCarouselTimer();
      });
      carouselDots.appendChild(dot);
    });

    currentSlideIndex = 0;
    goToSlide(0);
    restartCarouselTimer();
  }

  function goToSlide(index) {
    const carouselTrack = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('#carousel-dots .dot');
    if (!carouselTrack || activeBanners.length === 0) return;

    currentSlideIndex = index % activeBanners.length;
    carouselTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlideIndex);
    });
  }

  function restartCarouselTimer() {
    if (carouselTimer) clearInterval(carouselTimer);
    if (activeBanners.length <= 1) return;
    carouselTimer = setInterval(() => {
      currentSlideIndex = (currentSlideIndex + 1) % activeBanners.length;
      goToSlide(currentSlideIndex);
    }, 4000);
  }

  // Switch Bottom Navbar Tabs
  function switchTab(tabName) {
    if (tabName === 'admin' && !isUserAdmin) {
      openAdminLoginModal();
      return;
    }

    activeTab = tabName;

    // Highlight navbar buttons
    document.querySelectorAll('#bottom-nav-bar .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Hide all tab views
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });

    // Show target view
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
      activeView.classList.remove('hidden');
      activeView.classList.add('active');
    }

    // Toggle sticky search bar visibility
    const searchSection = document.getElementById('sticky-search-section');
    if (searchSection) {
      if (tabName === 'home' || tabName === 'news') {
        searchSection.classList.remove('hidden');
      } else {
        searchSection.classList.add('hidden');
      }
    }

    triggerHaptic('light');

    if (tabName === 'home') renderElements();
    if (tabName === 'categories') renderCategoriesGrid();
    if (tabName === 'news') renderNewsElements();
    if (tabName === 'favorites') renderFavoritesElements();
    if (tabName === 'admin') {
      renderAdminElements();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bottom Navbar Delegation Listener
  const bottomNavBarElem = document.getElementById('bottom-nav-bar');
  if (bottomNavBarElem) {
    bottomNavBarElem.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-item');
      if (navBtn && navBtn.dataset.tab) {
        switchTab(navBtn.dataset.tab);
      }
    });
  }

  // Navigation Buttons
  document.getElementById('btn-view-all-news')?.addEventListener('click', () => switchTab('news'));
  document.getElementById('btn-explore-favs')?.addEventListener('click', () => switchTab('home'));
  document.getElementById('btn-news-back')?.addEventListener('click', () => switchTab('home'));
  document.getElementById('btn-admin-back')?.addEventListener('click', () => switchTab('home'));
  
  // Header Notification & Search & Filter Buttons
  document.getElementById('btn-header-notif')?.addEventListener('click', () => {
    switchTab('news');
    showToast('🔔 Yangi qo\'shilgan elementlar');
  });

  document.getElementById('btn-cat-search')?.addEventListener('click', () => {
    switchTab('home');
    if (searchInput) searchInput.focus();
  });

  document.getElementById('btn-news-filter')?.addEventListener('click', () => {
    openCategoryPicker('filter');
  });

  document.getElementById('btn-favs-options')?.addEventListener('click', () => {
    if (!favorites || favorites.length === 0) {
      showToast('⭐ Saqlanganlar hozircha bo\'sh');
      return;
    }
    if (confirm('Barcha saqlangan elementlarni o\'chirmoqchimisiz?')) {
      favorites = [];
      try { 
        localStorage.removeItem('hy_canva_favs'); 
        localStorage.removeItem('zo_canva_favs'); 
      } catch (e) {}
      renderFavoritesElements();
      renderElements();
      showToast('🗑️ Saqlanganlar tozalandi');
    }
  });
  
  // Settings & Backup Modals Click Handlers
  document.getElementById('admin-btn-settings')?.addEventListener('click', openAdminSettingsModal);
  document.getElementById('btn-cancel-settings')?.addEventListener('click', () => document.getElementById('modal-admin-settings')?.classList.add('hidden'));
  document.getElementById('modal-settings-close')?.addEventListener('click', () => document.getElementById('modal-admin-settings')?.classList.add('hidden'));
  document.getElementById('btn-save-settings')?.addEventListener('click', saveAdminSettings);

  // Dynamic Add Admin Button Handler
  document.getElementById('btn-save-new-admin')?.addEventListener('click', addAdmin);

  // Global Event Delegation for Cards & Admin Actions
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy');
    const shareBtn = e.target.closest('.btn-share');
    const codeBox = e.target.closest('.code-box');
    const favBtn = e.target.closest('.fav-btn');
    const catCard = e.target.closest('.category-card');

    const adminEditBtn = e.target.closest('.btn-admin-edit');
    const adminDeleteBtn = e.target.closest('.btn-admin-delete');
    const removeAdminBtn = e.target.closest('.btn-remove-admin');

    if (copyBtn || codeBox) {
      const targetEl = copyBtn || codeBox;
      const code = targetEl.dataset.code;
      copyToClipboard(code, 'Nusxalandi!', targetEl);
    } else if (shareBtn) {
      const code = shareBtn.dataset.code;
      const desc = shareBtn.dataset.desc;
      shareElement(code, desc, shareBtn);
    } else if (favBtn) {
      const id = parseInt(favBtn.dataset.id, 10) || favBtn.dataset.id;
      toggleFavorite(id);
    } else if (catCard) {
      currentCategory = catCard.dataset.category;
      currentTag = '';
      document.querySelectorAll('.tag-chip').forEach(t => {
        t.classList.toggle('active', t.dataset.category === currentCategory);
      });
      switchTab('home');
      renderElements();
    } else if (adminEditBtn) {
      openEditElementModal(adminEditBtn.dataset.id);
    } else if (adminDeleteBtn) {
      deleteElement(adminDeleteBtn.dataset.id);
    } else if (removeAdminBtn) {
      removeAdmin(removeAdminBtn.dataset.admin);
    }
  });

  // Admin Action Row Buttons
  adminBtnAddElement?.addEventListener('click', openAddElementModal);
  adminBtnManageAdmins?.addEventListener('click', () => {
    renderAdminsList();
    modalManageAdmins?.classList.remove('hidden');
  });
  adminBtnDownloadBackup?.addEventListener('click', downloadJSONBackup);
  adminBtnRefresh?.addEventListener('click', () => {
    fetchSupabaseElements();
    fetchBannersAndRenderCarousel();
    fetchCanvaProData();
    showToast('🔄 Ma\'lumotlar yangilandi');
  });
  adminBtnChannels?.addEventListener('click', openManageChannelsModal);
  adminBtnBanners?.addEventListener('click', openManageBannersModal);
  adminBtnCanvaPro?.addEventListener('click', openManageCanvaProModal);

  // Channel Management Logic
  async function openManageChannelsModal() {
    modalManageChannels?.classList.remove('hidden');
    await loadAndRenderChannels();
  }

  async function loadAndRenderChannels() {
    if (!channelsListContainer) return;
    channelsListContainer.innerHTML = '<div style="opacity:0.6; font-size:13px;">Yuklanmoqda...</div>';
    
    try {
      const res = await fetch(`${API_HOST}/api/channels`);
      if (res.ok) {
        const data = await res.json();
        if (channelsForceSubToggle) {
          channelsForceSubToggle.checked = Boolean(data.forceSubActive);
        }
        renderChannelsList(data.channels || []);
      }
    } catch (e) {
      channelsListContainer.innerHTML = '<div style="color:var(--danger); font-size:13px;">Yuklashda xatolik yuz berdi.</div>';
    }
  }

  function renderChannelsList(channels) {
    if (!channelsListContainer) return;
    if (!channels || channels.length === 0) {
      channelsListContainer.innerHTML = '<div style="opacity:0.6; font-size:13px;">Ulangan majburiy kanal yo\'q.</div>';
      return;
    }

    channelsListContainer.innerHTML = '';
    channels.forEach(ch => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);';
      
      const titleSpan = document.createElement('span');
      titleSpan.style.cssText = 'font-weight:600; font-size:14px; color:var(--text-main);';
      titleSpan.textContent = ch;

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-remove-channel-action';
      delBtn.style.cssText = 'background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:6px 12px; border-radius:8px; font-weight:600; font-size:12px; cursor:pointer;';
      delBtn.innerHTML = '<i class="fa-solid fa-trash"></i> O\'chirish';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`${ch} kanalini o'chirmoqchimisiz?`)) {
          await deleteChannel(ch);
        }
      });

      row.appendChild(titleSpan);
      row.appendChild(delBtn);
      channelsListContainer.appendChild(row);
    });
  }

  function getActiveAdminId() {
    return getTelegramUserId() || (isUserAdmin ? SUPER_ADMIN_ID : '');
  }

  async function addChannel() {
    const val = newChannelInput?.value.trim();
    if (!val) {
      showToast('⚠️ Kanal nomini kiriting!');
      return;
    }
    const formattedCh = val.startsWith('@') || val.startsWith('http') ? val : `@${val}`;
    const adminId = getActiveAdminId();

    try {
      const res = await fetch(`${API_HOST}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(adminId)
        },
        body: JSON.stringify({ channel: formattedCh, admin_user_id: adminId })
      });
      const data = await res.json();
      if (data.ok || data.success) {
        showToast('✅ Kanal saqlandi!');
        if (newChannelInput) newChannelInput.value = '';
        renderChannelsList(data.channels || []);
      } else {
        showToast(`❌ ${data.error || 'Xatolik'}`);
      }
    } catch (e) {
      showToast('❌ Ulana olmadi');
    }
  }

  async function deleteChannel(chName) {
    const adminId = getActiveAdminId();
    try {
      const res = await fetch(`${API_HOST}/api/channels/${encodeURIComponent(chName)}`, {
        method: 'DELETE',
        headers: {
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(adminId)
        }
      });
      const data = await res.json();
      if (data.ok || data.success) {
        showToast('🗑 Kanal o\'chirildi');
        renderChannelsList(data.channels || []);
      } else {
        showToast('❌ O\'chirishda xatolik');
      }
    } catch (e) {
      showToast('❌ Xatolik');
    }
  }

  channelsForceSubToggle?.addEventListener('change', async (e) => {
    const adminId = getActiveAdminId();
    try {
      const res = await fetch(`${API_HOST}/api/channels/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(adminId)
        },
        body: JSON.stringify({ enabled: e.target.checked, admin_user_id: adminId })
      });
      const data = await res.json();
      if (data.ok || data.success) {
        showToast(e.target.checked ? '🔒 Majburiy obuna YOQILDI' : '🔓 Majburiy obuna O\'CHIRILDI');
      }
    } catch (err) {
      showToast('❌ Holatni saqlashda xatolik');
    }
  });

  btnAddChannel?.addEventListener('click', addChannel);
  modalChannelsClose?.addEventListener('click', () => modalManageChannels?.classList.add('hidden'));
  btnCloseChannelsModal?.addEventListener('click', () => modalManageChannels?.classList.add('hidden'));

  // Banner Management Logic
  async function openManageBannersModal() {
    modalManageBanners?.classList.remove('hidden');
    try {
      const res = await fetch(`${API_HOST}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        const banners = data.banners || [];
        for (let slot = 1; slot <= 3; slot++) {
          const b = banners.find(item => item.slot === slot) || {};
          const imgInput = document.getElementById(`banner-img-${slot}`);
          const linkInput = document.getElementById(`banner-link-${slot}`);
          if (imgInput) imgInput.value = b.imageUrl || '';
          if (linkInput) linkInput.value = b.linkUrl || '';
        }
      }
    } catch (e) {
      showToast('⚠️ Bannerlarni yuklashda xatolik');
    }
  }

  document.querySelectorAll('.btn-save-banner-slot').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const slot = e.currentTarget.getAttribute('data-slot');
      const imgInput = document.getElementById(`banner-img-${slot}`);
      const linkInput = document.getElementById(`banner-link-${slot}`);

      const imageUrl = imgInput?.value.trim() || '';
      const linkUrl = linkInput?.value.trim() || '';

      const adminId = getActiveAdminId();
      try {
        const res = await fetch(`${API_HOST}/api/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-telegram-init-data': tg?.initData || '',
            'x-user-id': String(adminId)
          },
          body: JSON.stringify({ slot: Number(slot), imageUrl, linkUrl, admin_user_id: adminId })
        });
        const data = await res.json();
        if (data.ok || data.success) {
          showToast(`✅ Banner ${slot} saqlandi!`);
          fetchBannersAndRenderCarousel();
        } else {
          showToast(`❌ Xatolik: ${data.error || 'Saqlanmadi'}`);
        }
      } catch (err) {
        showToast('❌ Xatolik yuz berdi');
      }
    });
  });

  modalBannersClose?.addEventListener('click', () => modalManageBanners?.classList.add('hidden'));
  btnCloseBannersModal?.addEventListener('click', () => modalManageBanners?.classList.add('hidden'));

  // ==========================================
  // Canva Pro State & Management Logic
  // ==========================================
  let canvaProData = {
    isEnabled: true,
    hasLink: false,
    expiryDate: '',
    claimsCount: 0,
    link: ''
  };

  async function fetchCanvaProData() {
    try {
      const userId = getTelegramUserId();
      const adminId = getActiveAdminId();
      const isAdm = isUserAdmin || (adminId && (adminId === SUPER_ADMIN_ID || adminList.includes(Number(adminId))));

      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('user_id', String(userId));
      if (isAdm) queryParams.set('admin_user_id', String(adminId));

      const res = await fetch(`${API_HOST}/api/canva-pro?${queryParams.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        canvaProData = {
          isEnabled: data.isEnabled !== false,
          hasLink: Boolean(data.hasLink),
          expiryDate: data.expiryDate || '',
          claimsCount: data.claimsCount || 0,
          link: data.link || ''
        };
        updateCanvaProUI();
      }
    } catch (e) {
      console.warn('Canva Pro fetch error:', e);
    }
  }

  function updateCanvaProUI() {
    if (!canvaProPromoCard) return;

    // Expiry Date Pill
    const expiry = (canvaProData.expiryDate || '').trim();
    if (proCardExpiryText) {
      proCardExpiryText.textContent = expiry ? `Muddati: ${expiry}` : 'Doimiy';
    }

    // Status Badge & Button styling
    if (proCardStatusBadge && proCardStatusText) {
      if (!canvaProData.isEnabled) {
        proCardStatusBadge.className = 'pro-status-badge status-closed';
        proCardStatusText.textContent = 'Yopiq';
      } else if (!canvaProData.hasLink) {
        proCardStatusBadge.className = 'pro-status-badge status-full';
        proCardStatusText.textContent = "Joylar to'lgan";
      } else {
        proCardStatusBadge.className = 'pro-status-badge status-active';
        proCardStatusText.textContent = 'Faol';
      }
    }

    if (btnCanvaProClaim) {
      if (!canvaProData.isEnabled) {
        btnCanvaProClaim.disabled = true;
        btnCanvaProClaim.classList.add('disabled');
        btnCanvaProClaim.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Hozirda yopiq</span>';
      } else if (!canvaProData.hasLink) {
        btnCanvaProClaim.disabled = true;
        btnCanvaProClaim.classList.add('disabled');
        btnCanvaProClaim.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> <span>Joylar to\'lgan</span>';
      } else {
        btnCanvaProClaim.disabled = false;
        btnCanvaProClaim.classList.remove('disabled');
        btnCanvaProClaim.innerHTML = '<i class="fa-solid fa-crown"></i> <span>Canva Pro-ga Qo\'shilish</span> <i class="fa-solid fa-arrow-up-right-from-square pro-arrow-icon"></i>';
      }
    }
  }

  async function claimCanvaPro() {
    triggerHaptic('medium');
    if (!canvaProData.isEnabled) {
      showToast('⚠️ Hozirda Canva Pro qabuli yopiq');
      return;
    }
    if (!canvaProData.hasLink) {
      showToast('⚠️ Hozirda jamoada bo\'sh joylar qolmagan');
      return;
    }

    const userId = getTelegramUserId();
    if (!userId) {
      showToast('⚠️ Iltimos, Telegram boti orqali kiring!');
      showSubscriptionGateOverlay(['@hammagayetadi'], true);
      return;
    }

    if (btnCanvaProClaim) {
      btnCanvaProClaim.disabled = true;
      btnCanvaProClaim.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Tekshirilmoqda...</span>';
    }

    try {
      const res = await fetch(`${API_HOST}/api/canva-pro/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(userId)
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await res.json();

      if (data.isSubscribed === false) {
        triggerHaptic('warning');
        showToast('⚠️ Avval homiy kanalimizga a\'zo bo\'ling!');
        showSubscriptionGateOverlay(data.missing || []);
        updateCanvaProUI();
        return;
      }

      if (data.ok || data.success) {
        triggerHaptic('success');
        showToast('🎉 Canva Pro jamoasiga havola ochilmoqda...');
        const inviteLink = data.link;
        if (inviteLink) {
          if (tg && typeof tg.openLink === 'function') {
            tg.openLink(inviteLink);
          } else {
            window.open(inviteLink, '_blank');
          }
        }
        await fetchCanvaProData();
      } else {
        triggerHaptic('error');
        showToast(`❌ ${data.error || 'Xatolik yuz berdi'}`);
        updateCanvaProUI();
      }
    } catch (err) {
      triggerHaptic('error');
      showToast('❌ Serverga ulanishda xatolik');
      updateCanvaProUI();
    }
  }

  btnCanvaProClaim?.addEventListener('click', claimCanvaPro);

  // Admin Canva Pro Modal Management
  async function openManageCanvaProModal() {
    modalManageCanvaPro?.classList.remove('hidden');
    const adminId = getActiveAdminId();

    try {
      const res = await fetch(`${API_HOST}/api/canva-pro?admin_user_id=${adminId}`, {
        headers: {
          'x-user-id': String(adminId),
          'x-telegram-init-data': tg?.initData || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (canvaProActiveToggle) canvaProActiveToggle.checked = data.isEnabled !== false;
        if (canvaProLinkInput) canvaProLinkInput.value = data.link || '';
        if (canvaProExpiryInput) canvaProExpiryInput.value = data.expiryDate || '';
        if (canvaProClaimsStat) canvaProClaimsStat.textContent = `${data.claimsCount || 0} ta`;
      }
    } catch (e) {
      showToast('⚠️ Ma\'lumotlarni yuklashda xatolik');
    }
  }

  modalCanvaProClose?.addEventListener('click', () => modalManageCanvaPro?.classList.add('hidden'));
  btnCloseCanvaProModal?.addEventListener('click', () => modalManageCanvaPro?.classList.add('hidden'));

  btnSaveCanvaPro?.addEventListener('click', async () => {
    const adminId = getActiveAdminId();
    const link = canvaProLinkInput?.value.trim() || '';
    const expiryDate = canvaProExpiryInput?.value.trim() || '';
    const isEnabled = canvaProActiveToggle ? canvaProActiveToggle.checked : true;

    try {
      const res = await fetch(`${API_HOST}/api/settings/canva-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(adminId)
        },
        body: JSON.stringify({
          link,
          expiryDate,
          isEnabled,
          admin_user_id: adminId
        })
      });

      const data = await res.json();
      if (data.ok || data.success) {
        showToast('✅ Canva Pro sozlamalari saqlandi!');
        modalManageCanvaPro?.classList.add('hidden');
        await fetchCanvaProData();
      } else {
        showToast(`❌ ${data.error || 'Saqlanmadi'}`);
      }
    } catch (err) {
      showToast('❌ Xatolik yuz berdi');
    }
  });

  btnResetCanvaProClaims?.addEventListener('click', async () => {
    if (!confirm('Haqiqatan ham havola olganlar hisoblagichini 0 qilmoqchimisiz?')) return;
    const adminId = getActiveAdminId();

    try {
      const res = await fetch(`${API_HOST}/api/settings/canva-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': tg?.initData || '',
          'x-user-id': String(adminId)
        },
        body: JSON.stringify({
          resetClaims: true,
          admin_user_id: adminId
        })
      });

      const data = await res.json();
      if (data.ok || data.success) {
        if (canvaProClaimsStat) canvaProClaimsStat.textContent = '0 ta';
        showToast('🔄 Hisoblagich 0 qilindi');
        await fetchCanvaProData();
      }
    } catch (err) {
      showToast('❌ Xatolik yuz berdi');
    }
  });

  // Admin Form Events
  btnSaveElement?.addEventListener('click', saveElementForm);
  btnCancelElement?.addEventListener('click', () => modalElementForm?.classList.add('hidden'));
  modalElementClose?.addEventListener('click', () => modalElementForm?.classList.add('hidden'));

  // Admin Management Modal Events
  btnCloseAdminsModal?.addEventListener('click', () => modalManageAdmins?.classList.add('hidden'));
  modalAdminsClose?.addEventListener('click', () => modalManageAdmins?.classList.add('hidden'));

  // Admin Filter Inputs
  adminSearchInput?.addEventListener('input', renderAdminElements);

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

  // Backup Modal Close Buttons
  document.getElementById('modal-backup-close')?.addEventListener('click', () => {
    document.getElementById('modal-backup-download')?.classList.add('hidden');
  });

  // Extract Telegram User ID from multiple SDK/URL sources
  function getTelegramUserId() {
    try {
      if (tg?.initDataUnsafe?.user?.id) return tg.initDataUnsafe.user.id;
      if (tg?.initData) {
        const uStr = new URLSearchParams(tg.initData).get('user');
        if (uStr) {
          const parsed = JSON.parse(uStr);
          if (parsed && parsed.id) return parsed.id;
        }
      }
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    const uParam = urlParams.get('user_id');
    if (uParam) return Number(uParam);

    return null;
  }

  // Check mandatory subscription gate on Mini App startup
  async function checkUserSubscriptionOnStartup() {
    const userId = getTelegramUserId();

    // Admins always bypass lock immediately
    const uId = userId ? Number(userId) : null;
    const isLocalAdmin = isUserAdmin || (uId && (uId === SUPER_ADMIN_ID || adminList.includes(uId) || adminList.includes(String(uId))));
    if (isLocalAdmin) {
      revealMainAppContent();
      return;
    }

    try {
      const checkUrl = userId 
        ? `${API_HOST}/api/check-sub?user_id=${userId}`
        : `${API_HOST}/api/check-sub`;

      const res = await fetch(checkUrl, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();

      if (data.forceSubActive && (data.isSubscribed === false || !userId)) {
        hideMainAppContent();
        showSubscriptionGateOverlay(data.missing || [], !userId);
      } else {
        revealMainAppContent();
      }
    } catch (e) {
      console.warn('Sub check error:', e);
    }
  }

  function hideMainAppContent() {
    const mainContent = document.getElementById('main-content');
    const searchSection = document.getElementById('sticky-search-section');
    const bottomNav = document.getElementById('bottom-nav-bar') || document.getElementById('bottom-nav');
    const appHeader = document.getElementById('app-header');
    if (mainContent) mainContent.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (appHeader) appHeader.style.display = 'none';
  }

  function revealMainAppContent() {
    const mainContent = document.getElementById('main-content');
    const searchSection = document.getElementById('sticky-search-section');
    const bottomNav = document.getElementById('bottom-nav-bar') || document.getElementById('bottom-nav');
    const appHeader = document.getElementById('app-header');
    if (mainContent) mainContent.style.display = 'block';
    if (searchSection) searchSection.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
    if (appHeader) appHeader.style.display = 'block';
  }

  function showSubscriptionGateOverlay(missingChannels, isNoUser = false) {
    const overlay = document.getElementById('sub-gate-overlay');
    const card = document.getElementById('sub-gate-card');
    const desc = document.getElementById('sub-gate-desc');
    const channelsContainer = document.getElementById('sub-gate-channels-list');
    const checkBtn = document.getElementById('btn-recheck-sub-overlay');

    if (!overlay) return;

    // 5-click secret unlock on lock screen icon for admins
    const gateLockIcon = overlay.querySelector('.sub-gate-icon');
    if (gateLockIcon && !gateLockIcon.dataset.hasListener) {
      gateLockIcon.dataset.hasListener = 'true';
      let gateClickCounter = 0;
      let gateClickTimer = null;
      gateLockIcon.addEventListener('click', () => {
        gateClickCounter++;
        if (gateClickTimer) clearTimeout(gateClickTimer);
        if (gateClickCounter >= 5) {
          gateClickCounter = 0;
          openAdminLoginModal();
        } else {
          gateClickTimer = setTimeout(() => { gateClickCounter = 0; }, 1500);
        }
      });
    }

    if (isNoUser) {
      if (desc) desc.textContent = "Ushbu Mini App faqat rasmiy Telegram boti orqali to'liq ishlaydi. Iltimos, bot orqali oching:";
      if (channelsContainer) {
        channelsContainer.innerHTML = `
          <a href="https://t.me/hammagayetadibot" class="sub-gate-channel-btn" style="background: var(--brand-gradient);">
            <i class="fa-brands fa-telegram"></i> Telegram boti orqali ochish
          </a>
        `;
      }
      if (checkBtn) checkBtn.style.display = 'none';
      overlay.classList.remove('hidden');
      return;
    }

    if (desc) {
      desc.textContent = "Canva element kodlaridan to'liq va bepul foydalanish uchun rasmiy kanalimizga a'zo bo'ling:";
    }

    const chList = Array.isArray(missingChannels) && missingChannels.length > 0 
      ? missingChannels 
      : ['@hammagayetadi'];

    if (channelsContainer) {
      channelsContainer.innerHTML = chList.map((ch, idx) => {
        const cleanName = String(ch).replace('@', '');
        const url = String(ch).startsWith('-100') ? 'https://t.me' : `https://t.me/${cleanName}`;
        return `
          <a href="${url}" class="sub-gate-channel-btn" data-channel="${ch}">
            <i class="fa-brands fa-telegram"></i> ${idx + 1}-kanalga a'zo bo'lish
          </a>
        `;
      }).join('');

      // Add click handler to open inside Telegram via tg.openTelegramLink
      channelsContainer.querySelectorAll('.sub-gate-channel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const href = btn.getAttribute('href');
          if (tg && typeof tg.openTelegramLink === 'function') {
            e.preventDefault();
            tg.openTelegramLink(href);
          }
        });
      });
    }

    if (checkBtn) {
      checkBtn.style.display = 'flex';
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Obunani tekshirish</span>';
    }

    overlay.classList.remove('hidden');
    overlay.classList.remove('fade-out');

    // Attach click listener
    checkBtn?.replaceWith(checkBtn.cloneNode(true));
    const newCheckBtn = document.getElementById('btn-recheck-sub-overlay');

    newCheckBtn?.addEventListener('click', async () => {
      newCheckBtn.disabled = true;
      newCheckBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Tekshirilmoqda...</span>';
      triggerHaptic('light');

      const userId = getTelegramUserId();
      if (!userId) {
        showToast("⚠️ Telegram boti orqali kiring!");
        newCheckBtn.disabled = false;
        newCheckBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Obunani tekshirish</span>';
        return;
      }

      try {
        const checkUrl = `${API_HOST}/api/check-sub?user_id=${userId}`;
        const res = await fetch(checkUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.isSubscribed) {
            triggerHaptic('success');
            showToast("✅ Obuna tasdiqlandi! Xush kelibsiz!");
            overlay.classList.add('fade-out');
            setTimeout(() => {
              overlay.classList.add('hidden');
              overlay.classList.remove('fade-out');
              revealMainAppContent();
            }, 250);
          } else {
            triggerHaptic('error');
            if (card) {
              card.classList.remove('shake-anim');
              void card.offsetWidth;
              card.classList.add('shake-anim');
            }
            showToast("❌ Siz hali kanalga a'zo bo'lmadingiz!");
            newCheckBtn.disabled = false;
            newCheckBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Qayta tekshirish</span>';
          }
        } else {
          newCheckBtn.disabled = false;
          newCheckBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Qayta tekshirish</span>';
        }
      } catch (err) {
        newCheckBtn.disabled = false;
        newCheckBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Qayta tekshirish</span>';
      }
    });
  }

  // Initial Safe Execution (Run admin check first so admins are never gated)
  try { checkAdminPermissions(); } catch (e) { console.error('Admin check error:', e); }
  try { checkUserSubscriptionOnStartup(); } catch (e) { console.error('Sub check startup error:', e); }
  try { updateStats(); } catch (e) { console.error('Stats error:', e); }
  try { renderElements(); } catch (e) { console.error('Render elements error:', e); }
  try { renderCategoriesGrid(); } catch (e) { console.error('Categories error:', e); }
  try { fetchSupabaseElements(); } catch (e) { console.error('Supabase fetch error:', e); }
  try { fetchBannersAndRenderCarousel(); } catch (e) { console.error('Banners fetch error:', e); }
  try { fetchCanvaProData(); } catch (e) { console.error('Canva Pro fetch error:', e); }
});

