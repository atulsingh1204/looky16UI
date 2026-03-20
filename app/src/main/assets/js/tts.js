/* ═══════════════════════════════════════════════
   TTS.JS — Text-to-Speech wrapper
   Tries Android bridge first, falls back to Web Speech API
═══════════════════════════════════════════════ */

window.TTS = (function () {
  let enabled = true;
  let rate = 0.9;
  let currentUtterance = null;

  function speak(text) {
    if (!enabled || !text) return;

    // Try Android bridge first
    if (window.Android && typeof window.Android.speak === 'function') {
      try { window.Android.speak(text, rate); return; } catch (e) {}
    }

    // Web Speech API fallback
    if (!window.speechSynthesis) return;

    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Prefer a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google'));
    if (preferred) utter.voice = preferred;

    currentUtterance = utter;
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if (window.Android && typeof window.Android.stopSpeak === 'function') {
      try { window.Android.stopSpeak(); } catch (e) {}
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function setEnabled(val) { enabled = val; if (!val) stop(); }
  function setRate(val)    { rate = parseFloat(val); }
  function isEnabled()     { return enabled; }

  // Bind data-tts attributes on click
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-tts]');
    if (el) speak(el.getAttribute('data-tts'));
  }, true);

  // Also speak on focus (keyboard/switch access)
  document.addEventListener('focusin', function (e) {
    const el = e.target.closest('[data-tts]');
    if (el) speak(el.getAttribute('data-tts'));
  });

  return { speak, stop, setEnabled, setRate, isEnabled };
})();

