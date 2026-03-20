/* ═══════════════════════════════════════════════
   HOME.JS — Carousel / Tile / Simple modes
═══════════════════════════════════════════════ */

window.HomeScreen = (function () {

  // ─── App data ───────────────────────────────
  const HOME_APPS = [
    {
      id: 'magnifier', name: 'Magnifier', desc: 'Zoom & enhance view',
      screen: 'magnifier',
      icon: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" stroke-width="2"/><line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="2"/><line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`
    },
    {
      id: 'apps', name: 'Apps', desc: 'Browse all applications',
      screen: 'apps',
      icon: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
    },
    {
      id: 'settings', name: 'Settings', desc: 'Customise your device',
      screen: 'settings',
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`
    },
    {
      id: 'gallery', name: 'Gallery', desc: 'View your photos',
      screen: null, emoji: '🖼️'
    },
    {
      id: 'calculator', name: 'Calculator', desc: 'Quick calculations',
      screen: null, emoji: '🔢'
    },
    {
      id: 'browser', name: 'Browser', desc: 'Browse the web',
      screen: null, emoji: '🌐'
    },
    {
      id: 'ai', name: 'AI Assistant', desc: 'Smart assistant',
      screen: null, emoji: '🤖'
    },
  ];

  let currentMode = 'carousel';
  let carouselIndex = 0;

  // ─── Render carousel ───────────────────────
  function renderCarousel() {
    const track = document.getElementById('carousel-track');
    const apps = getVisibleApps();
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-cards-wrapper';

    apps.forEach((app, i) => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.setAttribute('data-tts', 'Open ' + app.name);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="carousel-card-icon">
          ${app.emoji ? `<span class="icon-emoji">${app.emoji}</span>` : app.icon}
        </div>
        <div class="carousel-card-name">${app.name}</div>
        <div class="carousel-card-desc">${app.desc || ''}</div>
      `;
      if (app.screen) {
        card.addEventListener('click', () => Router.navigate(app.screen));
      } else {
        card.addEventListener('click', () => { showToast('Launching ' + app.name + '...'); });
      }
      wrapper.appendChild(card);
    });

    // Dots
    const dotsEl = document.createElement('div');
    dotsEl.className = 'carousel-dots';
    apps.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dotsEl.appendChild(dot);
    });

    track.innerHTML = '';
    track.appendChild(wrapper);
    track.appendChild(dotsEl);

    carouselIndex = 0;
    updateCarouselPosition(wrapper, dotsEl);

    // Arrow buttons
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');

    prev.onclick = () => {
      if (carouselIndex > 0) {
        carouselIndex--;
        updateCarouselPosition(wrapper, dotsEl);
        TTS.speak(apps[carouselIndex].name);
      }
    };

    next.onclick = () => {
      if (carouselIndex < apps.length - 1) {
        carouselIndex++;
        updateCarouselPosition(wrapper, dotsEl);
        TTS.speak(apps[carouselIndex].name);
      }
    };

    // Touch/swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -50 && carouselIndex < apps.length - 1) { carouselIndex++; updateCarouselPosition(wrapper, dotsEl); TTS.speak(apps[carouselIndex].name); }
      if (dx > 50  && carouselIndex > 0)                { carouselIndex--; updateCarouselPosition(wrapper, dotsEl); TTS.speak(apps[carouselIndex].name); }
    }, { passive: true });
  }

  function updateCarouselPosition(wrapper, dotsEl) {
    wrapper.style.transform = `translateX(-${carouselIndex * 100}%)`;
    dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === carouselIndex);
    });
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    prev.disabled = carouselIndex === 0;
    next.disabled = carouselIndex >= dotsEl.children.length - 1;
  }

  // ─── Render tile grid ──────────────────────
  function renderTile() {
    const grid = document.getElementById('tile-grid');
    grid.innerHTML = '';
    getVisibleApps().forEach(app => {
      const card = document.createElement('div');
      card.className = 'tile-card';
      card.setAttribute('data-tts', 'Open ' + app.name);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="tile-card-icon">
          ${app.emoji ? `<span class="icon-emoji">${app.emoji}</span>` : app.icon}
        </div>
        <div class="tile-card-name">${app.name}</div>
      `;
      if (app.screen) {
        card.addEventListener('click', () => Router.navigate(app.screen));
      } else {
        card.addEventListener('click', () => showToast('Launching ' + app.name + '...'));
      }
      grid.appendChild(card);
    });
  }

  // ─── Render simple list ────────────────────
  function renderSimple() {
    const list = document.getElementById('simple-list');
    list.innerHTML = '';
    getVisibleApps().forEach(app => {
      const row = document.createElement('div');
      row.className = 'simple-row';
      row.setAttribute('data-tts', 'Open ' + app.name);
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.innerHTML = `
        <div class="simple-row-icon">
          ${app.emoji ? `<span class="icon-emoji">${app.emoji}</span>` : app.icon}
        </div>
        <div class="simple-row-name">${app.name}</div>
        <svg class="simple-row-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
      `;
      if (app.screen) {
        row.addEventListener('click', () => Router.navigate(app.screen));
      } else {
        row.addEventListener('click', () => showToast('Launching ' + app.name + '...'));
      }
      list.appendChild(row);
    });
  }

  // ─── Get apps (favorites merged) ──────────
  function getVisibleApps() {
    const favIds = JSON.parse(localStorage.getItem('looky16-favs') || '[]');
    const favApps = window.AppsData
      ? window.AppsData.filter(a => favIds.includes(a.id) && !HOME_APPS.find(h => h.id === a.id))
      : [];
    return [...HOME_APPS, ...favApps];
  }

  // ─── Mode switching ────────────────────────
  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('looky16-home-mode', mode);

    document.querySelectorAll('.home-mode-panel').forEach(p => p.classList.remove('active'));

    if (mode === 'carousel') {
      document.getElementById('home-carousel').classList.add('active');
      renderCarousel();
    } else if (mode === 'tile') {
      document.getElementById('home-tile').classList.add('active');
      renderTile();
    } else if (mode === 'simple') {
      document.getElementById('home-simple').classList.add('active');
      renderSimple();
    }

    // Sync radio in settings
    const radio = document.querySelector(`input[name="home-mode"][value="${mode}"]`);
    if (radio) radio.checked = true;
  }

  function getMode() { return currentMode; }

  function init() {
    const saved = localStorage.getItem('looky16-home-mode') || 'carousel';
    setMode(saved);
  }

  function refresh() {
    setMode(currentMode);
  }

  return { init, setMode, getMode, refresh };
})();

