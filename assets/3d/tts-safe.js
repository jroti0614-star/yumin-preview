/* assets/3d/tts-safe.js — 모바일 TTS 안전장치 (별도 페이지 공용)
 *
 * iOS Safari에서 자주 나는 두 가지 문제를 페이지 코드 고치지 않고 막는다.
 *   1) 첫 사용자 터치 전에는 speak()가 무음이 된다.
 *   2) cancel() 직후 같은 tick에서 speak()하면 앞부분이 잘리거나 아예 안 들린다.
 *
 * 쓰는 법: <script src="assets/3d/tts-safe.js" defer></script>
 */
(function () {
  'use strict';
  var ss = window.speechSynthesis;
  if (!ss || typeof window.SpeechSynthesisUtterance !== 'function') return;

  var origSpeak = ss.speak.bind(ss);
  var origCancel = ss.cancel.bind(ss);
  var DELAY = 80;
  var lastCancel = 0;
  var unlocked = false;
  var picked = null;

  function pickVoice() {
    var list = [];
    try { list = ss.getVoices() || []; } catch (e) { list = []; }
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i].lang || '').toLowerCase().replace('_', '-');
      if (l.indexOf('ko') === 0) { picked = list[i]; return picked; }
    }
    picked = null;
    return null;
  }

  ss.cancel = function () {
    lastCancel = Date.now();
    try { return origCancel(); } catch (e) { return undefined; }
  };

  ss.speak = function (u) {
    var wait = DELAY - (Date.now() - lastCancel);
    if (wait > 0) {
      setTimeout(function () { try { origSpeak(u); } catch (e) {} }, wait);
      return undefined;
    }
    try { return origSpeak(u); } catch (e) { return undefined; }
  };

  /* 첫 터치에서 아주 짧은 문장을 한 번 말해 두면 이후 speak가 살아난다 */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    pickVoice();
    try {
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'ko-KR';
      if (picked) u.voice = picked;
      origSpeak(u);
      origCancel();
      if (ss.resume) ss.resume();
    } catch (e) { /* 소리를 못 내도 화면은 그대로 동작한다 */ }
  }

  /* iOS는 목소리 목록이 늦게 온다 */
  pickVoice();
  if (ss.addEventListener) ss.addEventListener('voiceschanged', pickVoice);
  ss.onvoiceschanged = pickVoice;
  setTimeout(pickVoice, 400);
  setTimeout(pickVoice, 1200);

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });

  window.ByeolTTS = { unlock: unlock, voice: function () { return picked; } };
})();
