/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Mini App — Supabase REST Logic
 * Supabase URL: https://mjenunxgakcvyzcikjmi.supabase.co
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

  // Supabase REST Config (Publishable Public Key)
  const SUPABASE_URL = 'https://mjenunxgakcvyzcikjmi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_nSt8XQyZetNEC7ROiU3XeA_iPBDMPRn';

  // Data State
  let allElements = window.CANVA_DATA || [];
  let favorites = JSON.parse(localStorage.getItem('zo_canva_favs') || '[]');
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentTag = '';
  let activeTab = 'home';

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const elementsGrid = document.getElementById('elements-grid');
  const newsElementsGrid = document.getElementById('news-elements-grid');
  const favoritesElementsGrid = document.getElementById('favorites-elements-grid');
  const categoriesGrid = document.getElementById('categories-grid');
  const emptyState = document.getElementById('empty-state');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const currentCategoryTitle = document.getElementById('current-category-title');
  const resultsCountLabel = document.getElementById('results-count');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const statTotal = document.getElementById('stat-total');
  const statCategories = document.getElementById('stat-categories');
  const statFavs = document.getElementById('stat-favs');
  const favCountTag = document.getElementById('fav-count-tag');
  const favCountTop = document.getElementById('fav-count-top');
  const favStatBtn = document.getElementById('fav-stat-btn');
  const toast = document.getElementById('toast');
  const toastCode = document.getElementById('toast-code');
  const toastTitle = document.getElementById('toast-title');

  // Uzbek Synonyms Map
  const SYNONYMS = {
    'shifokor': ['doktor', 'tibbiyot', 'medik', 'shifoxona', 'vrach', 'boshqaruv', 'gigiyena', 'stomatolog', 'suyak'],
    'doktor': ['shifokor', 'tibbiyot', 'medik', 'shifoxona', 'vrach', 'stomatolog'],
    'kitob': ['maktab', 'ta\'lim', 'bilim', 'oqish', 'kutubxona', 'dars', 'daftar'],
    'maktab': ['kitob', 'dars', 'o\'qituvchi', 'talaba', 'bilim', 'alifbo', 'metrika'],
    'quruvchi': ['bino', 'stroyka', 'remont', 'ustalar', 'qurilish', 'muhandis', 'usta'],
    'meva': ['sabzavot', 'oziq-ovqat', 'taom', 'shirinlik', 'pirog', 'fast food', 'muzqaymoq'],
    'shirinlik': ['pishiriq', 'tort', 'pirog', 'shokolad', 'keks', 'muzqaymoq', 'qandolat', 'shkalat'],
    'ramazon': ['hayit', 'roza', 'iftor', 'masjid', 'islom', 'umra', 'haj', 'qurbon'],
    'harf': ['alifbo', 'matn', 'yozuv', 'shrift', 'raqam', 'harflar'],
    'raqam': ['sonlar', 'hisob', 'sanoq', '2026', 'kalendar', 'raqamlar'],
    'bolalar': ['chaqaloq', 'o\'yinchoq', 'metrika', 'baby', 'bolalar uchun', 'qiz bola'],
    'pushti': ['pink', 'estetik', 'binafsha', 'sevgi', 'bantik'],
    'sevgi': ['muhabbat', 'yurak', 'love', 'heart', 'romantika'],
    'smm': ['target', 'instagram', 'reklama', 'biznes', 'marketing', 'infografika'],
    'kosmos': ['fazo', 'yulduz', 'sayyora', 'raketa', 'kosmik'],
    'kuz': ['barg', 'xazon', 'oktyabr', 'qahva', 'kuzgi'],
    'gullar': ['bog\'', 'o\'simlik', 'lola', 'roza', 'yaproq'],
    'sport': ['fitnes', 'zall', 'yugurish', 'sog\'lik', 'musobaqa'],
    'telefon': ['kompyuter', 'gadjet', 'noutbuk', 'it', 'dasturchi', 'texnologiya']
  };

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

  // Categories Map
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
    if (favCountTag) favCountTag.textContent = favorites.length;
    if (favCountTop) favCountTop.textContent = favorites.length;
  }

  // Filter & Rank Elements
  function getFilteredElements() {
    const results = [];

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

  // Generate Card HTML
  function renderCardHTML(item) {
    const isFav = favorites.includes(item.id);
    const favClass = isFav ? 'active fa-solid' : 'fa-regular';
    const newBadgeHTML = item.isNew ? `<span class="new-badge">YANGI ✨</span>` : '';
    const descHTML = highlightMatches(item.description, currentSearchQuery);

    return `
      <div class="element-card" data-id="${item.id}">
        <div class="card-header">
          <span class="category-tag"><i class="fa-solid fa-folder-open"></i> ${item.category} ${newBadgeHTML}</span>
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
          <button class="btn-canva" data-code="${item.code}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Canva'da
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

    if (resultsCountLabel) resultsCountLabel.textContent = `${filtered.length} ta element`;

    if (filtered.length === 0) {
      elementsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    elementsGrid.innerHTML = filtered.map(renderCardHTML).join('');
  }

  // Render Categories View Grid
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

  // Switch Tabs (Both Top Tabs and Bottom Navbar)
  function switchTab(tabName) {
    activeTab = tabName;

    // Update Bottom Navbar Active
    document.querySelectorAll('.bottom-navbar .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update Top Tabs Active
    document.querySelectorAll('.top-nav-tabs .top-nav-btn').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update Views Visibility
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
  }

  // Bottom Navbar & Top Nav Tabs Click Listeners
  document.querySelectorAll('.bottom-navbar .nav-item, .top-nav-tabs .top-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Global Event Delegation for Elements Grid
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy');
    const codeBox = e.target.closest('.code-box');
    const canvaBtn = e.target.closest('.btn-canva');
    const favBtn = e.target.closest('.fav-btn');
    const catCard = e.target.closest('.category-card');

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
    }
  });

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

  // Copy All Codes
  copyAllBtn.addEventListener('click', () => {
    const filtered = getFilteredElements();
    if (filtered.length === 0) return;

    const allCodes = filtered.map(item => `${item.description}: ${item.code}`).join('\n');
    copyToClipboard(allCodes, `${filtered.length} ta element kodi nusxalandi!`);
  });

  // Fav Stat Click
  favStatBtn.addEventListener('click', () => {
    switchTab('favorites');
  });

  // Initial Load & Supabase Sync
  updateStats();
  renderElements();
  renderCategoriesGrid();
  fetchSupabaseElements();
});
