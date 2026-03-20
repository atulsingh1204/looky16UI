/* ═══════════════════════════════════════════════
   APPS.JS — App grid / list + search
═══════════════════════════════════════════════ */

window.AppsData = [
  {
    id: 'magnifier', name: 'Magnifier', desc: 'Zoom and enhance any view',
    screen: 'magnifier', category: 'vision',
    icon: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" stroke-width="2"/><line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="2"/><line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'distance', name: 'Distance Camera', desc: 'View objects far away',
    screen: null, category: 'vision', emoji: '🔭'
  },
  {
    id: 'gallery', name: 'Gallery', desc: 'Browse your photos & images',
    screen: null, category: 'media', emoji: '🖼️'
  },
  {
    id: 'browser', name: 'Browser', desc: 'Accessible web browsing',
    screen: null, category: 'internet', emoji: '🌐'
  },
  {
    id: 'calculator', name: 'Calculator', desc: 'Simple calculations',
    screen: null, category: 'tools', emoji: '🔢'
  },
  {
    id: 'calendar', name: 'Calendar', desc: 'View dates and events',
    screen: null, category: 'tools', emoji: '📅'
  },
  {
    id: 'flashlight', name: 'Flash Light', desc: 'Use as a torch',
    screen: null, category: 'tools', emoji: '🔦'
  },
  {
    id: 'files', name: 'File Manager', desc: 'Manage your files',
    screen: null, category: 'tools', emoji: '📁'
  },
  {
    id: 'manual', name: 'User Manual', desc: 'Help and instructions',
    screen: null, category: 'help', emoji: '📖'
  },
  {
    id: 'ai', name: 'AI Assistant', desc: 'Smart voice assistant',
    screen: null, category: 'ai', emoji: '🤖'
  },
  {
    id: 'help', name: 'Help', desc: 'Get support and guidance',
    screen: null, category: 'help', emoji: '❓'
  },
  {
    id: 'settings', name: 'Settings', desc: 'Customise your device',
    screen: 'settings', category: 'system',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
  },
];

window.AppsScreen = (function () {
  let isGrid = true;

  const settingsGearSVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;

  const listIconSVG = `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const gridIconSVG = `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;

  function renderApps(filterText) {
    const grid = document.getElementById('apps-grid');
    const q = (filterText || '').toLowerCase().trim();
    const filtered = window.AppsData.filter(app =>
      !q || app.name.toLowerCase().includes(q) || (app.desc || '').toLowerCase().includes(q)
    );

    grid.innerHTML = '';
    grid.className = 'apps-grid' + (isGrid ? '' : ' list-view');

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="no-results"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg><span>No apps found</span></div>`;
      return;
    }

    filtered.forEach(app => {
      const tile = document.createElement('div');
      tile.className = 'app-tile';
      tile.setAttribute('data-tts', app.name + '. ' + (app.desc || ''));
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.innerHTML = `
        <div class="app-tile-icon">
          ${app.emoji ? `<span class="icon-emoji">${app.emoji}</span>` : app.icon}
        </div>
        <div class="app-tile-name">${app.name}</div>
        <div class="app-tile-desc">${app.desc || ''}</div>
        <button class="app-settings-btn" data-tts="${app.name} settings" aria-label="${app.name} settings" tabindex="0">
          ${settingsGearSVG}
        </button>
      `;

      // Main tap
      tile.addEventListener('click', e => {
        if (e.target.closest('.app-settings-btn')) return;
        TTS.speak('Opening ' + app.name);
        if (app.screen) {
          Router.navigate(app.screen);
        } else {
          showToast('Launching ' + app.name + '...');
          if (window.Android && window.Android.launchApp) {
            try { window.Android.launchApp(app.id); } catch (err) {}
          }
        }
      });

      // Settings button
      tile.querySelector('.app-settings-btn').addEventListener('click', e => {
        e.stopPropagation();
        TTS.speak(app.name + ' settings');
        showToast(app.name + ' settings');
      });

      grid.appendChild(tile);
    });
  }

  function toggleView() {
    isGrid = !isGrid;
    const btn = document.getElementById('apps-view-toggle');
    btn.innerHTML = isGrid ? gridIconSVG : listIconSVG;
    renderApps(document.getElementById('apps-search').value);
    TTS.speak(isGrid ? 'Grid view' : 'List view');
  }

  function init() {
    renderApps('');

    document.getElementById('apps-view-toggle').addEventListener('click', toggleView);

    document.getElementById('apps-search').addEventListener('input', e => {
      renderApps(e.target.value);
    });

    document.getElementById('apps-search').addEventListener('focus', () => {
      TTS.speak('Search apps');
    });
  }

  function onEnter() {
    renderApps(document.getElementById('apps-search').value || '');
  }

  return { init, onEnter };
})();

