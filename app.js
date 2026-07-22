/* -------------------------------------------------------------
 * Canva Element Kodlari — Apple VisionOS / iOS 18 Main JS (v4.0)
 * Zuhra Olimova & Yaxshi Bola
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  // Telegram WebApp Initialization
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#FFF9FC');
      tg.setBackgroundColor('#FFF9FC');
    } catch (e) {}
  }

  // Core App State
  let allElements = Array.isArray(window.CANVA_DATA) ? window.CANVA_DATA : [];
  let favorites = JSON.parse(localStorage.getItem('zo_canva_favs') || '[]');
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentTag = '';
  let activeTab = 'home';
  let isUserAdmin = false;

  const SUPER_ADMIN_ID = 8544023815;
  const ZUHRA_ADMIN_ID = 8112688757;
  let adminList = JSON.parse(localStorage.getItem('zo_canva_admins') || `[${SUPER_ADMIN_ID}, ${ZUHRA_ADMIN_ID}]`);

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
  const adminBtnSettings = document.getElementById('admin-btn-settings');
  const adminLockBtn = document.getElementById('admin-lock-btn');

  const adminSearchInput = document.getElementById('admin-search-input');
  const adminFilterCatTrigger = document.getElementById('admin-filter-cat-trigger');
  const adminFilterCatLabel = document.getElementById('admin-filter-cat-label');

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

  // Toast Notification
  function showToast(msg, codeStr = '') {
    const toastTitle = document.getElementById('toast-title');
    const toastCode = document.getElementById('toast-code');
    
    if (toastTitle) toastTitle.textContent = msg;
    if (toastCode) {
      if (codeStr) {
        toastCode.textContent = codeStr;
        toastCode.style.display = 'inline';
      } else {
        toastCode.style.display = 'none';
      }
    }

    toast?.classList.remove('hidden');
    triggerHaptic('success');
    
    setTimeout(() => {
      toast?.classList.add('hidden');
    }, 2400);
  }

  // Copy to Clipboard Helper
  function copyToClipboard(text, customToastMsg = 'Nusxalandi!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(customToastMsg, text);
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
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(customToastMsg, text);
    } catch (err) {
      showToast('❌ Nusxalab bo\'lmadi');
    }
    document.body.removeChild(textArea);
  }

  // Share Element Helper
  function shareElement(code, description) {
    const shareText = `🎨 Canva Element Kodi: ${code}\n📌 Tavsif: ${description}\n\n✨ Top-canva bot orqali izlang!`;
    if (navigator.share) {
      navigator.share({
        title: 'Canva Element Kodi',
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      copyToClipboard(shareText, '🔗 Ulasish matni nusxalandi!');
    }
  }

  // Admin Verification Logic
  function checkAdminPermissions() {
    const currentUserId = tg?.initDataUnsafe?.user?.id;
    const currentUsername = tg?.initDataUnsafe?.user?.username?.toLowerCase();

    let adminUnlocked = false;
    try {
      adminUnlocked = localStorage.getItem('zo_admin_unlocked') === 'true';
    } catch(e) {}

    if (currentUserId && (Number(currentUserId) === SUPER_ADMIN_ID || Number(currentUserId) === ZUHRA_ADMIN_ID || adminList.includes(Number(currentUserId)))) {
      isUserAdmin = true;
    } else if (currentUsername && (currentUsername === 'yaxshibola' || currentUsername === 'zuhra_olimova')) {
      isUserAdmin = true;
    } else if (adminUnlocked) {
      isUserAdmin = true;
    } else {
      isUserAdmin = false;
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
    if (passcode === '777' || passcode === '2026' || passcode === 'zuhra') {
      isUserAdmin = true;
      try { localStorage.setItem('zo_admin_unlocked', 'true'); } catch(e) {}
      modalAdminLogin?.classList.add('hidden');
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
    try { localStorage.setItem('zo_admin_unlocked', 'false'); } catch(e) {}
    switchTab('home');
    showToast('🔒 Admin rejimidan chiqildi');
  });

  // Data Fetching from Supabase Backend API
  async function fetchSupabaseElements() {
    try {
      const API_BASE = window.location.origin.includes('vercel.app') 
        ? 'https://canva-element-bot.onrender.com/api/elements' 
        : '/api/elements';

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
      localStorage.setItem('zo_canva_favs', JSON.stringify(favorites));
    } catch (e) {}

    renderElements();
    renderFavoritesElements();
  }

  // Render Single Card HTML (VisionOS 2-Column Grid Card)
  function renderCardHTML(item) {
    if (!item) return '';
    const isFav = favorites.includes(item.id) || favorites.includes(String(item.id));
    const isNew = item.isNew || item.id <= 30;

    return `
      <div class="element-card" data-id="${item.id}">
        <div class="card-header-row">
          <span class="category-tag-badge">${item.category || 'Bo\'lim'}</span>
          <button class="fav-star-btn ${isFav ? 'active' : ''} fav-btn" data-id="${item.id}" aria-label="Saqlash">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="element-card-title">${item.description || 'Element kodi'}</div>

        <div class="code-block-container code-box" data-code="${item.code}">
          <span class="code-text">${item.code}</span>
          <i class="fa-regular fa-copy code-copy-icon"></i>
        </div>

        <div class="card-bottom-row">
          <button class="btn-copy-action btn-copy" data-code="${item.code}">
            <i class="fa-regular fa-copy"></i> Nusxalash
          </button>
          <button class="btn-share-icon btn-share" data-code="${item.code}" data-desc="${item.description}">
            <i class="fa-solid fa-arrow-turn-up"></i>
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
      const newsItems = allElements.filter(item => item && (item.isNew || item.id <= 50));
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

    if (pickerTarget === 'admin') {
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
    }

    document.getElementById('modal-category-picker')?.classList.add('hidden');
    triggerHaptic('light');
  });

  /* -------------------------------------------------------------
   * Admin Panel Functions
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

    const API_BASE = window.location.origin.includes('vercel.app') 
      ? 'https://canva-element-bot.onrender.com/api/elements' 
      : '/api/elements';

    const initData = tg?.initData || '';
    const tgUser = tg?.initDataUnsafe?.user;
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      'x-user-id': String(tgUser?.id || '')
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

    const API_BASE = window.location.origin.includes('vercel.app') 
      ? 'https://canva-element-bot.onrender.com/api/elements' 
      : '/api/elements';

    const initData = tg?.initData || '';
    const tgUser = tg?.initDataUnsafe?.user;
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      'x-user-id': String(tgUser?.id || '')
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

  function renderAdminsList() {
    if (!adminsListContainer) return;
    const ADMIN_NAMES = {
      8544023815: "Yaxshi Bola 🩵",
      "8544023815": "Yaxshi Bola 🩵",
      8112688757: "Zuhra 🩷",
      "8112688757": "Zuhra 🩷"
    };

    adminList = [SUPER_ADMIN_ID, ZUHRA_ADMIN_ID];

    adminsListContainer.innerHTML = adminList.map(admin => {
      const numAdmin = Number(admin);
      const isSuper = numAdmin === SUPER_ADMIN_ID;
      const displayName = ADMIN_NAMES[numAdmin] || (isSuper ? "Yaxshi Bola 🩵" : "Zuhra 🩷");

      return `
        <div class="admin-user-row" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.95); margin-bottom:10px; border-radius:14px; border:1px solid ${isSuper ? 'rgba(14,165,233,0.3)' : 'rgba(236,72,153,0.3)'};">
          <div class="admin-user-info" style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid ${isSuper ? 'fa-crown' : 'fa-user-shield'}" style="color: ${isSuper ? '#0ea5e9' : '#ec4899'}; font-size: 18px;"></i>
            <div>
              <strong style="color:#1e293b; font-size:15px; display:block;">${displayName}</strong>
              <small style="opacity:0.75; font-size:12px; color:#64748b;">ID: ${admin}</small>
            </div>
          </div>
          <span style="font-size:11px; color:${isSuper ? '#0ea5e9' : '#ec4899'}; font-weight:700; background:${isSuper ? 'rgba(14,165,233,0.12)' : 'rgba(236,72,153,0.12)'}; padding:4px 12px; border-radius:20px;">
            ${isSuper ? 'ASOSIY ADMIN' : 'ADMIN'}
          </span>
        </div>
      `;
    }).join('');
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
  function openAdminSettingsModal() {
    const modalSettings = document.getElementById('modal-admin-settings');
    const channelInput = document.getElementById('settings-channel-input');
    const forceSubToggle = document.getElementById('settings-force-sub-toggle');

    let savedSettings = { channel: '@zuhracanva_official', forceSub: true };
    try {
      const stored = localStorage.getItem('zo_canva_settings');
      if (stored) savedSettings = JSON.parse(stored);
    } catch(e) {}

    if (channelInput) channelInput.value = savedSettings.channel || '@zuhracanva_official';
    if (forceSubToggle) forceSubToggle.checked = !!savedSettings.forceSub;

    modalSettings?.classList.remove('hidden');
  }

  async function saveAdminSettings() {
    const channelInput = document.getElementById('settings-channel-input');
    const forceSubToggle = document.getElementById('settings-force-sub-toggle');

    const channelVal = channelInput ? channelInput.value.trim() : '@zuhracanva_official';
    const isEnabled = forceSubToggle ? forceSubToggle.checked : true;

    const settingsObj = { channel: channelVal, forceSub: isEnabled };
    try {
      localStorage.setItem('zo_canva_settings', JSON.stringify(settingsObj));
    } catch(e) {}

    const API_BASE = window.location.origin.includes('vercel.app') 
      ? 'https://canva-element-bot.onrender.com/api' 
      : '/api';

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

  // Auto-sliding Featured Banner Carousel Logic
  let currentSlideIndex = 0;
  const carouselTrack = document.getElementById('carousel-track');
  const carouselDots = document.querySelectorAll('#carousel-dots .dot');

  function goToSlide(index) {
    if (!carouselTrack) return;
    currentSlideIndex = index;
    carouselTrack.style.transform = `translateX(-${currentSlideIndex * 33.333}%)`;
    carouselDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlideIndex);
    });
  }

  let carouselTimer = setInterval(() => {
    currentSlideIndex = (currentSlideIndex + 1) % 3;
    goToSlide(currentSlideIndex);
  }, 4000);

  carouselDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const slideIdx = parseInt(e.target.getAttribute('data-slide') || '0', 10);
      goToSlide(slideIdx);
      clearInterval(carouselTimer);
      carouselTimer = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % 3;
        goToSlide(currentSlideIndex);
      }, 4000);
    });
  });

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
  
  // Settings & Backup Modals Click Handlers
  document.getElementById('admin-btn-settings')?.addEventListener('click', openAdminSettingsModal);
  document.getElementById('btn-cancel-settings')?.addEventListener('click', () => document.getElementById('modal-admin-settings')?.classList.add('hidden'));
  document.getElementById('modal-settings-close')?.addEventListener('click', () => document.getElementById('modal-admin-settings')?.classList.add('hidden'));
  document.getElementById('btn-save-settings')?.addEventListener('click', saveAdminSettings);

  // Global Event Delegation for Cards & Admin Actions
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy');
    const shareBtn = e.target.closest('.btn-share');
    const codeBox = e.target.closest('.code-box');
    const favBtn = e.target.closest('.fav-btn');
    const catCard = e.target.closest('.category-card');

    const adminEditBtn = e.target.closest('.btn-admin-edit');
    const adminDeleteBtn = e.target.closest('.btn-admin-delete');

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
    showToast('🔄 Ma\'lumotlar yangilandi');
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

  // Initial Safe Execution
  try { checkAdminPermissions(); } catch (e) { console.error('Admin check error:', e); }
  try { updateStats(); } catch (e) { console.error('Stats error:', e); }
  try { renderElements(); } catch (e) { console.error('Render elements error:', e); }
  try { renderCategoriesGrid(); } catch (e) { console.error('Categories error:', e); }
  try { fetchSupabaseElements(); } catch (e) { console.error('Supabase fetch error:', e); }
});
