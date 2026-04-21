/* ============================================
   Charcoal - Data Layer
   Storage, CRUD, Default Data
   ============================================ */

const STORAGE_KEY = 'charcoal_data';
const SETTINGS_KEY = 'charcoal_settings';
const THEME_KEY = 'charcoal_theme';
const WALLPAPER_KEY = 'charcoal_wallpaper';
const CUSTOM_WP_KEY = 'charcoal_custom_wallpapers';
const TRASH_KEY = 'charcoal_trash';

// Favicon colors for placeholders
const FAVICON_COLORS = [
  '#e53e3e','#dd6b20','#d69e2e','#38a169','#319795',
  '#3182ce','#5a67d8','#805ad5','#d53f8c','#e53e3e'
];

function getFaviconColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FAVICON_COLORS[Math.abs(hash) % FAVICON_COLORS.length];
}

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch { return null; }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Built-in wallpapers
const BUILTIN_WALLPAPERS = {
  light: [
    { id: 'default', name: 'Default', path: null },
    { id: '10040', name: 'Wallpaper 10040', path: 'wallpapers/10040.jpg' },
    { id: '10042', name: 'Wallpaper 10042', path: 'wallpapers/10042.jpg' },
    { id: '10046', name: 'Wallpaper 10046', path: 'wallpapers/10046.jpg' },
    { id: '10047', name: 'Wallpaper 10047', path: 'wallpapers/10047.jpg' },
    { id: '10048', name: 'Wallpaper 10048', path: 'wallpapers/10048.jpg' },
    { id: '10049', name: 'Wallpaper 10049', path: 'wallpapers/10049.jpg' },
    { id: '10050', name: 'Wallpaper 10050', path: 'wallpapers/10050.jpg' },
    { id: '10051', name: 'Wallpaper 10051', path: 'wallpapers/10051.jpg' },
    { id: '10052', name: 'Wallpaper 10052', path: 'wallpapers/10052.jpg' },
    { id: '10053', name: 'Wallpaper 10053', path: 'wallpapers/10053.jpg' },
    { id: '10055', name: 'Wallpaper 10055', path: 'wallpapers/10055.jpg' },
    { id: '10056', name: 'Wallpaper 10056', path: 'wallpapers/10056.jpg' },
  ],
  dark: [
    { id: 'default', name: 'Default', path: null },
    { id: '10057', name: 'Wallpaper 10057', path: 'wallpapers/10057.jpg' },
    { id: '10065', name: 'Wallpaper 10065', path: 'wallpapers/10065.jpg' },
    { id: '10066', name: 'Wallpaper 10066', path: 'wallpapers/10066.jpg' },
    { id: '10068', name: 'Wallpaper 10068', path: 'wallpapers/10068.jpg' },
    { id: '10070', name: 'Wallpaper 10070', path: 'wallpapers/10070.jpg' },
    { id: '10077', name: 'Wallpaper 10077', path: 'wallpapers/10077.jpg' },
    { id: '10079', name: 'Wallpaper 10079', path: 'wallpapers/10079.jpg' },
    { id: '10097', name: 'Wallpaper 10097', path: 'wallpapers/10097.jpg' },
    { id: '10098', name: 'Wallpaper 10098', path: 'wallpapers/10098.jpg' },
    { id: '10110', name: 'Wallpaper 10110', path: 'wallpapers/10110.jpg' },
    { id: '10116', name: 'Wallpaper 10116', path: 'wallpapers/10116.jpg' },
    { id: '10127', name: 'Wallpaper 10127', path: 'wallpapers/10127.jpg' },
  ]
};

