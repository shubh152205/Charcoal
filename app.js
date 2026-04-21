/* ============================================
   Charcoal - Main App Controller
   Event Handling & Initialization
   ============================================ */

const LiquidGlassEffect = {
  SURFACE_FNS: {
    convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25)
  },
  
  calculateRefractionProfile: function(glassThickness, bezelWidth, heightFn, ior, samples) {
      samples = samples || 128;
      const eta = 1 / ior;
      function refract(nx, ny) {
          const dot = ny;
          const k = 1 - eta * eta * (1 - dot * dot);
          if (k < 0) return null;
          const sq = Math.sqrt(k);
          return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
      }
      const profile = new Float64Array(samples);
      for (let i = 0; i < samples; i++) {
          const x = i / samples;
          const y = heightFn(x);
          const dx = x < 1 ? 0.0001 : -0.0001;
          const y2 = heightFn(x + dx);
          const deriv = (y2 - y) / dx;
          const mag = Math.sqrt(deriv * deriv + 1);
          const ref = refract(-deriv / mag, -1 / mag);
          if (!ref) {
              profile[i] = 0;
              continue;
          }
          profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
      }
      return profile;
  },

  generateDisplacementMap: function(w, h, radius, bezelWidth, profile, maxDisp) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = 128; d[i + 1] = 128; d[i + 2] = 0; d[i + 3] = 255; }
      const r = radius, rSq = r * r, r1Sq = (r + 1) ** 2;
      const rBSq = Math.max(r - bezelWidth, 0) ** 2;
      const wB = w - r * 2, hB = h - r * 2, S = profile.length;
      for (let y1 = 0; y1 < h; y1++) {
          for (let x1 = 0; x1 < w; x1++) {
              const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
              const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
              const dSq = x * x + y * y;
              if (dSq > r1Sq || dSq < rBSq) continue;
              const dist = Math.sqrt(dSq);
              const fromSide = r - dist;
              const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
              if (op <= 0 || dist === 0) continue;
              const cos = x / dist, sin = y / dist;
              const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1);
              const disp = profile[bi] || 0;
              const dX = (-cos * disp) / maxDisp, dY = (-sin * disp) / maxDisp;
              const idx = (y1 * w + x1) * 4;
              d[idx] = (128 + dX * 127 * op + 0.5) | 0;
              d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
          }
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL();
  },

  generateSpecularMap: function(w, h, radius, bezelWidth, angle) {
      angle = angle != null ? angle : Math.PI / 3;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(w, h);
      const d = img.data;
      d.fill(0);
      const r = radius, rSq = r * r, r1Sq = (r + 1) ** 2;
      const rBSq = Math.max(r - bezelWidth, 0) ** 2;
      const wB = w - r * 2, hB = h - r * 2;
      const sv = [Math.cos(angle), Math.sin(angle)];
      for (let y1 = 0; y1 < h; y1++) {
          for (let x1 = 0; x1 < w; x1++) {
              const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
              const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
              const dSq = x * x + y * y;
              if (dSq > r1Sq || dSq < rBSq) continue;
              const dist = Math.sqrt(dSq);
              const fromSide = r - dist;
              const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
              if (op <= 0 || dist === 0) continue;
              const cos = x / dist, sin = -y / dist;
              const dot = Math.abs(cos * sv[0] + sin * sv[1]);
              const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
              const coeff = dot * edge;
              const col = (255 * coeff) | 0;
              const alpha = (col * coeff * op) | 0;
              const idx = (y1 * w + x1) * 4;
              d[idx] = col;
              d[idx + 1] = col;
              d[idx + 2] = col;
              d[idx + 3] = alpha;
          }
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL('image/png');
  },

  buildFilterDef: function(id, w, h, radius, blurAmt, ior) {
      if (w < 2 || h < 2) return '';
      const glassThick = 80; 
      const bezelW = 60; 
      const scaleRatio = 1.0;
      const specOpacity = 0.5;
      const specSat = 4;
      const clampedBezel = Math.min(bezelW, radius - 1, Math.min(w, h) / 2 - 1);
      
      const profile = this.calculateRefractionProfile(glassThick, clampedBezel, this.SURFACE_FNS.convex_squircle, ior, 128);
      const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;
      const dispUrl = this.generateDisplacementMap(w, h, radius, clampedBezel, profile, maxDisp);
      const specUrl = this.generateSpecularMap(w, h, radius, Math.max(2, clampedBezel * 2.5));
      const scale = maxDisp * scaleRatio;

      return `
        <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
            <!-- SourceBlur -->
            <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmt}" result="blurred_source" />
            <!-- Displacement Map -->
            <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
            <!-- Displacement Application -->
            <feDisplacementMap in="blurred_source" in2="disp_map"
                scale="${scale}" xChannelSelector="R" yChannelSelector="G"
                result="displaced" />
            <!-- Specular Saturation boost -->
            <feColorMatrix in="displaced" type="saturate" values="${specSat}" result="displaced_sat" />
            <!-- Specular Render -->
            <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
            
            <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
            <feComponentTransfer in="spec_layer" result="spec_faded">
                <feFuncA type="linear" slope="${specOpacity}" />
            </feComponentTransfer>
            <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
            <feBlend in="spec_faded" in2="with_sat" mode="normal" />
        </filter>
      `;
  },
  
  update: function() {
      // Only do heavy calculations if the theme requires it
      if(document.body.getAttribute('data-theme') !== 'liquid-glass') return;
      
      let defs = document.getElementById('liquid-glass-svg-defs');
      if (!defs) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("style", "position: absolute; overflow: hidden; height:0; width:0; pointer-events:none;");
        svg.setAttribute("color-interpolation-filters", "sRGB");
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "liquid-glass-svg-defs";
        svg.appendChild(defs);
        document.body.appendChild(svg);
      }
      
      let html = "";
      
      const blurAmtRaw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--blur-amount').trim().replace('px','')) || 8;
      const normalizedBlur = blurAmtRaw / 3; 

      // Board Dimensions
      const boardCards = document.querySelectorAll('.board-card');
      if (boardCards.length > 0) {
        const rect = boardCards[0].getBoundingClientRect();
        const w = rect.width > 10 ? Math.round(rect.width) : 280;
        const h = rect.height > 10 ? Math.round(rect.height) : 160;
        html += this.buildFilterDef("liquid-glass-board-filter", w, h, 16, normalizedBlur, 2.0); 
      }
      
      // Icon Dimensions
      const pinnedIcons = document.querySelectorAll('.pinned-site-icon');
      if (pinnedIcons.length > 0) {
        const rect = pinnedIcons[0].getBoundingClientRect();
        const w = rect.width > 2 ? Math.round(rect.width) : 56;
        const h = rect.height > 2 ? Math.round(rect.height) : 56;
        html += this.buildFilterDef("liquid-glass-icon-filter", w, h, 16, normalizedBlur, 2.5); 
      }
      
      // Button Dimensions
      const toolbarBtns = document.querySelectorAll('.toolbar-btn');
      if (toolbarBtns.length > 0) {
        const rect = toolbarBtns[0].getBoundingClientRect();
        const w = rect.width > 2 ? Math.round(rect.width) : 48;
        const h = rect.height > 2 ? Math.round(rect.height) : 48;
        html += this.buildFilterDef("liquid-glass-btn-filter", w, h, 24, normalizedBlur, 2.5); 
      }
      
      defs.innerHTML = html;
  },

  init: function() {
    this.update();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.update(), 200);
    });
  }
};

