/* ═══════════════════════════════════════════════
   SETTINGS.JS — Settings screen bindings & persistence
═══════════════════════════════════════════════ */

window.SettingsScreen = (function () {

  function renderFavApps() {
    const container = document.getElementById('fav-app-list');
    if (!container) return;
    const saved = JSON.parse(localStorage.getItem('looky16-favs') || '[]');
    container.innerHTML = '';

    window.AppsData.forEach(app => {
      const row = document.createElement('div');
      row.className = 'fav-app-row';
      const checked = saved.includes(app.id) ? 'checked' : '';
      row.innerHTML = `
        <div class="fav-icon">${app.emoji || (app.icon ? app.icon.substring(0, 60) + '...' : '?')}</div>
        <label>
          <span>${app.name}</span>
          <input type="checkbox" data-app-id="${app.id}" ${checked} />
        </label>
      `;
      // Use emoji for fav-icon display if available
      if (app.emoji) {
        row.querySelector('.fav-icon').innerHTML = app.emoji;
      } else {
        // Render small SVG icon
        const iconEl = row.querySelector('.fav-icon');
        iconEl.innerHTML = app.icon || '?';
        if (iconEl.querySelector('svg')) {
          const svg = iconEl.querySelector('svg');
          svg.style.width = '32px';
          svg.style.height = '32px';
          svg.style.stroke = 'var(--color-fg)';
          svg.style.fill = 'none';
        }
      }

      row.addEventListener('click', e => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (e.target !== cb) cb.checked = !cb.checked;
        saveFavs();
        TTS.speak((cb.checked ? 'Added' : 'Removed') + ' ' + app.name + ' from favourites');
      });

      container.appendChild(row);
    });
  }

  function saveFavs() {
    const checked = Array.from(document.querySelectorAll('#fav-app-list input[type="checkbox"]:checked'))
      .map(cb => cb.dataset.appId);
    // Limit to 4
    const limited = checked.slice(0, 4);
    localStorage.setItem('looky16-favs', JSON.stringify(limited));
    // Refresh home quick bar
    HomeScreen.refresh();
    refreshQuickBar();
  }

  function refreshQuickBar() {
    const bar = document.querySelector('.home-quickbar');
    if (!bar) return;

    // Remove existing fav buttons (after the 3 fixed ones + divider)
    const existingFavs = bar.querySelectorAll('.qb-fav');
    existingFavs.forEach(el => el.remove());

    const favIds = JSON.parse(localStorage.getItem('looky16-favs') || '[]');
    if (favIds.length === 0) return;

    // Add divider
    const divider = document.createElement('div');
    divider.className = 'qb-divider qb-fav';
    bar.appendChild(divider);

    favIds.forEach(id => {
      const app = window.AppsData.find(a => a.id === id);
      if (!app) return;

      const btn = document.createElement('button');
      btn.className = 'qb-btn qb-fav';
      btn.setAttribute('data-tts', app.name);
      btn.setAttribute('aria-label', app.name);
      btn.innerHTML = `
        <span style="font-size:40px;line-height:1;">${app.emoji || '★'}</span>
        <span>${app.name}</span>
      `;
      if (app.screen) {
        btn.addEventListener('click', () => Router.navigate(app.screen));
      } else {
        btn.addEventListener('click', () => showToast('Launching ' + app.name + '...'));
      }
      bar.appendChild(btn);
    });
  }

  function init() {
    // Home mode radio
    const modeTTSNames = {
      carousel:     'Carousel mode',
      tile:         'Tile Grid mode',
      simple:       'Simple List mode',
      'three-icon': 'Three Icon mode',
    };
    document.querySelectorAll('input[name="home-mode"]').forEach(radio => {
      radio.addEventListener('change', e => {
        HomeScreen.setMode(e.target.value);
        TTS.speak(modeTTSNames[e.target.value] || (e.target.value + ' mode'));
      });
    });

    // Sync home mode radio to current state
    const savedMode = localStorage.getItem('looky16-home-mode') || 'carousel';
    const radio = document.querySelector(`input[name="home-mode"][value="${savedMode}"]`);
    if (radio) radio.checked = true;

    // Font size
    const savedFont = localStorage.getItem('looky16-fontsize') || 'xlarge';
    const fontRadio = document.querySelector(`input[name="font-size"][value="${savedFont}"]`);
    if (fontRadio) fontRadio.checked = true;
    document.documentElement.setAttribute('data-fontsize', savedFont);

    document.querySelectorAll('input[name="font-size"]').forEach(r => {
      r.addEventListener('change', e => {
        document.documentElement.setAttribute('data-fontsize', e.target.value);
        localStorage.setItem('looky16-fontsize', e.target.value);
        TTS.speak(e.target.value + ' font size');
      });
    });

    // TTS toggle
    const ttsToggle = document.getElementById('tts-enabled');
    const savedTTS = localStorage.getItem('looky16-tts') !== 'false';
    ttsToggle.checked = savedTTS;
    TTS.setEnabled(savedTTS);
    ttsToggle.addEventListener('change', () => {
      TTS.setEnabled(ttsToggle.checked);
      localStorage.setItem('looky16-tts', ttsToggle.checked);
      if (ttsToggle.checked) TTS.speak('Text to speech enabled');
    });

    // TTS rate
    const ttsRate = document.getElementById('tts-rate');
    const savedRate = parseFloat(localStorage.getItem('looky16-tts-rate') || '0.9');
    ttsRate.value = savedRate;
    TTS.setRate(savedRate);
    ttsRate.addEventListener('change', () => {
      TTS.setRate(parseFloat(ttsRate.value));
      localStorage.setItem('looky16-tts-rate', ttsRate.value);
      TTS.speak('Speech rate changed');
    });

    // Magnifier settings
    document.querySelectorAll('input[name="mag-default-mode"]').forEach(r => {
      const saved = localStorage.getItem('looky16-mag-mode') || 'near';
      if (r.value === saved) r.checked = true;
      r.addEventListener('change', e => {
        localStorage.setItem('looky16-mag-mode', e.target.value);
        TTS.speak('Default magnifier mode: ' + e.target.value);
      });
    });

    // Fav apps
    renderFavApps();
    refreshQuickBar();
  }

  return { init, refreshQuickBar };
})();

