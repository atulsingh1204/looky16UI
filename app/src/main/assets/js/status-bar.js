/* ═══════════════════════════════════════════════
   STATUS-BAR.JS — Clock, battery, wifi, bluetooth
═══════════════════════════════════════════════ */

window.StatusBar = (function () {
  const elTime   = document.getElementById('sb-time');
  const elDate   = document.getElementById('sb-date');
  const elBatPct = document.getElementById('sb-bat-pct');
  const elBatFill = document.getElementById('bat-fill');
  const elBatGroup = document.getElementById('sb-battery');
  const elWifi   = document.getElementById('sb-wifi');
  const elBt     = document.getElementById('sb-bt');
  const elBar    = document.getElementById('status-bar');

  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    elTime.textContent = h + ':' + m;
    elDate.textContent = DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
  }

  function updateBattery(pct) {
    const p = Math.max(0, Math.min(100, pct));
    elBatPct.textContent = p + '%';
    // Adjust fill width (max inner width ≈ 14px in viewBox)
    const fillW = Math.round(p / 100 * 14);
    elBatFill.setAttribute('width', fillW);
    elBatGroup.classList.remove('low','medium','high');
    if (p <= 20) elBatGroup.classList.add('low');
    else if (p <= 50) elBatGroup.classList.add('medium');
    else elBatGroup.classList.add('high');
  }

  function updateWifi(connected) {
    elWifi.classList.toggle('connected', connected);
    elWifi.classList.toggle('disconnected', !connected);
    elWifi.querySelector('.sb-label').textContent = connected ? 'WiFi' : 'No WiFi';
  }

  function updateBluetooth(connected) {
    elBt.classList.toggle('connected', connected);
    elBt.classList.toggle('disconnected', !connected);
  }

  function fetchFromAndroid() {
    if (!window.Android) return;
    try {
      const bat = window.Android.getBatteryLevel();
      if (bat !== undefined) updateBattery(bat);
    } catch (e) {}
    try {
      const wifi = window.Android.getWifiConnected();
      if (wifi !== undefined) updateWifi(wifi);
    } catch (e) {}
    try {
      const bt = window.Android.getBluetoothState();
      if (bt !== undefined) updateBluetooth(bt);
    } catch (e) {}
  }

  function useBatteryAPI() {
    if (!navigator.getBattery) { updateBattery(85); return; }
    navigator.getBattery().then(battery => {
      updateBattery(Math.round(battery.level * 100));
      battery.addEventListener('levelchange', () => {
        updateBattery(Math.round(battery.level * 100));
      });
    }).catch(() => updateBattery(85));
  }

  function show()  { elBar.classList.remove('hidden'); }
  function hide()  { elBar.classList.add('hidden'); }

  function init() {
    updateClock();
    setInterval(updateClock, 10000); // update every 10s for demo

    // Battery
    if (window.Android) {
      fetchFromAndroid();
      setInterval(fetchFromAndroid, 30000);
    } else {
      useBatteryAPI();
      // Simulate wifi/bt for demo
      updateWifi(true);
      updateBluetooth(false);
    }
  }

  return { init, show, hide, updateBattery, updateWifi, updateBluetooth };
})();

