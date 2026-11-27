/* ══════════════════════════════════════════════════════════════
   별별 탐험대 · 가족 동기화 + 부모 폰 원격 제어 (sync.js)
   ══════════════════════════════════════════════════════════════
   - 로그인 전에는 아무 것도 하지 않습니다. 앱은 예전처럼
     localStorage('byeol-tamheomdae-v3')만으로 100% 동작합니다.
   - 부모 계정(Supabase, 가족 공용 1개)으로 로그인하면 아이 기록(book)과
     부모 설정(settings)을 서버에 올리고, 화면이 떠 있는 동안 60초마다
     내려받아 부모 폰에서 바꾼 값을 적용합니다.
   - 부모 폰은 parent.html 에서 같은 계정으로 들어옵니다.
   - anon key 는 공개되어도 되는 키입니다(RLS로 로그인한 부모 계정만 읽기·쓰기).
     service_role 키는 절대 넣지 않습니다.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── 서버 주소 (배포 시 채움) ────────────────────────────── */
  var SUPABASE_URL = 'https://bwdawpcdqqurfjtdnvux.supabase.co';   /* byeol-family (서울) */
  var SUPABASE_ANON_KEY = 'sb_publishable_owTr_uL0zLT8pmG-3M_Nkg_sH_CjyMS';   /* 공개용 publishable key — RLS로 부모 계정만 접근 */

  var LS_KEY = 'byeol-family-sync-v1';
  var FAMILY_ID = 'family';
  var POLL_MS = 60000;
  var PUSH_DELAY = 1500;

  var DEFAULTS = {
    ytMinutes: 20,          /* 유튜브 키즈 한 번에 보는 시간(분) */
    ytDailySessions: 0,     /* 하루에 볼 수 있는 횟수 (0 = 제한 없음) */
    rewardNeed: 2,          /* 보상을 열려면 오늘 마칠 학습 횟수 */
    dailyCap: 2,            /* 별 지도에 하루 붙일 수 있는 별 수 */
    lockOn: false,          /* 사용 시간 제한 켜기 */
    lockStart: '21:00',
    lockEnd: '07:00',
    remoteLock: false,      /* 부모가 지금 잠금 */
    bonusDate: '',          /* 오늘만 연장한 날짜 */
    bonusMinutes: 0         /* 오늘만 연장한 시간(분) */
  };

  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function nowMs() { return Date.now(); }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function omitT(o) {
    if (!o || typeof o !== 'object') return o;
    var c = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && k !== 't') c[k] = o[k];
    return c;
  }

  /* ── 저장된 연결 정보 ───────────────────────────────────── */
  var cfg = { url: '', anonKey: '', email: '', session: null, lastSync: 0, settings: null, settingsT: 0, bookT: 0 };
  (function loadCfg() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return;
      if (typeof o.url === 'string') cfg.url = o.url;
      if (typeof o.anonKey === 'string') cfg.anonKey = o.anonKey;
      if (typeof o.email === 'string') cfg.email = o.email;
      if (o.session && typeof o.session === 'object') cfg.session = o.session;
      if (typeof o.lastSync === 'number') cfg.lastSync = o.lastSync;
      if (o.settings && typeof o.settings === 'object') cfg.settings = o.settings;
      if (typeof o.settingsT === 'number') cfg.settingsT = o.settingsT;
      if (typeof o.bookT === 'number') cfg.bookT = o.bookT;
    } catch (e) { /* 저장본이 깨졌으면 로그인 전 상태로 시작 */ }
  })();

  function saveCfg() {
    try {
      global.localStorage.setItem(LS_KEY, JSON.stringify({
        url: cfg.url, anonKey: cfg.anonKey, email: cfg.email,
        session: cfg.session, lastSync: cfg.lastSync,
        settings: cfg.settings, settingsT: cfg.settingsT, bookT: cfg.bookT
      }));
    } catch (e) { /* 저장 실패해도 이번 실행은 계속 */ }
  }

  function endpoint() { return (cfg.url || SUPABASE_URL || '').replace(/\/+$/, ''); }
  function anonKey() { return cfg.anonKey || SUPABASE_ANON_KEY || ''; }
  function signedIn() { return !!(cfg.session && cfg.session.access_token && endpoint() && anonKey()); }

  /* ── HTTP ──────────────────────────────────────────────── */
  function headers(extra) {
    var h = { 'apikey': anonKey(), 'Content-Type': 'application/json' };
    if (cfg.session && cfg.session.access_token) h['Authorization'] = 'Bearer ' + cfg.session.access_token;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    return h;
  }

  function request(method, path, body, extra) {
    var url = endpoint() + path;
    var opt = { method: method, headers: headers(extra), cache: 'no-store' };
    if (body !== undefined && body !== null) opt.body = JSON.stringify(body);
    return fetch(url, opt).then(function (res) {
      return res.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = t; }
        if (!res.ok) {
          var err = new Error('HTTP ' + res.status);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  /* ── 로그인/세션 ────────────────────────────────────────── */
  function setSession(tok) {
    cfg.session = tok ? {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: nowMs() + (num(tok.expires_in, 3600) * 1000) - 30000,
      user: tok.user ? { id: tok.user.id, email: tok.user.email } : null
    } : null;
    saveCfg();
  }

  function signIn(email, password) {
    return request('POST', '/auth/v1/token?grant_type=password', { email: email, password: password })
      .then(function (tok) {
        if (!tok || !tok.access_token) throw new Error('로그인 응답이 비어 있어요');
        setSession(tok);
        if (tok.user && tok.user.email) cfg.email = tok.user.email;
        saveCfg();
        emit();
        return syncNow(true);
      });
  }

  function refreshSession() {
    if (!cfg.session || !cfg.session.refresh_token) return Promise.reject(new Error('세션이 없어요'));
    return request('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: cfg.session.refresh_token })
      .then(function (tok) {
        if (!tok || !tok.access_token) throw new Error('세션을 이어 가지 못했어요');
        setSession(tok);
        return tok;
      });
  }

  function ensureToken() {
    if (!signedIn()) return Promise.reject(Object.assign(new Error('로그인이 필요해요'), { code: 'signed_out' }));
    if (cfg.session.expires_at && cfg.session.expires_at > nowMs()) return Promise.resolve();
    return refreshSession().catch(function () {
      cfg.session = null;
      saveCfg();
      emit();
      throw Object.assign(new Error('로그인이 만료됐어요'), { code: 'signed_out' });
    });
  }

  /* ── 앱과 잇는 다리 ─────────────────────────────────────── */
  var app = null;   /* { getBook, applyBook, applySettings } */

  function attach(a) {
    app = a || null;
    if (signedIn()) setTimeout(function () { syncNow(false); }, 800);
  }

  /* ── 설정(부모가 정한 값) ───────────────────────────────── */
  function normalizeSettings(s) {
    var out = {};
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k];
    if (s && typeof s === 'object') {
      out.ytMinutes = Math.min(180, Math.max(5, Math.round(num(s.ytMinutes, out.ytMinutes))));
      out.ytDailySessions = Math.min(9, Math.max(0, Math.round(num(s.ytDailySessions, 0))));
      out.rewardNeed = Math.min(5, Math.max(1, Math.round(num(s.rewardNeed, out.rewardNeed))));
      out.dailyCap = Math.min(10, Math.max(0, Math.round(num(s.dailyCap, out.dailyCap))));
      out.lockOn = !!s.lockOn;
      out.lockStart = /^\d\d:\d\d$/.test(s.lockStart) ? s.lockStart : out.lockStart;
      out.lockEnd = /^\d\d:\d\d$/.test(s.lockEnd) ? s.lockEnd : out.lockEnd;
      out.remoteLock = !!s.remoteLock;
      out.bonusDate = typeof s.bonusDate === 'string' ? s.bonusDate : '';
      out.bonusMinutes = Math.min(240, Math.max(0, Math.round(num(s.bonusMinutes, 0))));
      out.syncedAt = num(s.syncedAt, 0);
    }
    return out;
  }

  function settings() { return normalizeSettings(cfg.settings); }

  function setLocalSettings(partial) {
    var prev = settings();
    var s = settings();
    for (var k in partial) if (Object.prototype.hasOwnProperty.call(partial, k)) s[k] = partial[k];
    s = normalizeSettings(s);
    s.syncedAt = nowMs();
    cfg.settings = s;
    cfg.settingsT = nowMs();
    saveCfg();
    applySettingsToApp(prev, s);
    emit();
    if (signedIn()) pushSettings().catch(function () {});
    return s;
  }

  function applySettingsToApp(prev, next, extra) {
    if (!app || typeof app.applySettings !== 'function') return;
    var bonusNow = next.bonusDate === todayStr() ? next.bonusMinutes : 0;
    var bonusPrev = prev ? (prev.bonusDate === todayStr() ? prev.bonusMinutes : 0) : 0;
    try {
      app.applySettings(next, {
        bonusTotal: bonusNow,
        bonusDelta: Math.max(0, bonusNow - bonusPrev),
        scheduleChanged: !prev || prev.lockOn !== next.lockOn || prev.lockStart !== next.lockStart || prev.lockEnd !== next.lockEnd
      });
    } catch (e) {}
  }

  /* ── 아이 기록 병합 ────────────────────────────────────── */
  /* 별·기록이 사라지지 않게: 세는 값은 큰 쪽, 목록은 합집합,
     진도는 강별 최고값, 나머지(판에 붙인 별·이름 등)는 최신 기록 우선. */
  function maxNum(a, b) { return Math.max(num(a, 0), num(b, 0)); }
  function docT(b) { return num(b && b.t, 0); }

  function mergeLessons(a, b) {
    var out = {};
    function take(src) {
      if (!src || typeof src !== 'object') return;
      for (var key in src) {
        if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
        var v = src[key] || {};
        var cur = out[key] || { done: {}, part: {} };
        if (v.done && typeof v.done === 'object') {
          for (var n in v.done) if (Object.prototype.hasOwnProperty.call(v.done, n) && v.done[n]) cur.done[n] = true;
        }
        if (v.part && typeof v.part === 'object') {
          for (var m in v.part) {
            if (!Object.prototype.hasOwnProperty.call(v.part, m)) continue;
            cur.part[m] = maxNum(cur.part[m], v.part[m]);
          }
        }
        out[key] = cur;
      }
    }
    take(a); take(b);
    return out;
  }

  function unionById(a, b) {
    var out = [], seen = {};
    function take(list) {
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        var key = (it && typeof it === 'object' && it.id != null) ? ('id:' + it.id) : ('j:' + JSON.stringify(it));
        if (seen[key]) continue;
        seen[key] = 1;
        out.push(it);
      }
    }
    take(a); take(b);
    return out;
  }

  function mergeDaily(a, b) {
    if (!a || typeof a !== 'object') return b || { date: '', count: 0 };
    if (!b || typeof b !== 'object') return a;
    var da = String(a.date || ''), db = String(b.date || '');
    if (da === db) return { date: da, count: maxNum(a.count, b.count) };
    return da > db ? { date: da, count: num(a.count, 0) } : { date: db, count: num(b.count, 0) };
  }

  function mergeReward(a, b) {
    if (!a || typeof a !== 'object') return b || null;
    if (!b || typeof b !== 'object') return a;
    var da = String(a.date || ''), db = String(b.date || '');
    if (da !== db) {
      var win = da > db ? a : b;
      var other = da > db ? b : a;
      return {
        date: win.date,
        lessons: num(win.lessons, 0),
        sessions: num(win.sessions, 0),
        endsAt: Math.max(num(win.endsAt, 0), num(other.endsAt, 0) > nowMs() ? num(other.endsAt, 0) : 0)
      };
    }
    /* 보상 타이머는 '나중에 쓴 기록'을 따른다 — 끝낸 타이머(endsAt=0)가
       예전 값 때문에 되살아나지 않게. 부모님 연장은 설정(bonusMinutes)으로 온다. */
    var newer = docT(a) >= docT(b) ? a : b;
    return {
      date: da,
      lessons: maxNum(a.lessons, b.lessons),
      sessions: maxNum(a.sessions, b.sessions),
      endsAt: Math.max(0, num(newer.endsAt, 0))
    };
  }

  function mergeBook(local, remote) {
    if (!remote || typeof remote !== 'object') return local;
    if (!local || typeof local !== 'object') return remote;
    var lt = docT(local), rt = docT(remote);
    var newer = lt >= rt ? local : remote;
    return {
      t: Math.max(lt, rt),
      name: newer.name,
      childAge: newer.childAge,
      profileSet: !!newer.profileSet,
      age: num(newer.age, 0),
      stars: maxNum(local.stars, remote.stars),
      used: maxNum(local.used, remote.used),
      spent: maxNum(local.spent, remote.spent),
      tickets: maxNum(local.tickets, remote.tickets),
      placed: num(newer.placed, 0),
      lessons: mergeLessons(local.lessons, remote.lessons),
      daily: mergeDaily(local.daily, remote.daily),
      coupons: unionById(local.coupons, remote.coupons),
      requests: unionById(local.requests, remote.requests),
      gift: newer.gift || (lt >= rt ? remote.gift : local.gift) || null,
      reward: mergeReward(local.reward, remote.reward)
    };
  }

  /* ── 서버 통신 ─────────────────────────────────────────── */
  var state = { busy: false, error: '', lastSync: cfg.lastSync || 0, pending: false };
  var listeners = [];
  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](status()); } catch (e) {}
    }
    renderCard();
    updateLock();
  }
  function onStatus(cb) { if (typeof cb === 'function') listeners.push(cb); }

  function status() {
    return {
      signedIn: signedIn(),
      email: (cfg.session && cfg.session.user && cfg.session.user.email) || cfg.email || '',
      lastSync: state.lastSync,
      busy: state.busy,
      pending: state.pending,
      error: state.error,
      settings: settings()
    };
  }

  function rowIdPath(extra) {
    return '/rest/v1/family_state?id=eq.' + encodeURIComponent(FAMILY_ID) + (extra || '');
  }

  function pullOnce() {
    return request('GET', rowIdPath('&select=book,settings,book_updated_at,settings_updated_at'))
      .then(function (rows) { return (rows && rows[0]) || null; });
  }

  function pushBook(book) {
    var data = book;
    if (!data && app && typeof app.getBook === 'function') {
      try { data = app.getBook(); } catch (e) { data = null; }
    }
    if (!data) return Promise.resolve();
    return ensureToken().then(function () {
      return request('PATCH', rowIdPath(),
        { book: data, book_updated_at: docT(data), updated_at: new Date().toISOString() },
        { 'Prefer': 'return=minimal' });
    });
  }

  function pushSettings() {
    var s = settings();
    return ensureToken().then(function () {
      return request('PATCH', rowIdPath(),
        { settings: s, settings_updated_at: cfg.settingsT || nowMs(), updated_at: new Date().toISOString() },
        { 'Prefer': 'return=minimal' });
    });
  }

  /* 행이 아직 없으면 만든다 (가족 1행) */
  function createRow(book) {
    var body = {
      id: FAMILY_ID,
      book: book || {},
      settings: settings(),
      book_updated_at: docT(book),
      settings_updated_at: cfg.settingsT || nowMs()
    };
    return request('POST', '/rest/v1/family_state', body, { 'Prefer': 'resolution=ignore-duplicates,return=minimal' });
  }

  function syncNow(force) {
    if (!signedIn()) { state.error = '로그인이 필요해요'; emit(); return Promise.resolve(false); }
    if (state.busy) return Promise.resolve(false);
    state.busy = true; state.error = ''; emit();
    var prevSettings = settings();

    return ensureToken()
      .then(function () { return pullOnce(); })
      .then(function (row) {
        if (!row) {
          /* 서버에 아직 없다: 이 태블릿 기록으로 만든다 */
          var book0 = null;
          try { book0 = app && typeof app.getBook === 'function' ? app.getBook() : null; } catch (e) {}
          return createRow(book0).then(function () {
            state.lastSync = nowMs(); cfg.lastSync = state.lastSync; saveCfg();
            return true;
          });
        }

        var remoteBook = row.book && typeof row.book === 'object' ? row.book : null;
        var remoteSettings = row.settings && typeof row.settings === 'object' ? row.settings : null;
        var remoteSettingsT = num(row.settings_updated_at, 0);

        /* 1) 부모 설정: 서버가 더 최신이면 적용 */
        var changedSettings = false;
        if (remoteSettings && (remoteSettingsT > cfg.settingsT || !cfg.settings)) {
          cfg.settings = normalizeSettings(remoteSettings);
          cfg.settingsT = remoteSettingsT;
          changedSettings = true;
        } else if (!cfg.settings) {
          cfg.settings = normalizeSettings(null);
          cfg.settingsT = cfg.settingsT || nowMs();
        }

        /* 2) 아이 기록 병합 */
        var localBook = null;
        try { localBook = app && typeof app.getBook === 'function' ? app.getBook() : null; } catch (e) {}
        var merged = mergeBook(localBook, remoteBook);

        var remoteJson = remoteBook ? JSON.stringify(omitT(remoteBook)) : '';
        var localJson = localBook ? JSON.stringify(omitT(localBook)) : '';
        var mergedJson = merged ? JSON.stringify(omitT(merged)) : '';
        var needPush = !!merged && mergedJson !== remoteJson;

        if (merged && mergedJson !== localJson && app && typeof app.applyBook === 'function') {
          try { app.applyBook(merged); } catch (e) {}
        }
        if (changedSettings) applySettingsToApp(prevSettings, settings());

        state.lastSync = nowMs();
        cfg.lastSync = state.lastSync;
        if (merged) cfg.bookT = Math.max(cfg.bookT || 0, docT(merged));
        saveCfg();

        /* 태블릿 '기기 설정'에서 직접 바꾼 잠금 설정도 부모 쪽과 맞춘다 */
        var lockChanged = false;
        try {
          var lk = app && typeof app.getLockSettings === 'function' ? app.getLockSettings() : null;
          if (lk && (!!cfg.settings.lockOn !== !!lk.lockOn
            || cfg.settings.lockStart !== lk.lockStart
            || cfg.settings.lockEnd !== lk.lockEnd)) {
            cfg.settings = normalizeSettings(Object.assign({}, cfg.settings, lk));
            cfg.settingsT = nowMs();
            lockChanged = true;
          }
        } catch (e) {}

        var chain = Promise.resolve();
        if (needPush) chain = chain.then(function () { return pushBook(merged); });
        if (lockChanged) chain = chain.then(pushSettings);
        if (needPush && remoteSettingsT > cfg.settingsT) chain = chain.then(pushSettings);
        return chain.then(function () { return true; });
      })
      .then(function (ok) {
        state.busy = false; state.pending = false; state.error = ''; emit(); return ok;
      })
      .catch(function (e) {
        state.busy = false;
        if (e && e.code === 'signed_out') state.error = '로그인이 만료됐어요';
        else if (e && e.status === 401) { state.error = '로그인이 만료됐어요'; cfg.session = null; saveCfg(); }
        else if (e && e.status === 403) state.error = '권한이 없어요 (부모 계정으로 로그인해 주세요)';
        else state.error = '동기화하지 못했어요 (오프라인이면 이따 다시)';
        emit();
        return false;
      });
  }

  /* ── 자동 동기화 ───────────────────────────────────────── */
  var pushTimer = null;
  function markDirty() {
    if (!signedIn()) return;
    state.pending = true;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      pushTimer = null;
      syncNow(false);
    }, PUSH_DELAY);
  }

  var pollTimer = null;
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      if (!signedIn()) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      syncNow(false);
    }, POLL_MS);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && signedIn()) syncNow(false);
    });
  }

  /* ── 잠금 (부모 원격 잠금 · 사용 시간 제한) ─────────────── */
  function minutesOf(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return -1;
    return (parseInt(m[1], 10) % 24) * 60 + (parseInt(m[2], 10) % 60);
  }

  function scheduledLock(s) {
    if (!s || !s.lockOn) return false;
    var d = new Date();
    var cur = d.getHours() * 60 + d.getMinutes();
    var a = minutesOf(s.lockStart), b = minutesOf(s.lockEnd);
    if (a < 0 || b < 0 || a === b) return false;
    if (a < b) return cur >= a && cur < b;
    return cur >= a || cur < b;   /* 자정을 넘는 시간대 (예: 21:00~07:00) */
  }

  /* sync.js 가 직접 덮는 잠금은 '부모가 지금 잠금' 하나뿐이다.
     시간 제한(잠금 시작·끝)은 앱 안의 잠금 화면(state.lock)이 담당하고,
     부모 폰에서 바꾼 시각은 applySettings 로 그쪽 설정에 넣어 준다. */
  function locked() {
    return !!settings().remoteLock;
  }
  function remoteLocked() {
    return !!settings().remoteLock;
  }

  var lockTimer = null;
  function updateLock() {
    var el = typeof document !== 'undefined' ? document.getElementById('famLock') : null;
    if (!el) return;
    var s = settings();
    var guardianOpen = false;
    var g = document.getElementById('guardianSheet');
    if (g) guardianOpen = !g.hidden;
    var show = locked() && !guardianOpen;
    el.hidden = !show;
    if (show) {
      var sub = el.querySelector('.fam-lock-sub');
      var hint = el.querySelector('.fam-lock-hint');
      if (sub) {
        sub.textContent = s.remoteLock
          ? '부모님이 지금은 쉬는 시간으로 정했어요.'
          : '자는 시간이에요. 부모님이 정한 시간에 다시 열려요.';
      }
      if (hint) hint.textContent = s.remoteLock ? '부모님 폰에서 다시 열어 줄 수 있어요' : (s.lockStart + ' ~ ' + s.lockEnd + ' 동안 잠겨요');
    }
    if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
    if (s.remoteLock || s.lockOn) {
      lockTimer = setInterval(function () { updateLock(); }, 20000);
    }
  }

  /* ── 기기 설정 카드(가족 동기화) ────────────────────────── */
  var cardBuilt = false;
  function timeLabel(ts) {
    if (!ts) return '아직 없음';
    try {
      var d = new Date(ts);
      return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    } catch (e) { return '아직 없음'; }
  }

  function buildCard() {
    var host = document.getElementById('famSyncCard');
    if (!host || cardBuilt) return null;
    cardBuilt = true;
    host.innerHTML = [
      '<h3>가족 동기화 · 부모 폰 제어</h3>',
      '<p class="g-hint">부모 계정으로 연결하면 유민이의 별·기록이 부모님 폰과 같아지고, 부모님 폰에서 유튜브 시청 시간·잠금을 바꿀 수 있어요. 연결하지 않아도 이 태블릿은 그대로 쓸 수 있어요.</p>',
      '<p class="fam-state" id="famState">확인 중…</p>',
      '<div id="famLoginBox" hidden>',
      '  <label class="fam-field"><span>부모 이메일</span><input id="famEmail" type="email" inputmode="email" autocomplete="username" placeholder="thskek11@naver.com"></label>',
      '  <label class="fam-field"><span>비밀번호</span><input id="famPass" type="password" autocomplete="current-password" placeholder="부모 계정 비밀번호"></label>',
      '  <div class="g-actions"><button class="btn primary" id="famLogin" type="button">로그인</button></div>',
      '  <p class="g-hint">계정은 부모님 한 개를 같이 써요. 부모님 폰에서는 <b>parent.html</b> 을 열어 같은 계정으로 들어옵니다.</p>',
      '</div>',
      '<div id="famOnBox" hidden>',
      '  <p class="fam-line"><span>로그인</span><b id="famWho">—</b></p>',
      '  <p class="fam-line"><span>마지막 동기화</span><b id="famLast">—</b></p>',
      '  <p class="fam-line"><span>부모 설정</span><b id="famCfg">—</b></p>',
      '  <div class="g-actions">',
      '    <button class="btn primary" id="famNow" type="button">지금 동기화</button>',
      '    <button class="btn" id="famOut" type="button">로그아웃</button>',
      '  </div>',
      '</div>',
      '<p class="g-hint" id="famErr" role="status"></p>',
      '<div class="fam-sep" aria-hidden="true"></div>',
      '<p class="fam-line"><span>유튜브 키즈 하루 횟수</span><b id="famYtMax">제한 없음</b></p>',
      '<div class="chips" id="famYtChips" role="group" aria-label="유튜브 키즈 하루 횟수">',
      '  <button class="chip" type="button" data-ytmax="0">제한 없음</button>',
      '  <button class="chip" type="button" data-ytmax="1">1회</button>',
      '  <button class="chip" type="button" data-ytmax="2">2회</button>',
      '  <button class="chip" type="button" data-ytmax="3">3회</button>',
      '</div>',
      '<p class="g-hint">하루 횟수를 다 채우면 그날은 학습을 더 해도 유튜브 키즈가 열리지 않아요.</p>'
    ].join('\n');

    var login = document.getElementById('famLogin');
    if (login) login.addEventListener('click', function () {
      var em = (document.getElementById('famEmail').value || '').trim();
      var pw = document.getElementById('famPass').value || '';
      if (!em || !pw) { setErr('이메일과 비밀번호를 입력해 주세요.'); return; }
      login.disabled = true;
      setErr('로그인 중…');
      signIn(em, pw).then(function (ok) {
        login.disabled = false;
        document.getElementById('famPass').value = '';
        setErr(ok ? '' : (state.error || '로그인하지 못했어요.'));
      }).catch(function (e) {
        login.disabled = false;
        var d = e && e.data ? String(e.data.error_description || e.data.msg || e.data.message || '') : '';
        setErr(/invalid|grant/i.test(d) ? '이메일 또는 비밀번호가 맞지 않아요.' : '로그인하지 못했어요. 잠시 뒤 다시 해 주세요.');
      });
    });
    var now = document.getElementById('famNow');
    if (now) now.addEventListener('click', function () { now.disabled = true; syncNow(true).then(function () { now.disabled = false; }); });
    var out = document.getElementById('famOut');
    if (out) out.addEventListener('click', function () { logout(); });
    var chips = document.querySelectorAll('#famYtChips [data-ytmax]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        var v = Number(this.getAttribute('data-ytmax')) || 0;
        setLocalSettings({ ytDailySessions: v });
        renderCard();
        if (v) notify('유튜브 키즈는 하루 ' + v + '회까지 열려요');
        else notify('유튜브 키즈 횟수 제한을 없앴어요');
      });
    }
    var css = document.createElement('style');
    css.textContent = [
      '.fam-state{font-size:13px;font-weight:700;color:#8a86a8;margin:2px 0 10px;}',
      '.fam-state[data-on="1"]{color:#2f8a5b;}',
      '.fam-field{display:block;margin:8px 0;}',
      '.fam-field span{display:block;font-size:12px;font-weight:700;color:#6f6b8a;margin-bottom:4px;}',
      '.fam-field input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;border:1.5px solid #ded9ef;font-size:15px;background:#fff;}',
      '.fam-line{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;margin:5px 0;color:#6f6b8a;}',
      '.fam-line b{color:#332f52;font-weight:700;text-align:right;}',
      '.fam-sep{height:1px;background:#ece8f7;margin:14px 0 10px;}',
      '.fam-lock-sub{}'
    ].join('\n');
    document.head.appendChild(css);
    return host;
  }

  function notify(msg) {
    try {
      if (app && typeof app.toast === 'function') { app.toast(msg); return; }
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#2b2748;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px Pretendard,system-ui,sans-serif;z-index:10000;max-width:80vw;text-align:center';
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
    } catch (e) {}
  }

  function setErr(msg) {
    var el = document.getElementById('famErr');
    if (el) el.textContent = msg || '';
  }

  function renderCard() {
    var host = document.getElementById('famSyncCard');
    if (!host) return;
    if (!cardBuilt) buildCard();
    var st = status();
    var on = !!st.signedIn;
    var loginBox = document.getElementById('famLoginBox');
    var onBox = document.getElementById('famOnBox');
    var stateEl = document.getElementById('famState');
    if (loginBox) loginBox.hidden = on;
    if (onBox) onBox.hidden = !on;
    if (stateEl) {
      stateEl.textContent = on
        ? (st.busy ? '동기화하는 중…' : (st.error || '연결됨 · 부모 폰과 같은 기록을 써요'))
        : (endpoint() ? '아직 연결하지 않았어요 (이 태블릿에만 저장 중)' : '서버 주소가 설정되지 않았어요');
      stateEl.setAttribute('data-on', on ? '1' : '0');
    }
    if (on) {
      var who = document.getElementById('famWho');
      if (who) who.textContent = st.email || '부모 계정';
      var last = document.getElementById('famLast');
      if (last) last.textContent = timeLabel(st.lastSync);
      var c = document.getElementById('famCfg');
      if (c) {
        var s = st.settings;
        c.textContent = '유튜브 ' + s.ytMinutes + '분'
          + (s.bonusDate === todayStr() && s.bonusMinutes ? ' (+' + s.bonusMinutes + '분 연장)' : '')
          + ' · 학습 ' + s.rewardNeed + '회'
          + ' · ' + (s.remoteLock ? '지금 잠금' : '잠금 없음');
      }
    }
    setErr(on ? (st.error || '') : '');
    var ymax = document.getElementById('famYtMax');
    if (ymax) {
      var v = settings().ytDailySessions;
      ymax.textContent = v ? '하루 ' + v + '회' : '제한 없음';
    }
    var chips = document.querySelectorAll('#famYtChips [data-ytmax]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('on', Number(chips[i].getAttribute('data-ytmax')) === settings().ytDailySessions);
    }
  }

  function logout() {
    cfg.session = null;
    cfg.lastSync = 0;
    saveCfg();
    state.lastSync = 0; state.error = '';
    emit();
  }

  /* ── 잠금 화면 ─────────────────────────────────────────── */
  function injectLock() {
    if (typeof document === 'undefined' || document.getElementById('famLock')) return;
    if (!document.body) return;
    var style = document.createElement('style');
    style.textContent = [
      '#famLock{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;',
      'flex-direction:column;gap:14px;padding:28px;text-align:center;background:linear-gradient(160deg,#1d2447,#2b1d44 60%,#151a33);',
      'color:#f4f1ff;font-family:Pretendard,system-ui,-apple-system,sans-serif;}',
      '#famLock[hidden]{display:none;}',
      '#famLock .fam-lock-emoji{font-size:64px;line-height:1;}',
      '#famLock .fam-lock-title{font-size:26px;font-weight:800;letter-spacing:-.02em;}',
      '#famLock .fam-lock-sub{font-size:16px;color:#cfc9f5;line-height:1.55;max-width:22em;}',
      '#famLock .fam-lock-hint{margin-top:6px;font-size:13px;color:#9d97c9;}'
    ].join('');
    document.head.appendChild(style);
    var box = document.createElement('div');
    box.id = 'famLock';
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-label', '쉬는 시간');
    box.hidden = true;
    box.innerHTML = '<div class="fam-lock-emoji" aria-hidden="true">🌙</div>'
      + '<div class="fam-lock-title">지금은 쉬는 시간이야</div>'
      + '<div class="fam-lock-sub">부모님이 지금은 쉬는 시간으로 정했어요</div>'
      + '<div class="fam-lock-hint">부모님 폰에서 다시 열어 줄 수 있어요</div>';
    document.body.appendChild(box);
  }

  /* ── 공개 API ──────────────────────────────────────────── */
  var api = {
    attach: attach,
    settings: settings,
    setLocalSettings: setLocalSettings,
    signedIn: signedIn,
    status: status,
    onStatus: onStatus,
    markDirty: markDirty,
    syncNow: syncNow,
    login: signIn,
    logout: logout,
    locked: locked,
    remoteLocked: remoteLocked,
    refreshLock: updateLock,
    today: todayStr,
    configure: function (url, key) {
      cfg.url = String(url || '').replace(/\/+$/, '');
      cfg.anonKey = String(key || '');
      saveCfg(); emit();
    },
    hasEndpoint: function () { return !!(endpoint() && anonKey()); },
    _mergeBook: mergeBook,
    _normalizeSettings: normalizeSettings,
    _cfg: cfg
  };
  global.ByeolFamily = api;

  function boot() {
    injectLock();
    buildCard();
    if (signedIn()) { startPolling(); syncNow(false); }
    else renderCard();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : this);
