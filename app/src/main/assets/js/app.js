/* ═══════════════════════════════════════════════
   APP.JS — Router, screen manager, global utils, init
   Entry point — loaded last
═══════════════════════════════════════════════ */

// ─── Global toast utility ────────────────────
window.showToast = function (msg, duration) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration || 2500);
};

// ─── Router ──────────────────────────────────
window.Router = (function () {
  const SCREEN_IDS = {
    splash:      'screen-splash',
    home:        'screen-home',
    magnifier:   'screen-magnifier',
    apps:        'screen-apps',
    settings:    'screen-settings',
    'mag-settings': 'screen-mag-settings',
  };

  let currentScreen = 'splash';
  const history = [];

  function navigate(screenId, opts) {
    opts = opts || {};

    // Handle modal overlay (mag-settings)
    if (screenId === 'mag-settings') {
      const overlay = document.getElementById('screen-mag-settings');
      overlay.classList.remove('hidden');
      TTS.speak('Magnifier settings');
      return;
    }

    if (screenId === currentScreen && !opts.force) return;

    // Leave callback
    if (currentScreen === 'magnifier') MagnifierScreen.onLeave();

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });

    // Show status bar on all non-splash
    if (screenId !== 'splash') {
      StatusBar.show();
    } else {
      StatusBar.hide();
    }

    const el = document.getElementById(SCREEN_IDS[screenId]);
    if (!el) { console.warn('Unknown screen:', screenId); return; }

    history.push(currentScreen);
    currentScreen = screenId;

    el.classList.add('active');

    // Enter callback
    if (screenId === 'magnifier') MagnifierScreen.onEnter();
    if (screenId === 'apps')      AppsScreen.onEnter();
    if (screenId === 'home')      HomeScreen.refresh();

    // TTS announce
    const titles = {
      home: 'Home screen',
      magnifier: 'Magnifier',
      apps: 'Apps screen',
      settings: 'Settings',
    };
    if (titles[screenId]) TTS.speak(titles[screenId]);
  }

  function back() {
    if (history.length > 0) {
      const prev = history.pop();
      navigate(prev, { force: true });
    }
  }

  function getCurrent() { return currentScreen; }

  return { navigate, back, getCurrent };
})();

// ─── Global click delegation for data-screen ─
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-screen]');
  if (el) {
    const target = el.getAttribute('data-screen');
    Router.navigate(target);
  }

  // Close modal on data-close-modal
  const closeModal = e.target.closest('[data-close-modal]');
  if (closeModal) {
    const overlay = closeModal.closest('.modal-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
});

// ─── Hardware / Browser back button ──────────
window.addEventListener('popstate', () => Router.back());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Router.back();
});

// ─── Main init ───────────────────────────────
(function init() {
  // Init subsystems
  ThemeManager.init();
  StatusBar.init();
  StatusBar.hide(); // hidden on splash

  MagnifierScreen.init();
  AppsScreen.init();
  SettingsScreen.init();

  // Show splash, then transition to home after 2.8s
  document.getElementById('screen-splash').classList.add('active');

  setTimeout(() => {
    HomeScreen.init();
    Router.navigate('home');
  }, 2800);
})();

