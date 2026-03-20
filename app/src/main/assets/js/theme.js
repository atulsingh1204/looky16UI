/* ═══════════════════════════════════════════════
   THEME.JS — Instant theme switching & persistence
═══════════════════════════════════════════════ */

window.ThemeManager = (function () {
  const THEMES = ['A', 'B', 'C', 'D'];
  const THEME_NAMES = {
    A: 'Black and Yellow',
    B: 'Black and White',
    C: 'Navy and Cyan',
    D: 'Dark Green and Lime'
  };
  let current = 'A';

  function apply(themeId) {
    if (!THEMES.includes(themeId)) return;
    current = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('looky16-theme', themeId);

    // Update active swatch in settings
    document.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeId);
    });

    TTS.speak(THEME_NAMES[themeId] + ' theme applied');
    showToast('Theme: ' + THEME_NAMES[themeId]);
  }

  function getCurrent() { return current; }

  function init() {
    const saved = localStorage.getItem('looky16-theme') || 'A';
    apply(saved);

    // Wire swatch buttons
    document.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.theme));
    });
  }

  return { apply, getCurrent, init };
})();

