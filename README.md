# Charcoal - Smart Bookmark Manager

Charcoal is a beautiful, highly customizable Chrome extension that transforms your new tab page into a powerful bookmark manager and personal dashboard. It features rich organization tools like pages and boards, drag-and-drop support, dark/light themes, and various widget integrations.

## 🌟 Key Features

*   **Advanced Bookmark Organization**: Group your bookmarks into nested hierarchical structures (Pages > Boards > Bookmarks).
*   **Drag & Drop Management**: Easily move bookmarks and boards around to organize them visually.
*   **Aesthetics & Customization**: 
    *   Light, Dark, and Auto (System) themes.
    *   Beautiful built-in wallpapers and support for custom wallpaper uploads.
    *   Adjustable background blur and "liquid glass" frosted effects.
*   **Interactive Widgets**:
    *   **Clock & Date**: Customizable time format, date, and personalized greetings.
    *   **Quotes**: Inspirational quotes (random or customized).
    *   **Weather**: Live weather based on specified location.
    *   **Pinned Sites**: Quick access shortcuts below the clock.
    *   **Recently Closed Tabs**: Shows recently closed tabs.
*   **Data Management**: 
    *   Import and export your data as JSON backups.
    *   One-click import from Chrome's native bookmarks.
    *   Safe deletion with a dedicated Trash bin (restore or permanently delete).
*   **Privacy & Incognito Forms**: Privacy blur mode to mask sensitive info easily.

---

## 📁 File Structure & Overview

### 1. The Core Extension Files

*   **`manifest.json`**
    The configuration file required for all Chrome extensions (Manifest V3). It defines the extension's name ("Charcoal"), version, requested permissions (`storage`, `bookmarks`, `tabs`), and tells Chrome to override the default new tab page with `newtab.html`.

*   **`newtab.html`**
    The main architectural markup of the extension. It contains the structure for:
    *   Background and layout containers (`#wallpaper-bg`, `#boards-container`).
    *   Widgets (`#clock-widget`, `#quote-widget`, `#pinned-sites`, `#recent-tabs-bar`).
    *   Overlays and Modals (Search, Style panel, Settings, Add/Edit item modals).
    *   The floating toolbar (Search, Import/Export, Incognito, Trash, Privacy, Settings).

*   **`styles.css`**
    The stylesheet powering the visual aesthetics. Handles responsive design, the "liquid glass" UI effect, CSS variables for theming (dark vs. light mode), modal animations, widget placements, and custom scrollbars.

### 2. The Logic Layer

The Javascript logic is separated into three distinct files to maintain clean architecture:

*   **`data.js` (The Data & Storage Layer)**
    Handles state management, storage, and data structures.
    *   Wraps `chrome.storage.local` with a fallback to standard `localStorage`.
    *   Manages the CRUD operations for Pages, Boards, and Bookmarks.
    *   Stores and updates user Settings, Themes, Custom Wallpapers, and the Trash bin.
    *   Provides built-in default dashboard data on first load.
    *   Handles importing native Chrome bookmarks and generating unique IDs.

*   **`ui.js` (The Presentation Layer)**
    Handles the dynamic rendering of DOM elements based on data.
    *   Contains the `UI` object.
    *   Dynamically builds the bookmark DOM nodes (`createBookmarkElement()`).
    *   Renders the boards, pages/tabs, trash, pinned sites, and search results.
    *   Applies the theme colors and renders the current active wallpaper.

*   **`app.js` (The Event & Controller Layer)**
    The central coordinator tying the Data and UI layers together.
    *   Initializes the app lifecycle (`App.init()`).
    *   Binds event listeners for all clicks, inputs, modals, and settings toggles.
    *   Manages the drag-and-drop event cycles.
    *   Controls widget logic (updating the live clock, dates, toggling visibility based on settings).
    *   Handles context menus and triggers the custom toast notification system.

### 3. Other Assets

*   **`icons/`**
    Contains the extension's icon images in various sizes (16x16, 48x48, 128x128) as defined in the manifest.
*   **`wallpapers/`**
    Contains the built-in default high-resolution background options organized by theme (e.g., `clouds_car.png`, `night_sky.png`).
*   **`GSD-STYLE.md`**
    A style guide document related to AI development patterns (specifically for meta-prompting and the "GSD" workflow system). Unrelated to extension runtime implementation.

---

## 🚀 How to Run Locally (Developer Mode)

1. Open your Chromium-based browser (Chrome, Edge, Brave).
2. Navigate to `chrome://extensions/` (or equivalent).
3. Enable **Developer mode** (usually a toggle in the top-right corner).
4. Click **Load unpacked** and select the `new_tab` folder containing these files.
5. Open a new tab to see your Charcoal dashboard in action.
