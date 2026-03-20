/* ═══════════════════════════════════════════════
   MAGNIFIER.JS — Camera preview with image.jpeg fallback
   When a real camera stream is available it is used;
   otherwise image.jpeg fills the preview area so the
   UI looks like a genuine magnifier even in the browser.
═══════════════════════════════════════════════ */

window.MagnifierScreen = (function () {

  /* ── state ───────────────────────────────── */
  let stream        = null;
  let zoomLevel     = 1;
  let currentMode   = 'near';
  let frozen        = false;
  let filterIndex   = 0;
  let toolbarVisible = true;
  let usingFallback  = false;   // true when showing image.jpeg instead of live stream
  let panX = 0, panY = 0;       // pan offset (px) for panning while zoomed
  let isPanning = false;
  let panStart  = { x: 0, y: 0, px: 0, py: 0 };

  const filters     = ['filter-none', 'filter-high-contrast', 'filter-invert', 'filter-yellow'];
  const filterNames = ['No Filter', 'High Contrast', 'Inverted', 'Yellow Tint'];

  /* ── DOM refs ────────────────────────────── */
  const video      = document.getElementById('mag-video');
  const canvas     = document.getElementById('mag-canvas');
  const badge      = document.getElementById('mag-mode-badge');
  const zoomBadge  = document.getElementById('mag-zoom-badge');
  const toolbar    = document.getElementById('mag-toolbar');
  const showBtn    = document.getElementById('mag-show-btn');
  const ocrOverlay = document.getElementById('mag-ocr-overlay');
  const ocrText    = document.getElementById('ocr-text');
  const preview    = document.querySelector('.mag-preview-area');
  const a4Left     = document.getElementById('mag-a4-left-rail');
  const a4Right    = document.getElementById('mag-a4-right-rail');
  const screen     = document.getElementById('screen-magnifier');

  /* ════════════════════════════════════════════
     FALLBACK IMAGE — inject once, reuse always
  ════════════════════════════════════════════ */
  let fallbackImg = null;

  function getFallbackImg() {
    if (fallbackImg) return fallbackImg;

    fallbackImg = document.createElement('img');
    fallbackImg.id  = 'mag-fallback-img';
    fallbackImg.src = 'image.jpeg';
    fallbackImg.alt = 'Camera preview';
    fallbackImg.draggable = false;

    Object.assign(fallbackImg.style, {
      position:      'absolute',
      inset:         '0',
      width:         '100%',
      height:        '100%',
      objectFit:     'cover',
      display:       'block',
      transformOrigin: 'center center',
      transition:    'transform 0.15s ease',
      userSelect:    'none',
      webkitUserSelect: 'none',
      pointerEvents: 'none',   // panning handled by the preview wrapper
    });

    preview.insertBefore(fallbackImg, preview.firstChild);
    return fallbackImg;
  }

  /* ── apply zoom + pan to the active preview element ── */
  function applyTransform() {
    const el = usingFallback ? getFallbackImg() : video;
    if (!el) return;
    el.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
  }

  /* ════════════════════════════════════════════
     CAMERA
  ════════════════════════════════════════════ */
  async function startCamera() {
    if (stream) return;

    // Hide fallback before trying camera
    if (fallbackImg) fallbackImg.style.display = 'none';
    video.style.display = 'block';

    const constraints = buildConstraints();
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      usingFallback = false;
      hidePlaceholder();
    } catch (err) {
      // Camera unavailable → show the realistic image fallback
      console.info('Camera unavailable, using image fallback:', err.message);
      video.style.display = 'none';
      showFallback();
    }
  }

  function buildConstraints() {
    const base = { audio: false, video: { facingMode: 'environment' } };
    if (currentMode === 'a4') base.video.aspectRatio = { ideal: 1.414 };
    return base;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.srcObject = null;
  }

  /* ════════════════════════════════════════════
     FALLBACK  — realistic image.jpeg preview
  ════════════════════════════════════════════ */
  function showFallback() {
    usingFallback = true;
    const img = getFallbackImg();
    img.style.display = 'block';
    hidePlaceholder();
    applyTransform();
    applyFallbackMode();
  }

  /* Simulate different camera modes on the image */
  function applyFallbackMode() {
    if (!usingFallback) return;
    const img = getFallbackImg();

    // Reset
    img.style.objectFit     = 'cover';
    img.style.objectPosition = 'center center';
    img.style.filter        = '';
    preview.style.background = '#000';

    if (currentMode === 'distance') {
      // Simulate distance camera: slight zoom-out letterbox feel
      img.style.objectFit = 'contain';
      preview.style.background = '#111';
    } else if (currentMode === 'a4') {
      // Simulate A4 narrow FOV: portrait crop centre
      img.style.objectFit      = 'cover';
      img.style.objectPosition = 'center 30%';
      preview.style.background = '#1a1a1a';
    } else {
      // Near view: fill screen
      img.style.objectFit = 'cover';
    }
  }

  /* ════════════════════════════════════════════
     MODE
  ════════════════════════════════════════════ */
  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('looky16-mag-mode', mode);

    document.querySelectorAll('.mag-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const labels = { near: 'Near View', distance: 'Distance', a4: 'A4 Page' };
    badge.textContent = labels[mode] || mode;

    if (mode === 'a4') {
      screen.classList.add('mode-a4');
      a4Left.classList.remove('hidden');
      a4Right.classList.remove('hidden');
      toolbar.classList.add('hidden');
      showBtn.classList.add('hidden');
    } else {
      screen.classList.remove('mode-a4');
      a4Left.classList.add('hidden');
      a4Right.classList.add('hidden');
      if (toolbarVisible) toolbar.classList.remove('hidden');
      else showBtn.classList.remove('hidden');
    }

    applyFallbackMode();

    // Restart live camera with new constraints if it was running
    if (stream) { stopCamera(); setTimeout(startCamera, 300); }

    TTS.speak(labels[mode] + ' mode');
  }

  /* ════════════════════════════════════════════
     ZOOM
  ════════════════════════════════════════════ */
  function setZoom(level) {
    zoomLevel = Math.max(1, Math.min(10, level));
    zoomBadge.textContent = zoomLevel + '×';

    // Reset pan when zooming back to 1×
    if (zoomLevel === 1) { panX = 0; panY = 0; }

    // Show grab cursor when zoomed in
    preview.classList.toggle('zoom-active', zoomLevel > 1);

    applyTransform();

    // Try native camera zoom if live stream
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.zoom) {
          const clamped = Math.max(caps.zoom.min || 1, Math.min(caps.zoom.max || 10, zoomLevel));
          track.applyConstraints({ advanced: [{ zoom: clamped }] }).catch(() => {});
        }
      }
    }
  }

  /* ════════════════════════════════════════════
     FREEZE
  ════════════════════════════════════════════ */
  function toggleFreeze() {
    frozen = !frozen;
    const btn     = document.getElementById('mag-freeze');
    const railBtn = document.getElementById('mag-freeze-rail');

    if (frozen) {
      if (usingFallback) {
        // Freeze the fallback image by overlaying a snapshot canvas
        const img = getFallbackImg();
        const w = preview.clientWidth  || 1280;
        const h = preview.clientHeight || 720;
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.classList.remove('hidden');
        img.style.display = 'none';
      } else if (video.readyState >= 2) {
        canvas.width  = video.videoWidth  || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.classList.remove('hidden');
        video.classList.add('hidden');
      }
      btn.classList.add('active');
      if (railBtn) railBtn.classList.add('active');
      preview.classList.add('frozen');
      TTS.speak('Frame frozen');
      showToast('Frame frozen');
    } else {
      canvas.classList.add('hidden');
      if (usingFallback) {
        getFallbackImg().style.display = 'block';
      } else {
        video.classList.remove('hidden');
      }
      btn.classList.remove('active');
      if (railBtn) railBtn.classList.remove('active');
      preview.classList.remove('frozen');
      TTS.speak('Live preview');
      showToast('Live preview');
    }
  }

  /* ════════════════════════════════════════════
     COLOUR FILTER
  ════════════════════════════════════════════ */
  function cycleFilter() {
    filterIndex = (filterIndex + 1) % filters.length;
    filters.forEach(f => preview.classList.remove(f));
    preview.classList.add(filters[filterIndex]);
    TTS.speak(filterNames[filterIndex]);
    showToast(filterNames[filterIndex]);
  }

  /* ════════════════════════════════════════════
     CAPTURE
  ════════════════════════════════════════════ */
  function captureImage() {
    const flash = document.createElement('div');
    flash.className = 'capture-flash';
    preview.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    const w = preview.clientWidth  || 1280;
    const h = preview.clientHeight || 720;
    const cap = document.createElement('canvas');
    cap.width  = w;
    cap.height = h;
    const ctx = cap.getContext('2d');

    if (frozen) {
      ctx.drawImage(canvas, 0, 0, w, h);
    } else if (usingFallback) {
      ctx.drawImage(getFallbackImg(), 0, 0, w, h);
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }

    TTS.speak('Image captured');
    showToast('Image captured!');
  }

  /* ════════════════════════════════════════════
     OCR
  ════════════════════════════════════════════ */
  function showOCR() {
    ocrOverlay.classList.remove('hidden');
    ocrText.textContent = 'OCR feature: In the full app, this will read the text visible in the camera view aloud using on-device text recognition.';
    TTS.speak('OCR result: OCR feature not connected in demo.');
  }

  function closeOCR() {
    ocrOverlay.classList.add('hidden');
  }

  /* ════════════════════════════════════════════
     TOOLBAR TOGGLE
  ════════════════════════════════════════════ */
  function toggleToolbar() {
    toolbarVisible = !toolbarVisible;
    if (currentMode === 'a4') return;

    if (toolbarVisible) {
      toolbar.classList.remove('hidden');
      showBtn.classList.add('hidden');
      document.getElementById('mag-hide-label').textContent = 'Hide';
      TTS.speak('Toolbar shown');
    } else {
      toolbar.classList.add('hidden');
      showBtn.classList.remove('hidden');
      TTS.speak('Toolbar hidden');
    }
  }

  /* ════════════════════════════════════════════
     PLACEHOLDER (when even fallback fails)
  ════════════════════════════════════════════ */
  function showPlaceholder(msg) {
    let ph = document.querySelector('.mag-no-camera');
    if (!ph) {
      ph = document.createElement('div');
      ph.className = 'mag-no-camera';
      ph.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 8.5C2 7.1 3.1 6 4.5 6H6l2-2.5h8L18 6h1.5C20.9 6 22 7.1 22 8.5v11c0 1.4-1.1 2.5-2.5 2.5h-15C3.1 22 2 20.9 2 19.5z" stroke="currentColor" stroke-width="2" fill="none"/></svg><p>${msg}</p>`;
      ph.addEventListener('click', () => { ph.remove(); startCamera(); });
      preview.appendChild(ph);
    }
  }

  function hidePlaceholder() {
    const ph = document.querySelector('.mag-no-camera');
    if (ph) ph.remove();
  }

  /* ════════════════════════════════════════════
     TOUCH PAN (when zoomed in)
  ════════════════════════════════════════════ */
  function bindPan() {
    preview.addEventListener('pointerdown', e => {
      if (zoomLevel <= 1) return;
      if (e.target.closest('button, .mag-toolbar, .mag-a4-rail, .mag-show-btn')) return;
      isPanning = true;
      preview.classList.add('panning');
      panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
      preview.setPointerCapture(e.pointerId);
    });

    preview.addEventListener('pointermove', e => {
      if (!isPanning) return;
      panX = panStart.px + (e.clientX - panStart.x);
      panY = panStart.py + (e.clientY - panStart.y);
      applyTransform();
    });

    preview.addEventListener('pointerup',     () => { isPanning = false; preview.classList.remove('panning'); });
    preview.addEventListener('pointercancel', () => { isPanning = false; preview.classList.remove('panning'); });
  }

  /* ════════════════════════════════════════════
     LIFECYCLE
  ════════════════════════════════════════════ */
  function onEnter() {
    const savedMode = localStorage.getItem('looky16-mag-mode') || 'near';
    panX = 0; panY = 0;
    setMode(savedMode);
    setZoom(1);
    startCamera();
  }

  function onLeave() {
    stopCamera();
    if (frozen) toggleFreeze();
    filterIndex = 0;
    filters.forEach(f => preview.classList.remove(f));
    panX = 0; panY = 0;
  }

  /* ════════════════════════════════════════════
     EVENT BINDING
  ════════════════════════════════════════════ */
  function bindEvents() {
    document.getElementById('mag-zoom-in') .addEventListener('click', () => setZoom(zoomLevel + 1));
    document.getElementById('mag-zoom-out').addEventListener('click', () => setZoom(zoomLevel - 1));
    document.getElementById('mag-freeze')  .addEventListener('click', toggleFreeze);
    document.getElementById('mag-filter')  .addEventListener('click', cycleFilter);
    document.getElementById('mag-capture') .addEventListener('click', captureImage);
    document.getElementById('mag-ocr')     .addEventListener('click', showOCR);
    document.getElementById('mag-hide-menu').addEventListener('click', toggleToolbar);
    document.getElementById('mag-show-btn').addEventListener('click', toggleToolbar);
    document.getElementById('ocr-close')   .addEventListener('click', closeOCR);

    // Rail buttons (A4 mode)
    document.getElementById('mag-zoom-in-rail') .addEventListener('click', () => setZoom(zoomLevel + 1));
    document.getElementById('mag-zoom-out-rail').addEventListener('click', () => setZoom(zoomLevel - 1));
    document.getElementById('mag-freeze-rail')  .addEventListener('click', toggleFreeze);
    document.getElementById('mag-filter-rail')  .addEventListener('click', cycleFilter);
    document.getElementById('mag-capture-rail') .addEventListener('click', captureImage);
    document.getElementById('mag-ocr-rail')     .addEventListener('click', showOCR);

    // Mode buttons
    document.querySelectorAll('.mag-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Keyboard zoom
    document.addEventListener('keydown', e => {
      if (!document.getElementById('screen-magnifier').classList.contains('active')) return;
      if (e.key === '+' || e.key === '=') setZoom(zoomLevel + 1);
      if (e.key === '-') setZoom(zoomLevel - 1);
    });

    bindPan();
  }

  function init() {
    bindEvents();
  }

  return { init, onEnter, onLeave, setMode, setZoom };
})();