// Default sample data
function getDefaultData() {
  return {
    pages: [
      {
        id: 'home',
        name: 'Home',
        boards: [
          {
            id: generateId(),
            name: 'My Workspace',
            bookmarks: [
              { id: generateId(), title: 'Gmail', url: 'https://mail.google.com', desc: 'Primary inbox for client and team communication.' },
              { id: generateId(), title: 'ChatGPT', url: 'https://chat.openai.com', desc: 'Brainstorming, writing help, debugging, and quick research.' },
              { id: generateId(), title: 'Google Docs', url: 'https://docs.google.com', desc: 'Draft and edit shared documents with collaborators.' },
              { id: generateId(), title: 'Google Drive', url: 'https://drive.google.com', desc: 'Cloud storage for files and shared assets.' },
            ]
          },
          {
            id: generateId(),
            name: 'AI Tools',
            bookmarks: [
              { id: generateId(), title: 'ChatGPT', url: 'https://chat.openai.com', desc: '' },
              { id: generateId(), title: 'Claude', url: 'https://claude.ai', desc: '' },
              { id: generateId(), title: 'Perplexity', url: 'https://perplexity.ai', desc: '' },
              { id: generateId(), title: 'Midjourney', url: 'https://midjourney.com', desc: '' },
              { id: generateId(), title: 'DALL-E', url: 'https://labs.openai.com', desc: '' },
              { id: generateId(), title: 'Gemini', url: 'https://gemini.google.com', desc: '' },
            ]
          },
          {
            id: generateId(),
            name: 'Communication',
            bookmarks: [
              { id: generateId(), title: 'Slack', url: 'https://slack.com', desc: '' },
              { id: generateId(), title: 'Discord', url: 'https://discord.com', desc: '' },
              { id: generateId(), title: 'WhatsApp Web', url: 'https://web.whatsapp.com', desc: '' },
              { id: generateId(), title: 'Microsoft Teams', url: 'https://teams.microsoft.com', desc: '' },
            ]
          },
          {
            id: generateId(),
            name: 'Search Engines',
            bookmarks: [
              { id: generateId(), title: 'Google', url: 'https://google.com', desc: '' },
              { id: generateId(), title: 'Bing', url: 'https://bing.com', desc: '' },
              { id: generateId(), title: 'DuckDuckGo', url: 'https://duckduckgo.com', desc: '' },
              { id: generateId(), title: 'Brave Search', url: 'https://search.brave.com', desc: '' },
            ]
          },
          {
            id: generateId(),
            name: 'Social Media',
            bookmarks: [
              { id: generateId(), title: 'Instagram', url: 'https://instagram.com', desc: '' },
              { id: generateId(), title: 'Twitter / X', url: 'https://x.com', desc: '' },
              { id: generateId(), title: 'LinkedIn', url: 'https://linkedin.com', desc: '' },
              { id: generateId(), title: 'Reddit', url: 'https://reddit.com', desc: '' },
            ]
          },
          {
            id: generateId(),
            name: 'Cloud Storage',
            bookmarks: [
              { id: generateId(), title: 'Google Drive', url: 'https://drive.google.com', desc: '' },
              { id: generateId(), title: 'Dropbox', url: 'https://dropbox.com', desc: '' },
              { id: generateId(), title: 'OneDrive', url: 'https://onedrive.live.com', desc: '' },
              { id: generateId(), title: 'iCloud', url: 'https://icloud.com', desc: '' },
            ]
          },
        ]
      }
    ],
    activePageId: 'home'
  };
}

function getDefaultSettings() {
  return {
    compact: false,
    hideExtra: false,
    shortenTitles: true,
    openNewTab: true,
    showDescriptions: true,
    confirmDelete: true,
    // Greeting
    showGreeting: true,
    greetingName: '',
    // Time
    showTime: true,
    timeFormat: '24',
    showSeconds: false,
    // Date
    showDate: true,
    dateFormat: 'long',
    showDay: true,
    // Quote
    showQuote: true,
    customQuote: '',
    // Weather
    showWeather: false,
    weatherLocation: '',
    weatherUnit: 'C',
    // Appearance
    themeMode: 'dark', // light, dark, auto
    bgBlur: false,
    // Pinned Sites
    showPinnedSites: true,
    pinnedSites: [
      { id: 'yt', title: 'YouTube', url: 'https://youtube.com', icon: 'youtube' },
      { id: 'sp', title: 'Spotify', url: 'https://open.spotify.com', icon: 'spotify' },
      { id: 'gg', title: 'Google', url: 'https://google.com', icon: 'google' },
      { id: 'gm', title: 'Gemini', url: 'https://gemini.google.com', icon: 'gemini' },
    ],
    // Recently Closed Tabs
    showRecentTabs: true,
    // Glass Borders
    showGlassBorders: true,
    // Liquid Glass
    liquidGlass: true,
    glassOpacity: 100,
    glassFillOpacity: 55,
    // Advanced
    tabName: 'Charcoal',
  };
}

// Storage helpers using chrome.storage.local if available, else localStorage
const Storage = {
  async get(key, fallback) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => {
          chrome.storage.local.get([key], result => {
            resolve(result[key] !== undefined ? result[key] : fallback);
          });
        });
      }
    } catch(e) {}
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  },
  async set(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => {
          chrome.storage.local.set({ [key]: value }, resolve);
        });
      }
    } catch(e) {}
    localStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise(resolve => {
          chrome.storage.local.remove([key], resolve);
        });
      }
    } catch(e) {}
    localStorage.removeItem(key);
  }
};

