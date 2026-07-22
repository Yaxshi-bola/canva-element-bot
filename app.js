/* -------------------------------------------------------------
 * Canva Element Kodlari Telegram Mini App — Smart Search & Deep Link Engine
 * Author: Zuhra Olimova
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Telegram WebApp SDK
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#fff5f9');
    }
  }

  // Data State
  const allElements = window.CANVA_DATA || [];
  let favorites = JSON.parse(localStorage.getItem('zo_canva_favs') || '[]');
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentTag = '';

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const categoryPillsContainer = document.getElementById('category-pills');
  const elementsGrid = document.getElementById('elements-grid');
  const emptyState = document.getElementById('empty-state');
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  const currentCategoryTitle = document.getElementById('current-category-title');
  const resultsCountLabel = document.getElementById('results-count');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const statTotal = document.getElementById('stat-total');
  const statCategories = document.getElementById('stat-categories');
  const statFavs = document.getElementById('stat-favs');
  const favCountTag = document.getElementById('fav-count-tag');
  const favStatBtn = document.getElementById('fav-stat-btn');
  const toast = document.getElementById('toast');
  const toastCode = document.getElementById('toast-code');
  const toastTitle = document.getElementById('toast-title');

  // Comprehensive Uzbek Synonyms Map
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

  // Normalize Uzbek Diacritics & Punctuation
  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[‘'’`ʻ]/g, '')
      .replace(/o[ʻ'’`]/g, 'o')
      .replace(/g[ʻ'’`]/g, 'g')
      .replace(/sh/g, 'sh')
      .replace(/ch/g, 'ch')
      .trim();
  }

  // Levenshtein Distance for Typo Tolerance
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

  // Smart Search Match & Scoring System
  function calculateSearchScore(rawQuery, item) {
    const query = normalizeText(rawQuery);
    if (!query) return 1;

    let score = 0;
    const descNorm = normalizeText(item.description);
    const catNorm = normalizeText(item.category);
    const codeNorm = normalizeText(item.code);
    const keywordsNorm = normalizeText((item.keywords || []).join(' '));

    // 1. Exact Code Match
    if (codeNorm.includes(query)) score += 1000;

    // 2. Exact Word / Substring Match in Description or Category
    if (descNorm.includes(query)) score += 500;
    if (catNorm.includes(query)) score += 300;
    if (keywordsNorm.includes(query)) score += 200;

    // 3. Synonym Matching
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      const keyNorm = normalizeText(key);
      const isQueryInSyns = query.includes(keyNorm) || syns.some(s => query.includes(normalizeText(s)));
      if (isQueryInSyns) {
        if (descNorm.includes(keyNorm) || catNorm.includes(keyNorm) || syns.some(s => descNorm.includes(normalizeText(s)))) {
          score += 150;
        }
      }
    }

    // 4. Fuzzy Matching for Typos (Levenshtein Distance <= 2)
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
  const categoriesMap = {};
  allElements.forEach(item => {
    categoriesMap[item.category] = (categoriesMap[item.category] || 0) + 1;
  });

  // Render Category Pills
  function renderCategoryPills() {
    let html = `
      <button class="category-pill ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
        Barchasi (${allElements.length})
      </button>
      <button class="category-pill ${currentCategory === 'favorites' ? 'active' : ''}" data-category="favorites">
        ⭐ Saqlanganlar (${favorites.length})
      </button>
    `;

    for (const [cat, count] of Object.entries(categoriesMap)) {
      const activeClass = currentCategory === cat ? 'active' : '';
      html += `
        <button class="category-pill ${activeClass}" data-category="${cat}">
          ${cat} (${count})
        </button>
      `;
    }

    categoryPillsContainer.innerHTML = html;
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

  // Open Canva App Deep Link with Fallback to Elements Search
  function openCanvaDeepLink(code) {
    // 1. Copy code to clipboard first
    copyToClipboard(code, '📋 KOD NUSXALANDI! (Canva -> Elementlar)');

    // 2. Canva Elements search URL (Forces tab=elements)
    const canvaWebUrl = `https://www.canva.com/search?tab=elements&q=${encodeURIComponent(code)}`;
    const canvaAppDeepLink = `canva://search?q=${encodeURIComponent(code)}`;

    // Try Deep Link to App
    const now = Date.now();
    window.location.href = canvaAppDeepLink;

    setTimeout(() => {
      if (Date.now() - now < 1800) {
        // App didn't open, fallback to browser Elements search
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
    renderCategoryPills();
    renderElements();
  }

  // Update Counters & Stats
  function updateStats() {
    statTotal.textContent = allElements.length;
    statCategories.textContent = Object.keys(categoriesMap).length;
    statFavs.textContent = favorites.length;
    favCountTag.textContent = favorites.length;
  }

  // Get Filtered & Ranked Elements
  function getFilteredElements() {
    const results = [];

    allElements.forEach(item => {
      // Category Filter
      if (currentCategory === 'favorites') {
        if (!favorites.includes(item.id)) return;
      } else if (currentCategory !== 'all') {
        if (item.category !== currentCategory) return;
      }

      // Hot Tag Filter
      if (currentTag) {
        const itemStr = `${item.category} ${item.description} ${(item.keywords || []).join(' ')}`.toLowerCase();
        if (currentTag === '3d' && !itemStr.includes('3d')) return;
        if (currentTag === 'smm' && !itemStr.includes('smm') && !itemStr.includes('target') && !itemStr.includes('infografika')) return;
        if (currentTag === 'estetik' && !itemStr.includes('estetik') && !itemStr.includes('aesthetic')) return;
        if (currentTag === 'ramazon' && !itemStr.includes('ramazon') && !itemStr.includes('haj') && !itemStr.includes('umra')) return;
        if (currentTag === 'harf' && !itemStr.includes('harf') && !itemStr.includes('raqam') && !itemStr.includes('2026')) return;
      }

      // Search Query Match Score
      if (currentSearchQuery) {
        const score = calculateSearchScore(currentSearchQuery, item);
        if (score > 0) {
          results.push({ item, score });
        }
      } else {
        results.push({ item, score: 1 });
      }
    });

    // Sort by Score Descending
    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.item);
  }

  // Highlight Query Text
  function highlightMatches(text, query) {
    if (!query || query.length < 2) return text;
    const normQuery = normalizeText(query);
    const regex = new RegExp(`(${normQuery})`, 'gi');
    return text.replace(regex, '<span class="highlight-text">$1</span>');
  }

  // Render Elements Grid
  function renderElements() {
    const filtered = getFilteredElements();

    // Section Title & Count Update
    if (currentCategory === 'favorites') {
      currentCategoryTitle.textContent = '⭐ Saqlangan elementlar';
    } else if (currentCategory === 'all') {
      currentCategoryTitle.textContent = currentSearchQuery ? `Qidiruv: "${currentSearchQuery}"` : 'Barcha elementlar';
    } else {
      currentCategoryTitle.textContent = currentCategory;
    }

    resultsCountLabel.textContent = `${filtered.length} ta element`;

    if (filtered.length === 0) {
      elementsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    let html = '';
    filtered.forEach(item => {
      const isFav = favorites.includes(item.id);
      const favClass = isFav ? 'active fa-solid' : 'fa-regular';
      const highlightedDesc = highlightMatches(item.description, currentSearchQuery);

      html += `
        <div class="element-card" data-id="${item.id}">
          <div class="card-header">
            <span class="category-tag"><i class="fa-solid fa-folder-open"></i> ${item.category}</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${item.id}" title="Saqlash">
              <i class="${favClass} fa-star"></i>
            </button>
          </div>
          
          <div class="element-description">
            ${highlightedDesc}
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
    });

    elementsGrid.innerHTML = html;
  }

  // Global Event Delegation
  elementsGrid.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy');
    const codeBox = e.target.closest('.code-box');
    const canvaBtn = e.target.closest('.btn-canva');
    const favBtn = e.target.closest('.fav-btn');

    if (copyBtn || codeBox) {
      const code = (copyBtn || codeBox).dataset.code;
      copyToClipboard(code);
    } else if (canvaBtn) {
      const code = canvaBtn.dataset.code;
      openCanvaDeepLink(code);
    } else if (favBtn) {
      const id = parseInt(favBtn.dataset.id, 10);
      toggleFavorite(id);
    }
  });

  // Search Input Events & Collapsing Mobile UI for Keyboard
  function updateSearchUIState() {
    const isSearching = !!currentSearchQuery || document.activeElement === searchInput;
    document.body.classList.toggle('is-searching', isSearching);
  }

  let searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !currentSearchQuery);

    updateSearchUIState();

    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderElements();
    }, 100);
  });

  searchInput.addEventListener('focus', () => {
    updateSearchUIState();
  });

  searchInput.addEventListener('blur', () => {
    if (!currentSearchQuery) {
      document.body.classList.remove('is-searching');
    }
  });

  // Clear Search Button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
    document.body.classList.remove('is-searching');
    renderElements();
    triggerHaptic('light');
  });

  // Category Pills Click Event
  categoryPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill');
    if (pill) {
      currentCategory = pill.dataset.category;
      currentTag = '';
      document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
      renderCategoryPills();
      renderElements();
      triggerHaptic('light');
    }
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
      renderCategoryPills();
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
    renderCategoryPills();
    renderElements();
  });

  // Copy All Codes in Current View
  copyAllBtn.addEventListener('click', () => {
    const filtered = getFilteredElements();
    if (filtered.length === 0) return;

    const allCodes = filtered.map(item => `${item.description}: ${item.code}`).join('\n');
    copyToClipboard(allCodes, `${filtered.length} ta element kodi nusxalandi!`);
  });

  // Fav Stat Click
  favStatBtn.addEventListener('click', () => {
    currentCategory = 'favorites';
    renderCategoryPills();
    renderElements();
  });

  // Initial Load
  updateStats();
  renderCategoryPills();
  renderElements();
});
