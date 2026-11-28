/* 별별 탐험대 2.0 · 아이용 탐험 본부
   기존 학습 기록(byeol-tamheomdae-v3)을 읽기만 하며, 별/쿠폰/학습 데이터를 변경하지 않습니다.
   그림책과 미션 보조 기록은 별도 키에 저장합니다. */
(function () {
  'use strict';
  var STATE_KEY = 'byeol-tamheomdae-v3';
  var V2_KEY = 'byeol-v2-child';
  var state = {};
  var extra = loadExtra();

  function loadState() {
    try { state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; }
    catch (e) { state = {}; }
  }
  function loadExtra() {
    try {
      var x = JSON.parse(localStorage.getItem(V2_KEY) || '{}');
      return x && typeof x === 'object' ? x : { missionDay: '', missionDone: false, books: [] };
    } catch (e) { return { missionDay: '', missionDone: false, books: [] }; }
  }
  function saveExtra() {
    try { localStorage.setItem(V2_KEY, JSON.stringify(extra)); } catch (e) {}
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function completedLessons() {
    var lessons = state.lessons || {}, count = 0;
    Object.keys(lessons).forEach(function(k) {
      var done = lessons[k] && lessons[k].done;
      if (done && typeof done === 'object') Object.keys(done).forEach(function(n) { if (done[n]) count++; });
    });
    return count;
  }
  function getProgress() {
    var n = completedLessons();
    var level = n >= 80 ? 5 : n >= 50 ? 4 : n >= 25 ? 3 : n >= 10 ? 2 : 1;
    var names = ['새싹 탐험가','꼬마 탐험가','용감한 구조대원','별빛 수호대','은하계 대장','전설의 탐험대'];
    var next = [10,25,50,80,120][level-1] || 120;
    return { count:n, level:level, name:names[level-1], next:next, pct:Math.min(100,Math.round((n/(next||120))*100)) };
  }
  var missions = [
    {id:'hangul',icon:'🔤',title:'기역 구조 작전',desc:'한글 별에서 오늘의 글자 놀이를 해요',tab:'learn'},
    {id:'math',icon:'🔢',title:'숫자 탐험 작전',desc:'수학 별에서 숫자 문제를 풀어요',tab:'learn'},
    {id:'board',icon:'⭐',title:'별빛 지도 정리',desc:'모은 별로 별 지도에 별을 붙여요',tab:'board'},
    {id:'story',icon:'📖',title:'이야기 구조 작전',desc:'이야기 구조대에서 한 편을 만나 봐요',tab:'learn'}
  ];
  function currentMission() {
    if (extra.missionDay !== today()) {
      extra.missionDay = today(); extra.missionDone = false; saveExtra();
    }
    var idx = Math.floor(new Date().getDate() % missions.length);
    return missions[idx];
  }
  function addStyles() {
    if (document.getElementById('byeolV2Style')) return;
    var css = `
      #panelExplore{padding-bottom:24px}
      .v2-hero{border-radius:22px;padding:20px;background:linear-gradient(135deg,#eef0ff,#fff7f0);border:1px solid #e4defb;margin-bottom:14px}
      .v2-hero h2{font-size:22px;margin:0 0 5px;color:#302b55}.v2-hero p{margin:0;color:#716b91;font-size:13px}
      .v2-character{display:flex;align-items:center;gap:14px;margin-top:16px}
      .v2-avatar{width:76px;height:76px;border-radius:24px;background:#fff;display:grid;place-items:center;font-size:42px;box-shadow:0 5px 16px #6d5bd51c}
      .v2-rank{font-weight:800;font-size:17px}.v2-xp{font-size:12px;color:#77718f;margin-top:4px}
      .v2-progress{height:9px;border-radius:99px;background:#e5e1f4;overflow:hidden;margin-top:9px}.v2-progress i{display:block;height:100%;background:linear-gradient(90deg,#8c7af5,#ffc66d);border-radius:99px}
      .v2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-bottom:14px}
      .v2-card{background:#fff;border:1px solid #e9e5f5;border-radius:18px;padding:15px;box-shadow:0 4px 14px #4030800a;min-width:0}
      .v2-card h3{font-size:15px;margin:0 0 7px;color:#383354}.v2-card p{font-size:12px;color:#77718f;line-height:1.5;margin:0 0 10px}
      .v2-icon{font-size:25px;margin-bottom:8px}.v2-btn{border:0;border-radius:12px;background:#6b5be7;color:#fff;padding:10px 13px;font-weight:800;font-size:12px}
      .v2-btn.secondary{background:#f0edff;color:#5548bb}.v2-btn:disabled{opacity:.5}
      .v2-mission{display:flex;align-items:center;gap:12px}.v2-mission .v2-icon{font-size:32px;margin:0}
      .v2-book-form{display:grid;gap:9px}.v2-book-form input,.v2-book-form textarea{width:100%;border:1px solid #e4def3;border-radius:12px;padding:11px;font:inherit;font-size:14px;background:#fff;color:#302b55}
      .v2-book-form textarea{min-height:100px;resize:vertical;line-height:1.6}
      .v2-books{display:grid;gap:9px;margin-top:12px}.v2-book{border:1px solid #e9e5f5;border-radius:14px;padding:12px;background:#fff}
      .v2-book strong{display:block;font-size:14px;margin-bottom:5px}.v2-book p{white-space:pre-wrap;margin:0 0 8px;font-size:12px;line-height:1.6;color:#655f7e}
      .v2-empty{color:#8c87a1;font-size:12px;padding:10px 0}
      .v2-app-links{margin:0 0 14px;padding:15px;background:#fff;border:1px solid #e9e5f5;border-radius:18px;box-shadow:0 4px 14px #4030800a}
      .v2-app-links h3{margin:0 0 5px;font-size:16px;color:#383354}
      .v2-app-links p{margin:0 0 11px;font-size:12px;line-height:1.5;color:#77718f}
      .v2-app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .v2-app-btn{display:flex;align-items:center;gap:9px;min-width:0;padding:11px;border:1px solid #e8e4f4;border-radius:13px;background:#faf9ff;color:#393451;text-align:left}
      .v2-app-btn:active{transform:scale(.98)}
      .v2-app-btn .ico{font-size:23px;flex:0 0 auto}
      .v2-app-btn .meta{min-width:0;display:flex;flex-direction:column;gap:2px}
      .v2-app-btn strong{font-size:13px}
      .v2-app-btn small{font-size:10px;color:#8a849e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:380px){.v2-grid{grid-template-columns:1fr}.v2-hero{padding:16px}}
    `;
    var st=document.createElement('style');st.id='byeolV2Style';st.textContent=css;document.head.appendChild(st);
  }
  function addLearningAppLinks() {
    var panel=document.getElementById('panelLearn');
    if(!panel || document.getElementById('v2LearningAppLinks')) return;
    var card=document.createElement('section');
    card.className='v2-app-links';
    card.id='v2LearningAppLinks';
    card.innerHTML='<h3>📲 연결된 학습 앱</h3><p>메인페이지에서 연결한 앱을 여기서도 바로 실행할 수 있어요.</p><div class="v2-app-grid">'+
      '<button class="v2-app-btn" type="button" data-v2-slot="hangul"><span class="ico">✏️</span><span class="meta"><strong>한글</strong><small>연결된 한글 앱 열기</small></span></button>'+
      '<button class="v2-app-btn" type="button" data-v2-slot="math"><span class="ico">🔢</span><span class="meta"><strong>수학</strong><small>연결된 수학 앱 열기</small></span></button>'+
      '<button class="v2-app-btn" type="button" data-v2-slot="lang"><span class="ico">🔤</span><span class="meta"><strong>언어</strong><small>연결된 언어 앱 열기</small></span></button>'+
      '<button class="v2-app-btn" type="button" data-v2-slot="library"><span class="ico">📚</span><span class="meta"><strong>도서관</strong><small>연결된 도서관 앱 열기</small></span></button></div>';
    panel.insertBefore(card,panel.firstChild);
    card.querySelectorAll('[data-v2-slot]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var key=btn.getAttribute('data-v2-slot');
        var homeTile=document.querySelector('#launchGrid [data-slot="'+key+'"]');
        if(homeTile) homeTile.click();
        else alert('메인페이지 앱 연결 기능을 찾지 못했어요. 앱을 새로고침해 주세요.');
      });
    });
  }
  function makePanel() {
    if (document.getElementById('panelExplore')) return;
    var main=document.getElementById('main'), nav=document.querySelector('.tabbar-inner');
    if (!main || !nav) return;
    var panel=document.createElement('section');
    panel.className='panel';panel.id='panelExplore';panel.hidden=true;panel.setAttribute('aria-label','2.0 탐험 본부');
    panel.innerHTML=`
      <div class="v2-hero">
        <h2>🚀 별별 탐험 본부</h2><p>오늘의 임무를 완수하고 나만의 이야기를 만들어 봐요.</p>
        <div class="v2-character"><div class="v2-avatar" id="v2Avatar">🚓</div><div style="flex:1;min-width:0"><div class="v2-rank" id="v2Rank">새싹 탐험가</div><div class="v2-xp" id="v2Xp">완료한 학습 0개</div><div class="v2-progress"><i id="v2Progress" style="width:0%"></i></div></div></div>
      </div>
      <div class="v2-card" style="margin-bottom:14px">
        <div class="v2-mission"><div class="v2-icon" id="v2MissionIcon">🚨</div><div style="flex:1;min-width:0"><h3 id="v2MissionTitle">오늘의 구조 미션</h3><p id="v2MissionDesc">오늘의 임무를 확인해요.</p></div></div>
        <button class="v2-btn" id="v2MissionGo" type="button">미션 시작하기</button>
        <button class="v2-btn secondary" id="v2MissionDone" type="button" style="margin-left:6px">완료했어요</button>
        <p id="v2MissionState" style="margin:9px 0 0;font-size:11px;color:#77718f"></p>
      </div>
`;
    main.appendChild(panel);
    var tab=document.createElement('button');tab.className='tab';tab.type='button';tab.dataset.tab='explore';tab.innerHTML='<span aria-hidden="true">🚀</span><b>탐험</b>';
    var guardian=nav.querySelector('[data-tab="guardian"]');
    nav.insertBefore(tab,guardian||null);
    tab.addEventListener('click',function(){switchExplore();});
    document.getElementById('v2MissionGo').addEventListener('click',function(){
      var m=currentMission();
      if(m.tab==='board') clickTab('board'); else clickTab('learn');
    });
    document.getElementById('v2MissionDone').addEventListener('click',function(){
      extra.missionDone=true;saveExtra();render(); 
    });
    render();
  }
  function clickTab(name) {
    var b=document.querySelector('.tab[data-tab="'+name+'"]');
    if(b)b.click();
  }
  function switchExplore() {
    document.querySelectorAll('main.wrap > .panel').forEach(function(p){p.hidden=p.id!=='panelExplore';});
    document.querySelectorAll('.tabbar .tab').forEach(function(b){b.classList.toggle('on',b.dataset.tab==='explore');});
    document.body.setAttribute('data-tab','explore');window.scrollTo({top:0,behavior:'smooth'});render();
  }
  function render() {
    loadState();
    var p=getProgress(), mission=currentMission();
    var avatar=['🚓','🚒','🚁','🛸','🚀','🌟'][p.level-1]||'🚓';
    document.getElementById('v2Avatar').textContent=avatar;
    document.getElementById('v2Rank').textContent=p.name;
    document.getElementById('v2Xp').textContent='완료한 학습 '+p.count+'개 · '+p.level+'단계';
    document.getElementById('v2Progress').style.width=p.pct+'%';
    document.getElementById('v2Analysis').textContent=p.count+'개의 학습을 완료했어요. 꾸준히 도전하면 '+(p.next-p.count)+'개 뒤에 다음 단계로 성장해요.';
    document.getElementById('v2MissionIcon').textContent=mission.icon;
    document.getElementById('v2MissionTitle').textContent=mission.title;
    document.getElementById('v2MissionDesc').textContent=mission.desc;
    document.getElementById('v2MissionState').textContent=extra.missionDone?'오늘의 미션을 완료했어요! 멋져요 ⭐':'미션을 시작하고 완료하면 체크해 둘 수 있어요.';
    document.getElementById('v2MissionDone').disabled=!!extra.missionDone;
    document.getElementById('v2MissionDone').textContent=extra.missionDone?'오늘 미션 완료 ✓':'완료했어요';

  }
  function boot() {
    addStyles();makePanel();addLearningAppLinks();
    if(!document.getElementById('panelExplore'))return;
    window.addEventListener('storage',function(e){if(e.key===STATE_KEY)render();});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
  }
  function wait() {
    if(document.getElementById('main')&&document.querySelector('.tabbar-inner'))boot();
    else setTimeout(wait,80);
  }
  wait();
})();