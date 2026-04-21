/* ============================================
   Charcoal - UI Rendering
   ============================================ */

const UI = {
  // Render page tabs
  renderTabs() {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';
    DataManager.data.pages.forEach(page => {
      const tab = document.createElement('button');
      tab.className = `page-tab${page.id === DataManager.data.activePageId ? ' active' : ''}`;
      tab.textContent = page.name;
      tab.dataset.pageId = page.id;
      tab.addEventListener('click', () => {
        DataManager.setActivePage(page.id);
        UI.renderTabs();
        UI.renderBoards();
      });
      tab.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (DataManager.data.pages.length <= 1) return;
        App.showContextMenu(e.clientX, e.clientY, 'page', page.id);
      });
      tab.addEventListener('dblclick', () => {
        const newName = prompt('Rename page:', page.name);
        if (newName && newName.trim()) {
          DataManager.renamePage(page.id, newName.trim());
          UI.renderTabs();
        }
      });
      tabsList.appendChild(tab);
    });
  },

  // Render boards for active page
  renderBoards() {
    const container = document.getElementById('boards-container');
    container.innerHTML = '';
    const activePage = DataManager.getActivePage();
    if (!activePage) return;

    activePage.boards.forEach((board, boardIdx) => {
      const card = document.createElement('div');
      card.className = 'board-card';
      card.dataset.boardId = board.id;
      card.draggable = true;
      card.style.animationDelay = `${boardIdx * 0.05}s`;

      // Board header
      const header = document.createElement('div');
      header.className = 'board-header';

      const title = document.createElement('span');
      title.className = 'board-title';
      title.textContent = board.name;

      const actions = document.createElement('div');
      actions.className = 'board-actions';

      // Edit board
      const editBtn = document.createElement('button');
      editBtn.className = 'board-action-btn';
      editBtn.title = 'Edit board';
      editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      editBtn.addEventListener('click', () => App.openEditBoardModal(board.id, board.name));

      // Delete board
      const delBtn = document.createElement('button');
      delBtn.className = 'board-action-btn';
      delBtn.title = 'Delete board';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        App.deleteBoard(activePage.id, board.id, board.name);
      });

      // Add bookmark
      const addBmBtn = document.createElement('button');
      addBmBtn.className = 'board-action-btn';
      addBmBtn.title = 'Add bookmark';
      addBmBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
      addBmBtn.addEventListener('click', () => App.openAddBookmarkModal(board.id));

      actions.appendChild(addBmBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      header.appendChild(title);
      header.appendChild(actions);
      card.appendChild(header);

      // Bookmarks
      const maxItems = DataManager.settings.hideExtra ? 5 : Infinity;
      board.bookmarks.slice(0, maxItems).forEach(bm => {
        const item = UI.createBookmarkElement(bm, board.id, activePage.id);
        card.appendChild(item);
      });

      if (DataManager.settings.hideExtra && board.bookmarks.length > 5) {
        const more = document.createElement('div');
        more.className = 'bookmark-item';
        more.style.cursor = 'default';
        more.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">+${board.bookmarks.length - 5} more</span>`;
        more.addEventListener('click', () => {
          DataManager.settings.hideExtra = false;
          DataManager.saveSettings();
          UI.renderBoards();
        });
        card.appendChild(more);
      }

      // Bottom element removed, bookmark button moved to header
      // Board drag events
      card.addEventListener('dragstart', (e) => {
        if (e.target.closest('.bookmark-item')) return;
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'board', boardId: board.id }));
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        try {
          const d = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (d.type === 'bookmark') {
            DataManager.moveBookmark(activePage.id, d.fromBoardId, d.bookmarkId, board.id);
            UI.renderBoards();
            App.showToast('Bookmark moved');
          } else if (d.type === 'board' && d.boardId !== board.id) {
            const boards = activePage.boards;
            const fromIdx = boards.findIndex(b => b.id === d.boardId);
            const toIdx = boards.findIndex(b => b.id === board.id);
            if (fromIdx > -1 && toIdx > -1) {
              const [moved] = boards.splice(fromIdx, 1);
              boards.splice(toIdx, 0, moved);
              DataManager.save();
              UI.renderBoards();
            }
          }
        } catch(err) {}
      });

      // Board context menu
      card.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.bookmark-item')) return;
        e.preventDefault();
        App.showContextMenu(e.clientX, e.clientY, 'board', board.id);
      });

      container.appendChild(card);
    });

    // Add Board card
    const addCard = document.createElement('div');
    addCard.className = 'add-board-card';
    addCard.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Board';
    addCard.addEventListener('click', () => App.openAddBoardModal());
    container.appendChild(addCard);

    // Apply compact mode
    if (DataManager.settings.compact) {
      container.classList.add('compact');
    } else {
      container.classList.remove('compact');
    }
  },

  // Create bookmark element
  createBookmarkElement(bm, boardId, pageId) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.bookmarkId = bm.id;
    item.dataset.boardId = boardId;
    item.draggable = true;

    // Favicon
    const faviconUrl = getFaviconUrl(bm.url);
    if (faviconUrl) {
      const img = document.createElement('img');
      img.className = 'bookmark-favicon';
      img.src = faviconUrl;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'bookmark-favicon-placeholder';
        placeholder.style.background = getFaviconColor(bm.title);
        placeholder.textContent = bm.title.charAt(0);
        img.replaceWith(placeholder);
      };
      item.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'bookmark-favicon-placeholder';
      placeholder.style.background = getFaviconColor(bm.title);
      placeholder.textContent = bm.title.charAt(0);
      item.appendChild(placeholder);
    }

    // Info
    const info = document.createElement('div');
    info.className = 'bookmark-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'bookmark-title';
    titleEl.textContent = DataManager.settings.shortenTitles && bm.title.length > 30
      ? bm.title.substring(0, 30) + '...' : bm.title;
    info.appendChild(titleEl);

    if (DataManager.settings.showDescriptions && bm.desc) {
      const descEl = document.createElement('div');
      descEl.className = 'bookmark-desc';
      descEl.textContent = bm.desc;
      info.appendChild(descEl);
    }
    item.appendChild(info);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const editBm = document.createElement('button');
    editBm.className = 'bookmark-action-btn';
    editBm.title = 'Edit';
    editBm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    editBm.addEventListener('click', (e) => {
      e.stopPropagation();
      App.openEditBookmarkModal(boardId, bm.id, bm.title, bm.url, bm.desc);
    });

    const delBm = document.createElement('button');
    delBm.className = 'bookmark-action-btn';
    delBm.title = 'Delete';
    delBm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    delBm.addEventListener('click', (e) => {
      e.stopPropagation();
      App.deleteBookmark(pageId, boardId, bm.id, bm.title);
    });

    actions.appendChild(editBm);
    actions.appendChild(delBm);
    item.appendChild(actions);

    // Click to open URL
    item.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-actions')) return;
      if (DataManager.settings.openNewTab) {
        window.open(bm.url, '_blank');
      } else {
        window.location.href = bm.url;
      }
    });

    // Drag events for bookmark
    item.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'bookmark', bookmarkId: bm.id, fromBoardId: boardId }));
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.add('drag-over-item');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over-item'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-over-item');
      try {
        const d = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (d.type === 'bookmark' && d.bookmarkId !== bm.id) {
          const page = DataManager.getActivePage();
          const toBoard = page.boards.find(b => b.id === boardId);
          const insertIdx = toBoard.bookmarks.findIndex(b => b.id === bm.id);
          DataManager.moveBookmark(page.id, d.fromBoardId, d.bookmarkId, boardId, insertIdx);
          UI.renderBoards();
        }
      } catch(err) {}
    });

    // Context menu
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      App.showContextMenu(e.clientX, e.clientY, 'bookmark', bm.id, boardId);
    });

    return item;
  },

  // Render wallpaper
  renderWallpaper() {
    const bg = document.getElementById('wallpaper-bg');
    let videoEl = document.getElementById('wallpaper-video');
    const wpId = DataManager.wallpaper;

    // Helper to hide both
    const hideAll = () => {
      bg.style.backgroundImage = 'none';
      if (videoEl) {
        videoEl.style.display = 'none';
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      }
    };

    if (wpId === 'default' || !wpId) {
      hideAll();
      return;
    }

    // Check custom wallpapers
    if (wpId.startsWith('custom_')) {
      const customId = wpId.replace('custom_', '');
      const custom = DataManager.customWallpapers.find(w => w.id === customId);
      if (custom) {
        if (custom.dataUrl.startsWith('data:video/')) {
          bg.style.backgroundImage = 'none';
          if (videoEl) {
             videoEl.style.display = 'block';
             if (videoEl.src !== custom.dataUrl) {
               videoEl.src = custom.dataUrl;
               videoEl.play().catch(e => console.error("Video play failed:", e));
             }
          }
        } else {
          hideAll();
          bg.style.backgroundImage = `url(${custom.dataUrl})`;
        }
        return;
      }
    }

    // Check builtin wallpapers
    hideAll();
    const allBuiltin = [...BUILTIN_WALLPAPERS.light, ...BUILTIN_WALLPAPERS.dark];
    const wp = allBuiltin.find(w => w.id === wpId);
    if (wp && wp.path) {
      bg.style.backgroundImage = `url(${wp.path})`;
    }
  },

  // Render style panel wallpapers
  renderWallpaperGrid() {
    const grid = document.getElementById('wallpaper-grid');
    const label = document.getElementById('wallpaper-section-label');
    grid.innerHTML = '';

    const theme = DataManager.theme;
    const wallpapers = BUILTIN_WALLPAPERS[theme] || BUILTIN_WALLPAPERS.light;
    label.textContent = theme === 'dark' ? 'DARK WALLPAPERS' : 'LIGHT WALLPAPERS';

    wallpapers.forEach(wp => {
      const option = document.createElement('div');
      option.className = `wallpaper-option${DataManager.wallpaper === wp.id ? ' active' : ''}`;
      if (wp.path) {
        option.style.backgroundImage = `url(${wp.path})`;
      } else {
        option.classList.add('wallpaper-default');
        option.textContent = 'Default';
      }
      option.addEventListener('click', () => {
        DataManager.wallpaper = wp.id;
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
        UI.renderCustomWallpapers();
      });
      grid.appendChild(option);
    });
  },

  // Render custom wallpapers
  renderCustomWallpapers() {
    const section = document.getElementById('custom-wallpapers-section');
    const grid = document.getElementById('custom-wallpaper-grid');
    grid.innerHTML = '';

    if (DataManager.customWallpapers.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    DataManager.customWallpapers.forEach(wp => {
      const option = document.createElement('div');
      option.className = `wallpaper-option${DataManager.wallpaper === 'custom_' + wp.id ? ' active' : ''}`;
      option.style.backgroundImage = `url(${wp.dataUrl})`;

      option.addEventListener('click', () => {
        DataManager.wallpaper = 'custom_' + wp.id;
        DataManager.saveWallpaper();
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
        UI.renderCustomWallpapers();
      });

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'wallpaper-delete';
      delBtn.innerHTML = '×';
      delBtn.title = 'Remove wallpaper';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DataManager.deleteCustomWallpaper(wp.id);
        UI.renderWallpaper();
        UI.renderWallpaperGrid();
        UI.renderCustomWallpapers();
        App.showToast('Wallpaper removed');
      });
      option.appendChild(delBtn);

      grid.appendChild(option);
    });
  },

  // Render trash
  renderTrash() {
    const container = document.getElementById('trash-items');
    container.innerHTML = '';
    if (DataManager.trash.length === 0) {
      container.innerHTML = '<p class="trash-empty">Trash is empty</p>';
      return;
    }
    DataManager.trash.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'trash-item';
      el.innerHTML = `
        <div class="trash-item-info">
          <div class="trash-item-title">${item.data.title || item.data.name || 'Untitled'}</div>
          <div class="trash-item-type">${item.type} • ${new Date(item.deletedAt).toLocaleDateString()}</div>
        </div>
        <div class="trash-item-actions">
          <button class="trash-restore-btn" title="Restore" data-idx="${idx}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button class="trash-delete-btn" title="Delete permanently" data-idx="${idx}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;
      container.appendChild(el);
    });

    container.querySelectorAll('.trash-restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DataManager.restoreFromTrash(parseInt(btn.dataset.idx));
        UI.renderTrash();
        UI.renderBoards();
        UI.renderTabs();
        App.showToast('Item restored');
      });
    });
    container.querySelectorAll('.trash-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        DataManager.deleteFromTrash(parseInt(btn.dataset.idx));
        UI.renderTrash();
        App.showToast('Permanently deleted');
      });
    });
  },

  // Render search results
  renderSearchResults(query) {
    const container = document.getElementById('search-results');
    if (!query.trim()) {
      container.classList.remove('has-results');
      container.innerHTML = '';
      return;
    }
    const results = DataManager.searchBookmarks(query);
    if (results.length === 0) {
      container.classList.add('has-results');
      container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);">No results found</div>';
      return;
    }
    container.classList.add('has-results');
    container.innerHTML = '';
    results.forEach(bm => {
      const item = document.createElement('a');
      item.className = 'search-result-item';
      item.href = bm.url;
      item.target = DataManager.settings.openNewTab ? '_blank' : '_self';
      const faviconUrl = getFaviconUrl(bm.url);
      item.innerHTML = `
        ${faviconUrl ? `<img class="bookmark-favicon" src="${faviconUrl}" alt="" loading="lazy">` :
          `<div class="bookmark-favicon-placeholder" style="background:${getFaviconColor(bm.title)}">${bm.title.charAt(0)}</div>`}
        <div class="search-result-info">
          <div class="search-result-title">${UI.highlightText(bm.title, query)}</div>
          <div class="search-result-url">${bm.url}</div>
        </div>
      `;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (DataManager.settings.openNewTab) { window.open(bm.url, '_blank'); }
        else { window.location.href = bm.url; }
      });
      container.appendChild(item);
    });
  },

  highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  applyTheme() {
    document.documentElement.setAttribute('data-theme', DataManager.theme);
    document.getElementById('theme-dark').classList.toggle('active', DataManager.theme === 'dark');
    document.getElementById('theme-light').classList.toggle('active', DataManager.theme === 'light');
  },

  applySettings() {
    const s = DataManager.settings;
    // General
    document.getElementById('setting-compact').checked = s.compact;
    document.getElementById('setting-hide-extra').checked = s.hideExtra;
    document.getElementById('setting-shorten').checked = s.shortenTitles;
    document.getElementById('setting-new-tab').checked = s.openNewTab;
    document.getElementById('setting-descriptions').checked = s.showDescriptions;
    document.getElementById('setting-confirm-delete').checked = s.confirmDelete;
    // Greeting
    const greetToggle = document.getElementById('setting-show-greeting');
    if (greetToggle) greetToggle.checked = s.showGreeting !== false;
    const greetName = document.getElementById('setting-greeting-name');
    if (greetName) greetName.value = s.greetingName || '';
    // Time
    const timeToggle = document.getElementById('setting-show-time');
    if (timeToggle) timeToggle.checked = s.showTime !== false;
    const timeFmt = document.getElementById('setting-time-format');
    if (timeFmt) timeFmt.value = s.timeFormat || '24';
    const secToggle = document.getElementById('setting-show-seconds');
    if (secToggle) secToggle.checked = s.showSeconds || false;
    // Date
    const dateToggle = document.getElementById('setting-show-date');
    if (dateToggle) dateToggle.checked = s.showDate !== false;
    const dateFmt = document.getElementById('setting-date-format');
    if (dateFmt) dateFmt.value = s.dateFormat || 'long';
    const dayToggle = document.getElementById('setting-show-day');
    if (dayToggle) dayToggle.checked = s.showDay !== false;
    // Quote
    const quoteToggle = document.getElementById('setting-show-quote');
    if (quoteToggle) quoteToggle.checked = s.showQuote !== false;
    const customQuote = document.getElementById('setting-custom-quote');
    if (customQuote) customQuote.value = s.customQuote || '';
    // Weather
    const weatherToggle = document.getElementById('setting-show-weather');
    if (weatherToggle) weatherToggle.checked = s.showWeather || false;
    const weatherLoc = document.getElementById('setting-weather-location');
    if (weatherLoc) weatherLoc.value = s.weatherLocation || '';
    const weatherUnit = document.getElementById('setting-weather-unit');
    if (weatherUnit) weatherUnit.value = s.weatherUnit || 'C';
    // Appearance
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) themeSelect.value = s.themeMode || 'dark';
    const blurSlider = document.getElementById('setting-blur-intensity');
    const blurLabel = document.getElementById('blur-value-label');
    if (blurSlider) {
      const blurVal = s.blurIntensity || 0;
      blurSlider.value = blurVal;
      if (blurLabel) blurLabel.textContent = blurVal + 'px';
    }
    const opacitySlider = document.getElementById('setting-glass-opacity');
    const opacityLabel = document.getElementById('glass-opacity-value-label');
    if (opacitySlider) {
      const opacityVal = s.glassOpacity !== undefined ? s.glassOpacity : 100;
      opacitySlider.value = opacityVal;
      if (opacityLabel) opacityLabel.textContent = opacityVal + '%';
    }
    const fillOpacitySlider = document.getElementById('setting-glass-fill-opacity');
    const fillOpacityLabel = document.getElementById('glass-fill-opacity-value-label');
    if (fillOpacitySlider) {
      const fillOpacityVal = s.glassFillOpacity !== undefined ? s.glassFillOpacity : 55;
      fillOpacitySlider.value = fillOpacityVal;
      if (fillOpacityLabel) fillOpacityLabel.textContent = fillOpacityVal + '%';
    }
    // Widgets
    const pinnedToggle = document.getElementById('setting-show-pinned');
    if (pinnedToggle) pinnedToggle.checked = s.showPinnedSites !== false;
    const recentTabsToggle = document.getElementById('setting-show-recent-tabs');
    if (recentTabsToggle) recentTabsToggle.checked = s.showRecentTabs !== false;
    const liquidGlassToggle = document.getElementById('setting-liquid-glass');
    if (liquidGlassToggle) liquidGlassToggle.checked = s.liquidGlass !== false;
    // Advanced
    const tabName = document.getElementById('setting-tab-name');
    if (tabName) tabName.value = s.tabName || 'Charcoal';

    if (s.compact) document.body.classList.add('compact');
    else document.body.classList.remove('compact');

    // Apply liquid glass body class
    if (s.liquidGlass !== false) document.body.classList.add('liquid-glass-active');
    else document.body.classList.remove('liquid-glass-active');
  },

  // ==================== Pinned Sites ====================
  renderPinnedSites() {
    const container = document.getElementById('pinned-sites');
    if (!container) return;
    container.innerHTML = '';
    const s = DataManager.settings;

    if (s.showPinnedSites === false || !s.pinnedSites || s.pinnedSites.length === 0) {
      container.classList.add('hidden-widget');
      return;
    }
    container.classList.remove('hidden-widget');

    s.pinnedSites.forEach(site => {
      const icon = document.createElement('a');
      icon.className = 'pinned-site-icon';
      icon.href = site.url;
      icon.title = site.title;
      icon.target = '_blank';
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        if (DataManager.settings.openNewTab) window.open(site.url, '_blank');
        else window.location.href = site.url;
      });

      // Use favicon from Google
      const img = document.createElement('img');
      const faviconUrl = getFaviconUrl(site.url);
      img.src = faviconUrl || '';
      img.alt = site.title;
      img.onerror = () => {
        // Fallback to letter placeholder
        img.remove();
        const letter = document.createElement('div');
        letter.style.cssText = 'font-size:20px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;z-index:1;';
        letter.textContent = site.title.charAt(0).toUpperCase();
        icon.appendChild(letter);
      };
      icon.appendChild(img);
      container.appendChild(icon);
    });
  },

  // ==================== Recently Closed Tabs ====================
  renderRecentTabs() {
    const bar = document.getElementById('recent-tabs-bar');
    const list = document.getElementById('recent-tabs-list');
    if (!bar || !list) return;

    const s = DataManager.settings;
    if (s.showRecentTabs === false) {
      bar.classList.add('hidden-widget');
      return;
    }
    bar.classList.remove('hidden-widget');
    list.innerHTML = '';

    // Try using chrome.sessions API
    if (typeof chrome !== 'undefined' && chrome.sessions && chrome.sessions.getRecentlyClosed) {
      chrome.sessions.getRecentlyClosed({ maxResults: 25 }, (sessions) => {
        const seen = new Set();
        const recentTabs = [];

        for (const session of sessions) {
          if (recentTabs.length >= 12) break;
          // Extract tab from either session.tab or windows containing tabs
          if (session.tab) {
            const t = session.tab;
            if (t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://') && !seen.has(t.url)) {
              seen.add(t.url);
              recentTabs.push({ ...t, restoreSessionId: t.sessionId });
            }
          } else if (session.window && session.window.tabs) {
            for (const t of session.window.tabs) {
              if (recentTabs.length >= 12) break;
              if (t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://') && !seen.has(t.url)) {
                seen.add(t.url);
                recentTabs.push({ ...t, restoreSessionId: session.window.sessionId });
              }
            }
          }
        }

        if (recentTabs.length === 0) {
          bar.classList.add('hidden-widget');
          return;
        }

        recentTabs.forEach(tab => {
          const item = document.createElement('a');
          item.className = 'recent-tab-item';
          item.href = tab.url;
          item.title = tab.title || tab.url;
          item.addEventListener('click', (e) => {
            e.preventDefault();
            if (tab.restoreSessionId) {
              chrome.sessions.restore(tab.restoreSessionId, () => {
                UI.renderRecentTabs();
              });
            } else {
              chrome.tabs.create({ url: tab.url });
            }
          });

          const favicon = document.createElement('img');
          favicon.src = tab.favIconUrl || getFaviconUrl(tab.url) || '';
          favicon.alt = '';
          favicon.onerror = () => {
            favicon.src = getFaviconUrl(tab.url) || '';
            favicon.onerror = null;
          };

          const title = document.createElement('span');
          title.className = 'recent-tab-title';
          title.textContent = tab.title || new URL(tab.url).hostname || 'Unknown';

          item.appendChild(favicon);
          item.appendChild(title);
          list.appendChild(item);
        });
      });
    } else {
      // Fallback: show demo recently closed tabs for non-extension mode
      const demoTabs = [
        { title: 'GitHub', url: 'https://github.com' },
        { title: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { title: 'YouTube', url: 'https://youtube.com' },
        { title: 'Google Search', url: 'https://google.com' },
        { title: 'Reddit', url: 'https://reddit.com' },
        { title: 'Twitter / X', url: 'https://x.com' },
        { title: 'ChatGPT', url: 'https://chat.openai.com' },
        { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
      ];

      demoTabs.forEach(tab => {
        const item = document.createElement('a');
        item.className = 'recent-tab-item';
        item.href = tab.url;
        item.title = tab.title;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          if (DataManager.settings.openNewTab) window.open(tab.url, '_blank');
          else window.location.href = tab.url;
        });

        const favicon = document.createElement('img');
        favicon.src = getFaviconUrl(tab.url) || '';
        favicon.alt = '';

        const title = document.createElement('span');
        title.className = 'recent-tab-title';
        title.textContent = tab.title;

        item.appendChild(favicon);
        item.appendChild(title);
        list.appendChild(item);
      });
    }
  },



  // ==================== Manage Pinned Sites ====================
  renderManagePinnedSites() {
    const container = document.getElementById('pinned-sites-list');
    if (!container) return;
    container.innerHTML = '';
    const sites = DataManager.settings.pinnedSites || [];

    if (sites.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No pinned sites yet. Add one below.</p>';
      return;
    }

    sites.forEach((site, idx) => {
      const el = document.createElement('div');
      el.className = 'pinned-manage-item';

      const favicon = document.createElement('img');
      favicon.src = getFaviconUrl(site.url) || '';
      favicon.alt = '';
      favicon.onerror = () => {
        const ph = document.createElement('div');
        ph.className = 'bookmark-favicon-placeholder';
        ph.style.background = getFaviconColor(site.title);
        ph.style.width = '24px';
        ph.style.height = '24px';
        ph.textContent = site.title.charAt(0);
        favicon.replaceWith(ph);
      };

      const info = document.createElement('div');
      info.className = 'pinned-manage-info';
      info.innerHTML = `<div class="pinned-manage-title">${site.title}</div><div class="pinned-manage-url">${site.url}</div>`;

      const delBtn = document.createElement('button');
      delBtn.className = 'pinned-manage-delete';
      delBtn.title = 'Remove';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      delBtn.addEventListener('click', () => {
        DataManager.settings.pinnedSites.splice(idx, 1);
        DataManager.saveSettings();
        UI.renderManagePinnedSites();
        UI.renderPinnedSites();
      });

      el.appendChild(favicon);
      el.appendChild(info);
      el.appendChild(delBtn);
      container.appendChild(el);
    });
  },
};