// Data manager
const DataManager = {
  data: null,
  settings: null,
  theme: 'light',
  wallpaper: '10040',
  customWallpapers: [],
  trash: [],

  async init() {
    this.data = await Storage.get(STORAGE_KEY, null);
    if (!this.data) {
      this.data = getDefaultData();
      await this.save();
    }
    this.settings = await Storage.get(SETTINGS_KEY, getDefaultSettings());
    this.theme = await Storage.get(THEME_KEY, 'light');
    this.wallpaper = await Storage.get(WALLPAPER_KEY, '10040');
    this.customWallpapers = await Storage.get(CUSTOM_WP_KEY, []);
    this.trash = await Storage.get(TRASH_KEY, []);
  },

  async save() { await Storage.set(STORAGE_KEY, this.data); },
  async saveSettings() { await Storage.set(SETTINGS_KEY, this.settings); },
  async saveTheme() { await Storage.set(THEME_KEY, this.theme); },
  async saveWallpaper() { await Storage.set(WALLPAPER_KEY, this.wallpaper); },
  async saveCustomWallpapers() { await Storage.set(CUSTOM_WP_KEY, this.customWallpapers); },
  async saveTrash() { await Storage.set(TRASH_KEY, this.trash); },

  getActivePage() {
    return this.data.pages.find(p => p.id === this.data.activePageId) || this.data.pages[0];
  },

  setActivePage(pageId) {
    this.data.activePageId = pageId;
    this.save();
  },

  addPage(name) {
    const page = { id: generateId(), name, boards: [] };
    this.data.pages.push(page);
    this.data.activePageId = page.id;
    this.save();
    return page;
  },

  renamePage(pageId, name) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) { page.name = name; this.save(); }
  },

  deletePage(pageId) {
    const idx = this.data.pages.findIndex(p => p.id === pageId);
    if (idx > -1 && this.data.pages.length > 1) {
      const page = this.data.pages.splice(idx, 1)[0];
      this.trash.push({ type: 'page', data: page, deletedAt: Date.now() });
      this.saveTrash();
      if (this.data.activePageId === pageId) {
        this.data.activePageId = this.data.pages[0].id;
      }
      this.save();
    }
  },

  addBoard(pageId, name) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const board = { id: generateId(), name, bookmarks: [] };
      page.boards.push(board);
      this.save();
      return board;
    }
  },

  renameBoard(pageId, boardId, name) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const board = page.boards.find(b => b.id === boardId);
      if (board) { board.name = name; this.save(); }
    }
  },

  deleteBoard(pageId, boardId) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const idx = page.boards.findIndex(b => b.id === boardId);
      if (idx > -1) {
        const board = page.boards.splice(idx, 1)[0];
        this.trash.push({ type: 'board', data: board, pageId, deletedAt: Date.now() });
        this.saveTrash();
        this.save();
      }
    }
  },

  addBookmark(pageId, boardId, title, url, desc = '') {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const board = page.boards.find(b => b.id === boardId);
      if (board) {
        const bm = { id: generateId(), title, url, desc };
        board.bookmarks.push(bm);
        this.save();
        return bm;
      }
    }
  },

  editBookmark(pageId, boardId, bookmarkId, title, url, desc) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const board = page.boards.find(b => b.id === boardId);
      if (board) {
        const bm = board.bookmarks.find(b => b.id === bookmarkId);
        if (bm) { bm.title = title; bm.url = url; bm.desc = desc; this.save(); }
      }
    }
  },

  deleteBookmark(pageId, boardId, bookmarkId) {
    const page = this.data.pages.find(p => p.id === pageId);
    if (page) {
      const board = page.boards.find(b => b.id === boardId);
      if (board) {
        const idx = board.bookmarks.findIndex(b => b.id === bookmarkId);
        if (idx > -1) {
          const bm = board.bookmarks.splice(idx, 1)[0];
          this.trash.push({ type: 'bookmark', data: bm, pageId, boardId, deletedAt: Date.now() });
          this.saveTrash();
          this.save();
        }
      }
    }
  },

  moveBookmark(fromPageId, fromBoardId, bookmarkId, toBoardId, insertIndex) {
    const page = this.data.pages.find(p => p.id === fromPageId);
    if (!page) return;
    const fromBoard = page.boards.find(b => b.id === fromBoardId);
    const toBoard = page.boards.find(b => b.id === toBoardId);
    if (!fromBoard || !toBoard) return;
    const idx = fromBoard.bookmarks.findIndex(b => b.id === bookmarkId);
    if (idx === -1) return;
    const [bm] = fromBoard.bookmarks.splice(idx, 1);
    if (insertIndex !== undefined) {
      toBoard.bookmarks.splice(insertIndex, 0, bm);
    } else {
      toBoard.bookmarks.push(bm);
    }
    this.save();
  },

  restoreFromTrash(trashIndex) {
    const item = this.trash[trashIndex];
    if (!item) return;
    if (item.type === 'page') {
      this.data.pages.push(item.data);
    } else if (item.type === 'board') {
      const page = this.data.pages.find(p => p.id === item.pageId);
      if (page) page.boards.push(item.data);
    } else if (item.type === 'bookmark') {
      const page = this.data.pages.find(p => p.id === item.pageId);
      if (page) {
        const board = page.boards.find(b => b.id === item.boardId);
        if (board) board.bookmarks.push(item.data);
      }
    }
    this.trash.splice(trashIndex, 1);
    this.save();
    this.saveTrash();
  },

  emptyTrash() {
    this.trash = [];
    this.saveTrash();
  },

  deleteFromTrash(trashIndex) {
    this.trash.splice(trashIndex, 1);
    this.saveTrash();
  },

  addCustomWallpaper(dataUrl) {
    const wp = { id: generateId(), dataUrl };
    this.customWallpapers.push(wp);
    this.saveCustomWallpapers();
    return wp;
  },

  deleteCustomWallpaper(wpId) {
    this.customWallpapers = this.customWallpapers.filter(w => w.id !== wpId);
    if (this.wallpaper === 'custom_' + wpId) {
      this.wallpaper = 'default';
      this.saveWallpaper();
    }
    this.saveCustomWallpapers();
  },

  exportData() {
    return JSON.stringify({ data: this.data, settings: this.settings, theme: this.theme, wallpaper: this.wallpaper }, null, 2);
  },

  async importData(jsonStr) {
    try {
      const imported = JSON.parse(jsonStr);
      if (imported.data) { this.data = imported.data; await this.save(); }
      if (imported.settings) { this.settings = imported.settings; await this.saveSettings(); }
      if (imported.theme) { this.theme = imported.theme; await this.saveTheme(); }
      if (imported.wallpaper) { this.wallpaper = imported.wallpaper; await this.saveWallpaper(); }
      return true;
    } catch { return false; }
  },

  async importChromeBookmarks() {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return false;
    return new Promise(resolve => {
      chrome.bookmarks.getTree(tree => {
        const page = this.getActivePage();
        const processNode = (node, parentName) => {
          if (node.url) return { id: generateId(), title: node.title || 'Untitled', url: node.url, desc: '' };
          if (node.children && node.children.length > 0) {
            const boardName = node.title || parentName || 'Bookmarks';
            const bookmarks = [];
            const subFolders = [];
            node.children.forEach(child => {
              if (child.url) { bookmarks.push({ id: generateId(), title: child.title || 'Untitled', url: child.url, desc: '' }); }
              else if (child.children) { subFolders.push(child); }
            });
            if (bookmarks.length > 0) {
              page.boards.push({ id: generateId(), name: boardName, bookmarks });
            }
            subFolders.forEach(sf => processNode(sf, sf.title));
          }
        };
        tree.forEach(root => { if (root.children) root.children.forEach(c => processNode(c, c.title)); });
        this.save();
        resolve(true);
      });
    });
  },

  async resetAll() {
    this.data = getDefaultData();
    this.settings = getDefaultSettings();
    this.theme = 'light';
    this.wallpaper = '10040';
    this.trash = [];
    await this.save();
    await this.saveSettings();
    await this.saveTheme();
    await this.saveWallpaper();
    await this.saveTrash();
  },

  getAllBookmarks() {
    const all = [];
    this.data.pages.forEach(page => {
      page.boards.forEach(board => {
        board.bookmarks.forEach(bm => {
          all.push({ ...bm, boardName: board.name, boardId: board.id, pageName: page.name, pageId: page.id });
        });
      });
    });
    return all;
  },

  searchBookmarks(query) {
    const q = query.toLowerCase();
    return this.getAllBookmarks().filter(bm =>
      bm.title.toLowerCase().includes(q) || bm.url.toLowerCase().includes(q) || (bm.desc && bm.desc.toLowerCase().includes(q))
    );
  }
};
