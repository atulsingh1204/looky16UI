/* ═══════════════════════════════════════════════
   MAGNIFIER.JS — Camera, zoom, modes, OCR stub
═══════════════════════════════════════════════ */

window.MagnifierScreen = (function () {
  let stream = null;
  let zoomLevel = 1;
  let currentMode = 'near';
  let frozen = false;
  let filterIndex = 0;
  let toolbarVisible = true;

  const filters = ['filter-none', 'filter-high-contrast', 'filter-invert', 'filter-yellow'];
  const filterNames = ['No Filter', 'High Contrast', 'Inverted', 'Yellow Tint'];

  const video    = document.getElementById('mag-video');
  const canvas   = document.getElementById('mag-canvas');
  const badge    = document.getElementById('mag-mode-badge');
  const zoomBadge = document.getElementById('mag-zoom-badge');
  const toolbar  = document.getElementById('mag-toolbar');
  const showBtn  = document.getElementById('mag-show-btn');
  const ocrOverlay = document.getElementById('mag-ocr-overlay');
  const ocrText  = document.getElementById('ocr-text');
  const preview  = document.querySelector('.mag-preview-area');
  const a4Left   = document.getElementById('mag-a4-left-rail');
  const a4Right  = document.getElementById('mag-a4-right-rail');
  const screen   = document.getElementById('screen-magnifier');

  async function startCamera() {
    if (stream) return;

    const constraints = buildConstraints();
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      hidePlaceholder();
    } catch (err) {
      showPlaceholder('Camera permission required.\nTap to try again.');
      console.warn('Camera error:', err);
    }
  }

  function buildConstraints() {
    const base = { audio: false, video: { facingMode: 'environment' } };
    if (currentMode === 'a4') {
      base.video.aspectRatio = { ideal: 1.414 }; // A4 ratio
    }
    return base;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.srcObject = null;
  }

  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem('looky16-mag-mode', mode);

    // Update mode buttons
    document.querySelectorAll('.mag-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Mode badge text
    const labels = { near: 'Near View', distance: 'Distance', a4: 'A4 Page' };
    badge.textContent = labels[mode] || mode;

    // A4 mode: show rails, hide main toolbar
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

    // Restart camera with new constraints if needed
    if (stream) {
      stopCamera();
      setTimeout(startCamera, 300);
    }

    TTS.speak(labels[mode] + ' mode');
  }

  function setZoom(level) {
    zoomLevel = Math.max(1, Math.min(10, level));
    zoomBadge.textContent = zoomLevel + '×';

    // Apply zoom via CSS transform on video
    video.style.transform = `scale(${zoomLevel})`;
    video.style.transformOrigin = 'center center';

    // Try native camera zoom if available
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.zoom) {
          const min = caps.zoom.min || 1;
          const max = caps.zoom.max || 10;
          const clamped = Math.max(min, Math.min(max, zoomLevel));
          track.applyConstraints({ advanced: [{ zoom: clamped }] }).catch(() => {});
        }
      }
    }
  }

  function toggleFreeze() {
    frozen = !frozen;
    const btn = document.getElementById('mag-freeze');
    const railBtn = document.getElementById('mag-freeze-rail');
    if (frozen) {
      // Capture current frame to canvas
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.classList.remove('hidden');
        video.classList.add('hidden');
      }
      btn.classList.add('active');
      if (railBtn) railBtn.classList.add('active');
      TTS.speak('Frame frozen');
      showToast('Frame frozen');
    } else {
      canvas.classList.add('hidden');
      video.classList.remove('hidden');
      btn.classList.remove('active');
      if (railBtn) railBtn.classList.remove('active');
      TTS.speak('Live preview');
      showToast('Live preview');
    }
  }

  function cycleFilter() {
    filterIndex = (filterIndex + 1) % filters.length;
    filters.forEach(f => preview.classList.remove(f));
    preview.classList.add(filters[filterIndex]);
    TTS.speak(filterNames[filterIndex]);
    showToast(filterNames[filterIndex]);
  }

  function captureImage() {
    const flash = document.createElement('div');
    flash.className = 'capture-flash';
    preview.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    // Draw to canvas
    const cap = document.createElement('canvas');
    cap.width = video.videoWidth || 1280;
    cap.height = video.videoHeight || 720;
    const ctx = cap.getContext('2d');
    if (frozen) {
      ctx.drawImage(canvas, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0);
    }

    TTS.speak('Image captured');
    showToast('Image captured!');

    // In a real app: window.Android.saveImage(cap.toDataURL())
  }

  function showOCR() {
    ocrOverlay.classList.remove('hidden');
    // Stub: in real app, send frame to OCR engine
    ocrText.textContent = 'OCR feature: In the full app, this will read the text visible in the camera view aloud using on-device text recognition.';
    TTS.speak('OCR result: OCR feature not connected in demo. In the full app, this reads text from the camera view.');
  }

  function closeOCR() {
    ocrOverlay.classList.add('hidden');
  }

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

  function onEnter() {
    const savedMode = localStorage.getItem('looky16-mag-mode') || 'near';
    setMode(savedMode);
    setZoom(1);
    startCamera();
  }

  function onLeave() {
    stopCamera();
    if (frozen) toggleFreeze();
    filterIndex = 0;
    filters.forEach(f => preview.classList.remove(f));
  }

  function bindEvents() {
    document.getElementById('mag-zoom-in').addEventListener('click', () => setZoom(zoomLevel + 1));
    document.getElementById('mag-zoom-out').addEventListener('click', () => setZoom(zoomLevel - 1));
    document.getElementById('mag-freeze').addEventListener('click', toggleFreeze);
    document.getElementById('mag-filter').addEventListener('click', cycleFilter);
    document.getElementById('mag-capture').addEventListener('click', captureImage);
    document.getElementById('mag-ocr').addEventListener('click', showOCR);
    document.getElementById('mag-hide-menu').addEventListener('click', toggleToolbar);
    document.getElementById('mag-show-btn').addEventListener('click', toggleToolbar);
    document.getElementById('ocr-close').addEventListener('click', closeOCR);

    // Rail buttons (A4 mode)
    document.getElementById('mag-zoom-in-rail').addEventListener('click', () => setZoom(zoomLevel + 1));
    document.getElementById('mag-zoom-out-rail').addEventListener('click', () => setZoom(zoomLevel - 1));
    document.getElementById('mag-freeze-rail').addEventListener('click', toggleFreeze);
    document.getElementById('mag-filter-rail').addEventListener('click', cycleFilter);
    document.getElementById('mag-capture-rail').addEventListener('click', captureImage);
    document.getElementById('mag-ocr-rail').addEventListener('click', showOCR);

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
  }

  function init() {
    bindEvents();
  }

  return { init, onEnter, onLeave, setMode, setZoom };
})();