const App = {
  currentBoardId: null,
  currentBookmarkId: null,
  currentEditBoardId: null,
  contextTarget: null,
  privacyMode: false,
  incognitoMode: false,
  _confirmResolve: null,

  async init() {
    await DataManager.init();
    UI.applyTheme();
    UI.renderWallpaper();
    UI.renderTabs();
    UI.renderBoards();
    UI.applySettings();
    this.bindEvents();
    this.initClockWidget();
    this.initQuoteWidget();
    this.initWeatherWidget();
    this.applyTabName();
    UI.renderPinnedSites();
    UI.renderRecentTabs();
    this.applyBgBlur();
    this.applyGlassOpacity();
    this.applyGlassFillOpacity();
    LiquidGlassEffect.init();
  },

  // Custom confirm dialog (native confirm() is blocked in Chrome extension new tab pages)
  showConfirm(title, message) {
    return new Promise(resolve => {
      this._confirmResolve = resolve;
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-modal').classList.remove('hidden');
    });
  },

  bindEvents() {
    // Custom confirm dialog buttons
    document.getElementById('confirm-ok').addEventListener('click', () => {
      document.getElementById('confirm-modal').classList.add('hidden');
      if (this._confirmResolve) { this._confirmResolve(true); this._confirmResolve = null; }
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      document.getElementById('confirm-modal').classList.add('hidden');
      if (this._confirmResolve) { this._confirmResolve(false); this._confirmResolve = null; }
    });

    // Page navigation
    document.getElementById('page-nav-left').addEventListener('click', () => {
      document.getElementById('tabs-list').scrollBy({ left: -200, behavior: 'smooth' });
    });

    // Add page
    document.getElementById('add-page-btn').addEventListener('click', () => this.openModal('add-page-modal'));
    document.getElementById('cancel-add-page').addEventListener('click', () => this.closeModal('add-page-modal'));
    document.getElementById('confirm-add-page').addEventListener('click', () => {
      const name = document.getElementById('new-page-name').value.trim();
      if (!name) { document.getElementById('new-page-name').focus(); return; }
      DataManager.addPage(name);
      document.getElementById('new-page-name').value = '';
      this.closeModal('add-page-modal');
      UI.renderTabs();
      UI.renderBoards();
      this.showToast('Page created');
    });

    // Add board
    document.getElementById('cancel-add-board').addEventListener('click', () => this.closeModal('add-board-modal'));
    document.getElementById('confirm-add-board').addEventListener('click', () => {
      const name = document.getElementById('new-board-name').value.trim();
      if (!name) { document.getElementById('new-board-name').focus(); return; }
      const page = DataManager.getActivePage();
      DataManager.addBoard(page.id, name);
      document.getElementById('new-board-name').value = '';
      this.closeModal('add-board-modal');
      UI.renderBoards();
      this.showToast('Board created');
    });

    // Add bookmark
    document.getElementById('cancel-add-bookmark').addEventListener('click', () => this.closeModal('add-bookmark-modal'));
    document.getElementById('confirm-add-bookmark').addEventListener('click', () => {
      const title = document.getElementById('new-bookmark-title').value.trim();
      const url = document.getElementById('new-bookmark-url').value.trim();
      const desc = document.getElementById('new-bookmark-desc').value.trim();
      if (!title || !url) { (!title ? document.getElementById('new-bookmark-title') : document.getElementById('new-bookmark-url')).focus(); return; }
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) finalUrl = 'https://' + url;
      const page = DataManager.getActivePage();
      DataManager.addBookmark(page.id, this.currentBoardId, title, finalUrl, desc);
      document.getElementById('new-bookmark-title').value = '';
      document.getElementById('new-bookmark-url').value = '';
      document.getElementById('new-bookmark-desc').value = '';
      this.closeModal('add-bookmark-modal');
      UI.renderBoards();
      this.showToast('Bookmark added');
    });

    // Edit bookmark
    document.getElementById('cancel-edit-bookmark').addEventListener('click', () => this.closeModal('edit-bookmark-modal'));
    document.getElementById('confirm-edit-bookmark').addEventListener('click', () => {
      const title = document.getElementById('edit-bookmark-title').value.trim();
      const url = document.getElementById('edit-bookmark-url').value.trim();
      const desc = document.getElementById('edit-bookmark-desc').value.trim();
      if (!title || !url) return;
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) finalUrl = 'https://' + url;
      const page = DataManager.getActivePage();
      DataManager.editBookmark(page.id, this.currentBoardId, this.currentBookmarkId, title, finalUrl, desc);
      this.closeModal('edit-bookmark-modal');
      UI.renderBoards();
      this.showToast('Bookmark updated');
    });

    // Edit board
    document.getElementById('cancel-edit-board').addEventListener('click', () => this.closeModal('edit-board-modal'));
    document.getElementById('confirm-edit-board').addEventListener('click', () => {
      const name = document.getElementById('edit-board-name').value.trim();
      if (!name) return;
      const page = DataManager.getActivePage();
      DataManager.renameBoard(page.id, this.currentEditBoardId, name);
      this.closeModal('edit-board-modal');
      UI.renderBoards();
      this.showToast('Board renamed');
    });

    // Toolbar buttons
    document.getElementById('btn-search').addEventListener('click', () => this.toggleSearch());
    document.getElementById('btn-import-export').addEventListener('click', () => this.openModal('import-export-modal'));
    document.getElementById('btn-incognito').addEventListener('click', () => this.toggleIncognito());
    document.getElementById('btn-multiselect').addEventListener('click', () => this.showToast('Multi-select: Coming soon'));
    document.getElementById('btn-trash').addEventListener('click', () => { UI.renderTrash(); this.openModal('trash-modal'); });
    document.getElementById('btn-privacy').addEventListener('click', () => this.togglePrivacy());
    document.getElementById('btn-settings').addEventListener('click', () => this.openModal('settings-modal'));

    // Search
    document.getElementById('search-close').addEventListener('click', () => this.closeSearch());
    document.getElementById('search-input').addEventListener('input', (e) => UI.renderSearchResults(e.target.value));

    // Style panel
    document.getElementById('btn-style').addEventListener('click', (e) => { e.stopPropagation(); this.toggleStylePanel(); });
    document.getElementById('theme-dark').addEventListener('click', () => {
      DataManager.theme = 'dark';
      DataManager.saveTheme();
      UI.applyTheme();
      UI.renderWallpaperGrid();
      UI.renderCustomWallpapers();
      const lightIds = BUILTIN_WALLPAPERS.light.map(w => w.id);
      if (lightIds.includes(DataManager.wallpaper)) {
        DataManager.wallpaper = '10057';
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
      }
    });
    document.getElementById('theme-light').addEventListener('click', () => {
      DataManager.theme = 'light';
      DataManager.saveTheme();
      UI.applyTheme();
      UI.renderWallpaperGrid();
      UI.renderCustomWallpapers();
      const darkIds = BUILTIN_WALLPAPERS.dark.map(w => w.id);
      if (darkIds.includes(DataManager.wallpaper)) {
        DataManager.wallpaper = '10040';
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
      }
    });

    // Wallpaper upload
    document.getElementById('wallpaper-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { this.showToast('Please select an image file'); return; }
      if (file.size > 30 * 1024 * 1024) { this.showToast('Image too large (max 30MB)'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const wp = DataManager.addCustomWallpaper(reader.result);
        DataManager.wallpaper = 'custom_' + wp.id;
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
        UI.renderCustomWallpapers();
        this.showToast('Wallpaper uploaded!');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });

    // Video/GIF upload
    document.getElementById('video-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/gif')) { 
        this.showToast('Please select a video or GIF file'); return; 
      }
      if (file.size > 100 * 1024 * 1024) { this.showToast('File too large (max 100MB)'); return; }
      
      const reader = new FileReader();
      reader.onload = () => {
        const wp = DataManager.addCustomWallpaper(reader.result);
        DataManager.wallpaper = 'custom_' + wp.id;
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
        UI.renderCustomWallpapers();
        this.showToast('Video wallpaper uploaded!');
      };
      // For very large files, this might take a moment, show a loading toast if needed
      this.showToast('Uploading... please wait.');
      reader.readAsDataURL(file);
      e.target.value = '';
    });

    // Settings toggles (General)
    const settingMap = {
      'setting-compact': 'compact',
      'setting-hide-extra': 'hideExtra',
      'setting-shorten': 'shortenTitles',
      'setting-new-tab': 'openNewTab',
      'setting-descriptions': 'showDescriptions',
      'setting-confirm-delete': 'confirmDelete',
      'setting-show-greeting': 'showGreeting',
      'setting-show-time': 'showTime',
      'setting-show-seconds': 'showSeconds',
      'setting-show-date': 'showDate',
      'setting-show-day': 'showDay',
      'setting-show-quote': 'showQuote',
      'setting-show-weather': 'showWeather',

    };
    Object.entries(settingMap).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('change', (e) => {
        DataManager.settings[key] = e.target.checked;
        DataManager.saveSettings();
        UI.renderBoards();
        this.updateClockVisibility();
        this.updateQuoteVisibility();
        if (key === 'showWeather') this.initWeatherWidget();

      });
    });

    // Widget toggle settings
    const widgetSettingMap = {
      'setting-show-pinned': 'showPinnedSites',
      'setting-show-recent-tabs': 'showRecentTabs',
      'setting-liquid-glass': 'liquidGlass',
    };
    Object.entries(widgetSettingMap).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('change', (e) => {
        DataManager.settings[key] = e.target.checked;
        DataManager.saveSettings();
        if (key === 'showPinnedSites') UI.renderPinnedSites();
        if (key === 'showRecentTabs') UI.renderRecentTabs();
        if (key === 'liquidGlass') {
          document.body.classList.toggle('liquid-glass-active', e.target.checked);
        }
      });
    });

    // Blur intensity slider
    const blurSlider = document.getElementById('setting-blur-intensity');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        DataManager.settings.blurIntensity = val;
        const label = document.getElementById('blur-value-label');
        if (label) label.textContent = val + 'px';
        this.applyBgBlur();
      });
      blurSlider.addEventListener('change', () => {
        DataManager.saveSettings();
      });
    }

    // Glass opacity slider
    const opacitySlider = document.getElementById('setting-glass-opacity');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        DataManager.settings.glassOpacity = val;
        const label = document.getElementById('glass-opacity-value-label');
        if (label) label.textContent = val + '%';
        this.applyGlassOpacity();
      });
      opacitySlider.addEventListener('change', () => {
        DataManager.saveSettings();
      });
    }

    // Glass fill opacity slider
    const fillOpacitySlider = document.getElementById('setting-glass-fill-opacity');
    if (fillOpacitySlider) {
      fillOpacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        DataManager.settings.glassFillOpacity = val;
        const label = document.getElementById('glass-fill-opacity-value-label');
        if (label) label.textContent = val + '%';
        this.applyGlassFillOpacity();
      });
      fillOpacitySlider.addEventListener('change', () => {
        DataManager.saveSettings();
      });
    }

    // Manage Pinned Sites
    document.getElementById('btn-manage-pinned').addEventListener('click', () => {
      UI.renderManagePinnedSites();
      this.openModal('manage-pinned-modal');
    });
    document.getElementById('close-manage-pinned').addEventListener('click', () => this.closeModal('manage-pinned-modal'));
    document.getElementById('add-pinned-site').addEventListener('click', () => {
      const titleInput = document.getElementById('pinned-site-title');
      const urlInput = document.getElementById('pinned-site-url');
      const title = titleInput.value.trim();
      let url = urlInput.value.trim();
      if (!title || !url) {
        (!title ? titleInput : urlInput).focus();
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      if (!DataManager.settings.pinnedSites) DataManager.settings.pinnedSites = [];
      DataManager.settings.pinnedSites.push({ id: generateId(), title, url });
      DataManager.saveSettings();
      titleInput.value = '';
      urlInput.value = '';
      UI.renderManagePinnedSites();
      UI.renderPinnedSites();
      this.showToast('Pinned site added');
    });

    // Text input settings
    const textSettingMap = {
      'setting-greeting-name': 'greetingName',
      'setting-custom-quote': 'customQuote',
      'setting-weather-location': 'weatherLocation',
      'setting-tab-name': 'tabName',
    };
    Object.entries(textSettingMap).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('input', (e) => {
        DataManager.settings[key] = e.target.value;
        DataManager.saveSettings();
        if (key === 'greetingName') this.updateGreeting();
        if (key === 'customQuote') this.initQuoteWidget();
        if (key === 'tabName') this.applyTabName();
        if (key === 'weatherLocation') {
          clearTimeout(this._weatherDebounce);
          this._weatherDebounce = setTimeout(() => this.fetchWeather(), 800);
        }
      });
    });

    // Dropdown settings
    const selectSettingMap = {
      'setting-time-format': 'timeFormat',
      'setting-date-format': 'dateFormat',
      'setting-weather-unit': 'weatherUnit',
      'setting-theme-select': 'themeMode',
    };
    Object.entries(selectSettingMap).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('change', (e) => {
        DataManager.settings[key] = e.target.value;
        DataManager.saveSettings();
        if (key === 'themeMode') this.applyThemeMode(e.target.value);
        if (key === 'weatherUnit') this.fetchWeather();
      });
    });

    // Settings sidebar navigation
    document.querySelectorAll('.settings-nav-item').forEach(navItem => {
      navItem.addEventListener('click', () => {
        const panel = navItem.dataset.panel;
        document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
        navItem.classList.add('active');
        const targetPanel = document.querySelector(`.settings-panel[data-panel="${panel}"]`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Settings modal close
    document.getElementById('close-settings').addEventListener('click', () => this.closeModal('settings-modal'));

    // Settings data actions
    document.getElementById('settings-export').addEventListener('click', () => this.exportData());
    document.getElementById('settings-import').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => this.handleImport(e));
    document.getElementById('settings-reset').addEventListener('click', async () => {
      const confirmed = await this.showConfirm('Reset All Data?', 'This will delete all your pages, boards, and bookmarks permanently. This cannot be undone.');
      if (!confirmed) return;
      await DataManager.resetAll();
      UI.applyTheme();
      UI.renderWallpaper();
      UI.renderTabs();
      UI.renderBoards();
      UI.applySettings();
      this.showToast('All data reset');
    });

    // Trash
    document.getElementById('close-trash').addEventListener('click', () => this.closeModal('trash-modal'));
    document.getElementById('empty-trash').addEventListener('click', async () => {
      const confirmed = await this.showConfirm('Empty Trash?', 'All items in the trash will be permanently deleted. This cannot be undone.');
      if (!confirmed) return;
      DataManager.emptyTrash();
      UI.renderTrash();
      this.showToast('Trash emptied');
    });

    // Import/Export modal
    document.getElementById('close-import-export').addEventListener('click', () => this.closeModal('import-export-modal'));
    document.getElementById('ie-export').addEventListener('click', () => { this.exportData(); this.closeModal('import-export-modal'); });
    document.getElementById('ie-import').addEventListener('click', () => document.getElementById('ie-import-file').click());
    document.getElementById('ie-import-file').addEventListener('change', (e) => { this.handleImport(e); this.closeModal('import-export-modal'); });
    document.getElementById('ie-import-chrome').addEventListener('click', async () => {
      const success = await DataManager.importChromeBookmarks();
      if (success) {
        UI.renderBoards();
        this.showToast('Chrome bookmarks imported!');
      } else {
        this.showToast('Chrome bookmarks API not available');
      }
      this.closeModal('import-export-modal');
    });

    // Close context menu on click outside
    document.addEventListener('click', (e) => {
      // Don't hide context menu if clicking inside it
      const ctxMenu = document.getElementById('context-menu');
      if (!ctxMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Close style panel on click outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('style-panel');
      const btn = document.getElementById('btn-style');
      if (!panel.classList.contains('hidden') && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close confirm modal
        const confirmModal = document.getElementById('confirm-modal');
        if (!confirmModal.classList.contains('hidden')) {
          confirmModal.classList.add('hidden');
          if (this._confirmResolve) { this._confirmResolve(false); this._confirmResolve = null; }
          return;
        }
        this.closeSearch();
        this.closeAllModals();
        this.hideContextMenu();
        document.getElementById('style-panel').classList.add('hidden');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleSearch();
      }
    });

    // Modal overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          if (overlay.id === 'confirm-modal') {
            if (this._confirmResolve) { this._confirmResolve(false); this._confirmResolve = null; }
          }
          overlay.classList.add('hidden');
        }
      });
    });

    // Enter key in modals
    document.getElementById('new-page-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirm-add-page').click();
    });
    document.getElementById('new-board-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirm-add-board').click();
    });
    document.getElementById('new-bookmark-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirm-add-bookmark').click();
    });
    document.getElementById('edit-bookmark-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirm-edit-bookmark').click();
    });
    document.getElementById('edit-board-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('confirm-edit-board').click();
    });
  },

  // Modal helpers
  openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    const firstInput = document.querySelector(`#${id} .modal-input`);
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  },
  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },
  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  },

  openAddBoardModal() { this.openModal('add-board-modal'); },
  openAddBookmarkModal(boardId) { this.currentBoardId = boardId; this.openModal('add-bookmark-modal'); },
  openEditBookmarkModal(boardId, bmId, title, url, desc) {
    this.currentBoardId = boardId;
    this.currentBookmarkId = bmId;
    document.getElementById('edit-bookmark-title').value = title;
    document.getElementById('edit-bookmark-url').value = url;
    document.getElementById('edit-bookmark-desc').value = desc || '';
    this.openModal('edit-bookmark-modal');
  },
  openEditBoardModal(boardId, name) {
    this.currentEditBoardId = boardId;
    document.getElementById('edit-board-name').value = name;
    this.openModal('edit-board-modal');
  },

  // Delete helpers using custom confirm
  async deleteBoard(pageId, boardId, boardName) {
    if (DataManager.settings.confirmDelete) {
      const confirmed = await this.showConfirm('Delete Board?', `"${boardName}" and all its bookmarks will be moved to trash.`);
      if (!confirmed) return;
    }
    DataManager.deleteBoard(pageId, boardId);
    UI.renderBoards();
    this.showToast('Board moved to trash');
  },

  async deleteBookmark(pageId, boardId, bookmarkId, bookmarkTitle) {
    if (DataManager.settings.confirmDelete) {
      const confirmed = await this.showConfirm('Delete Bookmark?', `"${bookmarkTitle}" will be moved to trash.`);
      if (!confirmed) return;
    }
    DataManager.deleteBookmark(pageId, boardId, bookmarkId);
    UI.renderBoards();
    this.showToast('Bookmark moved to trash');
  },

  async deletePage(pageId, pageName) {
    if (DataManager.settings.confirmDelete) {
      const confirmed = await this.showConfirm('Delete Page?', `"${pageName}" and all its boards will be moved to trash.`);
      if (!confirmed) return;
    }
    DataManager.deletePage(pageId);
    UI.renderTabs();
    UI.renderBoards();
    this.showToast('Page moved to trash');
  },

  // Search
  toggleSearch() {
    const overlay = document.getElementById('search-overlay');
    if (overlay.classList.contains('hidden')) {
      overlay.classList.remove('hidden');
      document.getElementById('btn-search').classList.add('active');
      setTimeout(() => document.getElementById('search-input').focus(), 100);
    } else {
      this.closeSearch();
    }
  },
  closeSearch() {
    document.getElementById('search-overlay').classList.add('hidden');
    document.getElementById('btn-search').classList.remove('active');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').classList.remove('has-results');
    document.getElementById('search-results').innerHTML = '';
  },

  // Style panel
  toggleStylePanel() {
    const panel = document.getElementById('style-panel');
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      UI.renderWallpaperGrid();
      UI.renderCustomWallpapers();
    } else {
      panel.classList.add('hidden');
    }
  },

  // Privacy mode
  togglePrivacy() {
    this.privacyMode = !this.privacyMode;
    document.body.classList.toggle('privacy-blur', this.privacyMode);
    document.getElementById('btn-privacy').classList.toggle('active', this.privacyMode);
    this.showToast(this.privacyMode ? 'Privacy blur ON' : 'Privacy blur OFF');
  },

  // Incognito mode
  toggleIncognito() {
    this.incognitoMode = !this.incognitoMode;
    document.getElementById('btn-incognito').classList.toggle('active', this.incognitoMode);
    if (this.incognitoMode) {
      DataManager.settings.openNewTab = true;
      DataManager.saveSettings();
    }
    this.showToast(this.incognitoMode ? 'Incognito mode ON' : 'Incognito mode OFF');
  },

  // Context menu
  showContextMenu(x, y, type, id, boardId) {
    const menu = document.getElementById('context-menu');
    menu.classList.remove('hidden');
    menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 80) + 'px';
    this.contextTarget = { type, id, boardId };

    menu.querySelectorAll('.ctx-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.handleContextAction(action);
        this.hideContextMenu();
      };
    });
  },

  hideContextMenu() {
    document.getElementById('context-menu').classList.add('hidden');
  },

  handleContextAction(action) {
    const t = this.contextTarget;
    if (!t) return;
    const page = DataManager.getActivePage();

    if (action === 'edit') {
      if (t.type === 'page') {
        const pg = DataManager.data.pages.find(p => p.id === t.id);
        if (pg) {
          const newName = prompt('Rename page:', pg.name);
          if (newName && newName.trim()) {
            DataManager.renamePage(t.id, newName.trim());
            UI.renderTabs();
          }
        }
      } else if (t.type === 'board') {
        const board = page.boards.find(b => b.id === t.id);
        if (board) this.openEditBoardModal(board.id, board.name);
      } else if (t.type === 'bookmark') {
        const board = page.boards.find(b => b.id === t.boardId);
        if (board) {
          const bm = board.bookmarks.find(b => b.id === t.id);
          if (bm) this.openEditBookmarkModal(t.boardId, bm.id, bm.title, bm.url, bm.desc);
        }
      }
    } else if (action === 'delete') {
      if (t.type === 'page') {
        const pg = DataManager.data.pages.find(p => p.id === t.id);
        this.deletePage(t.id, pg ? pg.name : 'Page');
      } else if (t.type === 'board') {
        const board = page.boards.find(b => b.id === t.id);
        this.deleteBoard(page.id, t.id, board ? board.name : 'Board');
      } else if (t.type === 'bookmark') {
        const board = page.boards.find(b => b.id === t.boardId);
        if (board) {
          const bm = board.bookmarks.find(b => b.id === t.id);
          this.deleteBookmark(page.id, t.boardId, t.id, bm ? bm.title : 'Bookmark');
        }
      }
    }
  },

  // Export
  exportData() {
    const json = DataManager.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charcoal_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Data exported');
  },

  // Import
  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const success = await DataManager.importData(text);
    if (success) {
      UI.applyTheme();
      UI.renderWallpaper();
      UI.renderTabs();
      UI.renderBoards();
      UI.applySettings();
      this.showToast('Data imported successfully');
    } else {
      this.showToast('Invalid backup file');
    }
    e.target.value = '';
  },

  // Toast
  showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
  },

  // ==================== Clock Widget ====================
  _clockInterval: null,

  initClockWidget() {
    this.updateClock();
    this._clockInterval = setInterval(() => this.updateClock(), 1000);
    this.updateClockVisibility();
  },

  updateClock() {
    const now = new Date();
    this.updateGreeting(now);
    this.updateTime(now);
    this.updateDate(now);
  },

  updateGreeting(now = new Date()) {
    const h = now.getHours();
    let greeting;
    if (h < 5) greeting = 'Good Night';
    else if (h < 12) greeting = 'Good Morning';
    else if (h < 17) greeting = 'Good Afternoon';
    else if (h < 21) greeting = 'Good Evening';
    else greeting = 'Good Night';

    const name = DataManager.settings.greetingName;
    if (name) greeting += `, ${name}`;

    const el = document.getElementById('clock-greeting');
    if (el) el.textContent = greeting;
  },

  updateTime(now = new Date()) {
    const s = DataManager.settings;
    let h = now.getHours();
    let m = now.getMinutes();
    let sec = now.getSeconds();
    let suffix = '';

    if (s.timeFormat === '12') {
      suffix = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    }

    let timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (s.showSeconds) timeStr += `:${sec.toString().padStart(2, '0')}`;
    timeStr += suffix;

    const el = document.getElementById('clock-time');
    if (el) el.textContent = timeStr;
  },

  updateDate(now = new Date()) {
    const s = DataManager.settings;
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = now.getDate(), m = now.getMonth(), y = now.getFullYear();
    let dateStr;

    switch (s.dateFormat) {
      case 'short': dateStr = `${d.toString().padStart(2,'0')}/${(m+1).toString().padStart(2,'0')}/${y}`; break;
      case 'us': dateStr = `${(m+1).toString().padStart(2,'0')}/${d.toString().padStart(2,'0')}/${y}`; break;
      case 'iso': dateStr = `${y}-${(m+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`; break;
      default: dateStr = `${d} ${months[m]} ${y}`;
    }

    if (s.showDay) dateStr = `${days[now.getDay()]}, ${dateStr}`;

    const el = document.getElementById('clock-date');
    if (el) el.textContent = dateStr;
  },

  updateClockVisibility() {
    const s = DataManager.settings;
    const widget = document.getElementById('clock-widget');
    const greetEl = document.getElementById('clock-greeting');
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');

    if (greetEl) greetEl.style.display = s.showGreeting ? '' : 'none';
    if (timeEl) timeEl.style.display = s.showTime ? '' : 'none';
    if (dateEl) dateEl.style.display = s.showDate ? '' : 'none';

    if (widget) {
      const anyVisible = s.showGreeting || s.showTime || s.showDate;
      widget.classList.toggle('hidden-widget', !anyVisible);
    }
  },

  // ==================== Quote Widget ====================
  QUOTES: [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
    { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
    { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
    { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
    { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
    { text: 'Your limitation—it\'s only your imagination.', author: 'Unknown' },
    { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
    { text: 'Great things never come from comfort zones.', author: 'Unknown' },
    { text: 'Dream it. Wish it. Do it.', author: 'Unknown' },
    { text: 'Don\'t stop when you\'re tired. Stop when you\'re done.', author: 'Unknown' },
    { text: 'Wake up with determination. Go to bed with satisfaction.', author: 'Unknown' },
    { text: 'Do something today that your future self will thank you for.', author: 'Unknown' },
    { text: 'Little things make big days.', author: 'Unknown' },
    { text: 'It\'s going to be hard, but hard does not mean impossible.', author: 'Unknown' },
    { text: 'Don\'t wait for opportunity. Create it.', author: 'Unknown' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  ],

  initQuoteWidget() {
    const s = DataManager.settings;
    const textEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const widget = document.getElementById('quote-widget');

    if (!s.showQuote) {
      if (widget) widget.style.display = 'none';
      return;
    }
    if (widget) widget.style.display = '';

    if (s.customQuote) {
      if (textEl) textEl.textContent = `"${s.customQuote}"`;
      if (authorEl) authorEl.textContent = '';
    } else {
      const q = this.QUOTES[Math.floor(Math.random() * this.QUOTES.length)];
      if (textEl) textEl.textContent = `"${q.text}"`;
      if (authorEl) authorEl.textContent = `— ${q.author}`;
    }
  },

  updateQuoteVisibility() {
    const widget = document.getElementById('quote-widget');
    if (widget) widget.style.display = DataManager.settings.showQuote ? '' : 'none';
  },

  // ==================== Weather Widget ====================
  _weatherCache: null,

  async initWeatherWidget() {
    const s = DataManager.settings;
    const weatherEl = document.getElementById('clock-weather');
    if (!s.showWeather || !weatherEl) {
      if (weatherEl) weatherEl.style.display = 'none';
      return;
    }
    weatherEl.style.display = '';
    await this.fetchWeather();
  },

  async fetchWeather() {
    const s = DataManager.settings;
    const weatherEl = document.getElementById('clock-weather');
    if (!s.showWeather || !weatherEl) return;

    const location = s.weatherLocation || 'London';
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await res.json();
      const current = data.current_condition[0];
      const tempC = parseInt(current.temp_C);
      const tempF = parseInt(current.temp_F);
      const temp = s.weatherUnit === 'F' ? `${tempF}°F` : `${tempC}°C`;
      const desc = current.weatherDesc[0].value;
      const icon = this.getWeatherEmoji(parseInt(current.weatherCode));
      weatherEl.innerHTML = `<span class="clock-weather-icon">${icon}</span> ${temp} · ${desc}`;
      this._weatherCache = { temp, desc, icon };
    } catch {
      weatherEl.innerHTML = `<span class="clock-weather-icon">🌍</span> Weather unavailable`;
    }
  },

  getWeatherEmoji(code) {
    if (code === 113) return '☀️';
    if (code === 116) return '⛅';
    if (code === 119 || code === 122) return '☁️';
    if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(code)) return '🌧️';
    if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377, 392, 395].includes(code)) return '❄️';
    if ([200, 386, 389].includes(code)) return '⛈️';
    if ([143, 248, 260].includes(code)) return '🌫️';
    return '🌤️';
  },

  // ==================== Theme & Tab Name ====================
  applyThemeMode(mode) {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      DataManager.theme = prefersDark ? 'dark' : 'light';
    } else {
      DataManager.theme = mode;
    }
    DataManager.saveTheme();
    UI.applyTheme();
    UI.renderWallpaperGrid();
    UI.renderCustomWallpapers();
  },

  applyTabName() {
    const name = DataManager.settings.tabName || 'Charcoal';
    document.title = name;
  },

  applyGlassOpacity() {
    const opacity = DataManager.settings.glassOpacity !== undefined ? DataManager.settings.glassOpacity : 100;
    const o = (opacity / 100).toFixed(2);
    document.documentElement.style.setProperty('--glass-ui-opacity', o);
    this._recomputeGlassVars();
  },

  applyGlassFillOpacity() {
    const fillOpacity = DataManager.settings.glassFillOpacity !== undefined ? DataManager.settings.glassFillOpacity : 55;
    document.documentElement.style.setProperty('--glass-board-opacity', (fillOpacity / 100).toFixed(2));
    this._recomputeGlassVars();
  },

  _recomputeGlassVars() {
    const s = getComputedStyle(document.documentElement);
    const r = s.getPropertyValue('--glass-r').trim() || '22';
    const g = s.getPropertyValue('--glass-g').trim() || '22';
    const b = s.getPropertyValue('--glass-b').trim() || '26';
    
    // 1. Settings / Menus (Controlled by Glass Opacity dial)
    const uiOpacity = parseFloat(s.getPropertyValue('--glass-ui-opacity').trim()) || 1;
    const bgUiAlpha = (0.55 * uiOpacity).toFixed(3);
    const brdUiAlpha = (0.08 * uiOpacity).toFixed(3);
    
    document.documentElement.style.setProperty('--glass-bg', `rgba(${r}, ${g}, ${b}, ${bgUiAlpha})`);
    document.documentElement.style.setProperty('--glass-border', `rgba(255, 255, 255, ${brdUiAlpha})`);
    document.documentElement.style.setProperty('--glass-inset', `inset 0 0 20px -5px rgba(255, 255, 255, ${(0.12 * uiOpacity).toFixed(3)}), inset 0 1px 1px rgba(255, 255, 255, ${(0.15 * uiOpacity).toFixed(3)})`);
    document.documentElement.style.setProperty('--glass-highlight', `rgba(255, 255, 255, ${(0.1 * uiOpacity).toFixed(3)})`);

    // 2. Boards and Icons (Controlled by Fill Transparency dial)
    // The dial gives values 0-100. Let's say 100 means full 1.0 alpha, 55 means 0.55.
    const boardOpacity = parseFloat(s.getPropertyValue('--glass-board-opacity').trim()) || 0.55;
    const bgBoardAlpha = boardOpacity.toFixed(3);
    // Scale borders proportionally to fill opacity, bounded nicely
    const ratio = Math.max(0.2, boardOpacity);
    const brdBoardAlpha = (0.08 * ratio).toFixed(3);
    
    document.documentElement.style.setProperty('--glass-board-bg', `rgba(${r}, ${g}, ${b}, ${bgBoardAlpha})`);
    document.documentElement.style.setProperty('--glass-board-border', `rgba(255, 255, 255, ${brdBoardAlpha})`);
    document.documentElement.style.setProperty('--glass-board-inset', `inset 0 0 20px -5px rgba(255, 255, 255, ${(0.12 * ratio).toFixed(3)}), inset 0 1px 1px rgba(255, 255, 255, ${(0.15 * ratio).toFixed(3)})`);
    document.documentElement.style.setProperty('--glass-board-highlight', `rgba(255, 255, 255, ${(0.1 * ratio).toFixed(3)})`);
    
    // Trigger SVG filter rebuild in case blur mapping or colors need propagation
    if (typeof LiquidGlassEffect !== 'undefined') LiquidGlassEffect.update();
  },

  applyBgBlur() {
    const bg = document.getElementById('wallpaper-bg');
    if (bg) {
      const intensity = DataManager.settings.blurIntensity || 0;
      if (intensity > 0) {
        bg.style.filter = `blur(${intensity}px) brightness(${Math.max(0.7, 1 - intensity * 0.008)})`;
        bg.style.transform = 'scale(1.05)';
      } else {
        bg.style.filter = '';
        bg.style.transform = '';
      }
    }
  },
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
