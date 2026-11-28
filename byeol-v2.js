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
    {id:'hangul',icon:'🔤',title:'한글 구조 작전',desc:'한글 별에서 새로운 학습 한 강을 완료해요',tab:'learn'},
    {id:'math',icon:'🔢',title:'숫자 탐험 작전',desc:'수학 별에서 새로운 학습 한 강을 완료해요',tab:'learn'},
    {id:'board',icon:'⭐',title:'별빛 지도 정리',desc:'모은 별을 별 지도에 한 개 붙여요',tab:'board'},
    {id:'english',icon:'🔠',title:'영어 탐험 작전',desc:'영어 별에서 새로운 학습 한 강을 완료해요',tab:'learn'}
  ];
  function currentMission() {
    if (extra.missionDay !== today()) {
      extra.missionDay = today();
      extra.missionDone = false;
      extra.missionStarted = false;
      extra.missionBaseline = null;
      saveExtra();
    }
    var idx = Math.floor(new Date().getDate() % missions.length);
    return missions[idx];
  }
  function missionProgress(mission) {
    if (mission.id === 'board') return Math.max(0, Number(state.placed) || 0);
    var lessons = state.lessons || {}, count = 0, suffix = '-' + mission.id;
    Object.keys(lessons).forEach(function(key) {
      if (key.slice(-suffix.length) !== suffix) return;
      var done = lessons[key] && lessons[key].done;
      if (done && typeof done === 'object') {
        Object.keys(done).forEach(function(n) { if (done[n]) count++; });
      }
    });
    return count;
  }
  function checkMissionProgress(mission) {
    if (extra.missionDone || !extra.missionStarted || extra.missionDay !== today()) return;
    var baseline = Number(extra.missionBaseline);
    if (!Number.isFinite(baseline)) return;
    if (missionProgress(mission) > baseline) {
      extra.missionDone = true;
      extra.missionCompletedAt = Date.now();
      saveExtra();
    }
  }
  function addStyles() {
    if (document.getElementById('byeolV2Style')) return;
    var css = `
      #panelExplore{padding-bottom:24px}#panelExplore[hidden],body:not([data-tab="explore"]) #panelExplore{display:none!important}body[data-tab="explore"] #panelExplore:not([hidden]){display:block!important}
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

      .v2-homecar{display:flex;align-items:center;gap:14px;padding:14px 16px;margin:0 0 14px;border:1px solid #dfe7fb;border-radius:20px;background:linear-gradient(120deg,#eef5ff,#fff8e9);cursor:pointer;text-align:left;width:100%;color:#302b55}
      .v2-homecar-art,.v2-car-art{display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,#dceaff,#fff);font-size:54px;flex:0 0 92px;height:82px}
      .v2-homecar-art svg,.v2-car-art svg{display:block;width:100%;height:100%;max-width:140px}
      .v2-homecar-art[data-paint="blue"],.v2-car-art[data-paint="blue"]{background:linear-gradient(145deg,#cfe5ff,#f4f9ff)}
      .v2-homecar-art[data-paint="red"],.v2-car-art[data-paint="red"]{background:linear-gradient(145deg,#ffd7d7,#fff5f2)}
      .v2-homecar-art[data-paint="yellow"],.v2-car-art[data-paint="yellow"]{background:linear-gradient(145deg,#fff0b8,#fffaf0)}
      .v2-homecar-copy{flex:1;min-width:0}.v2-homecar-copy strong{display:block;font-size:16px}.v2-homecar-copy small{display:block;color:#77718f;font-size:12px;margin-top:4px}
      .v2-homecar-go{font-size:12px;font-weight:800;color:#5548bb;white-space:nowrap}
      .v2-garage{margin-top:14px;padding:16px;border-radius:20px;border:1px solid #e5e1f3;background:#fff}
      .v2-garage-head{font-size:17px;font-weight:800;color:#383354;margin-bottom:10px}
      .v2-car-preview{display:flex;align-items:center;gap:14px;padding:12px;border-radius:17px;background:#f7f8ff}
      .v2-car-preview .v2-car-art{height:92px;flex-basis:104px;font-size:60px}
      .v2-car-meta{font-size:12px;color:#77718f;line-height:1.6}
      .v2-car-group{margin-top:14px}.v2-car-group strong{display:block;font-size:13px;color:#4a4566;margin-bottom:8px}
      .v2-car-options{display:flex;flex-wrap:wrap;gap:7px}
      .v2-car-option{border:1px solid #e4def3;background:#fff;border-radius:999px;padding:8px 11px;font-size:12px;color:#554f70}
      .v2-car-option.active{border-color:#7765eb;background:#f0edff;color:#5143b7;font-weight:800}
      .v2-car-option:disabled{opacity:.45;background:#f6f5f9}
      .v2-car-note{font-size:11px;color:#8c87a1;margin-top:8px;line-height:1.5}
      @media(max-width:380px){.v2-homecar{gap:9px;padding:11px}.v2-homecar-art{flex-basis:70px;height:68px;font-size:43px}.v2-homecar-go{font-size:11px}.v2-car-preview .v2-car-art{flex-basis:82px}}
      @media(max-width:380px){.v2-grid{grid-template-columns:1fr}.v2-hero{padding:16px}}
    `;
    var st=document.createElement('style');st.id='byeolV2Style';st.textContent=css;document.head.appendChild(st);
  }
  function ensureCar() {
    if (!extra.car || typeof extra.car !== 'object') extra.car = {};
    if (!extra.car.paint) extra.car.paint = 'blue';
    if (!extra.car.wheels) extra.car.wheels = 'standard';
    if (!extra.car.decal) extra.car.decal = 'star';
  }
  function carOptions() {
    return {
      paint:[{id:'blue',label:'파란색',need:0},{id:'red',label:'빨간색',need:3},{id:'yellow',label:'노란색',need:6}],
      wheels:[{id:'standard',label:'기본 바퀴',need:0},{id:'sport',label:'스포츠 바퀴',need:4}],
      decal:[{id:'star',label:'별 스티커',need:0},{id:'lightning',label:'번개 스티커',need:8}]
    };
  }
  function isCarItemUnlocked(item){return completedLessons()>=item.need;}
  function carIllustration(paint,wheels,decal) {
    var colors={blue:'#4f91e8',red:'#e76b68',yellow:'#f1bd45'},body=colors[paint]||colors.blue;
    var rim=wheels==='sport'?'#f7bd48':'#dce5f0';
    var mark=decal==='lightning'?'<path d="M73 43 L67 54 L74 54 L70 64 L84 49 L77 49 L81 43 Z" fill="#fff7bd"/>':'<path d="M77 44 L79 49 L85 49 L80 53 L82 59 L77 55 L72 59 L74 53 L69 49 L75 49 Z" fill="#fff7bd"/>';
    return '<svg viewBox="0 0 140 88" role="img" aria-label="내가 꾸민 출동 자동차"><path d="M15 54 Q17 46 27 45 L39 44 L51 27 Q54 23 62 23 H91 Q99 23 104 31 L116 45 L126 47 Q132 49 132 56 V66 H10 V59 Q10 55 15 54Z" fill="'+body+'" stroke="#36506f" stroke-width="3" stroke-linejoin="round"/><path d="M47 43 L57 29 Q59 27 64 27 H75 V43Z" fill="#dff4ff" stroke="#36506f" stroke-width="2"/><path d="M80 27 H91 Q95 27 99 33 L108 43 H80Z" fill="#dff4ff" stroke="#36506f" stroke-width="2"/><rect x="61" y="17" width="18" height="6" rx="3" fill="#ef6b79"/><rect x="79" y="17" width="18" height="6" rx="3" fill="#5b9cf0"/><path d="M12 57 H130" stroke="#fff" stroke-width="3" opacity=".8"/>'+mark+'<circle cx="38" cy="66" r="12" fill="#28364b"/><circle cx="38" cy="66" r="6" fill="'+rim+'" stroke="#fff" stroke-width="1.5"/><circle cx="105" cy="66" r="12" fill="#28364b"/><circle cx="105" cy="66" r="6" fill="'+rim+'" stroke="#fff" stroke-width="1.5"/><path d="M19 51 H28 M119 51 H127" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  function makeHomeCarCard() {
    if(document.getElementById('v2HomeCar'))return;
    var home=document.getElementById('panelHome'),dash=home&&home.querySelector('.home-dash');
    if(!dash)return;
    var card=document.createElement('button');
    card.type='button';card.id='v2HomeCar';card.className='v2-homecar';
    card.innerHTML='<span class="v2-homecar-art" id="v2HomeCarArt">🚓</span><span class="v2-homecar-copy"><strong>🚨 나의 출동 차량</strong><small id="v2HomeCarDesc">내 차를 꾸며 보세요!</small></span><span class="v2-homecar-go">차고 열기 ›</span>';
    dash.parentNode.insertBefore(card,dash);
    card.addEventListener('click',function(){clickTab('explore');});
  }
  function renderCar() {
    ensureCar();
    var opts=carOptions(),n=completedLessons();
    var find=function(type){return opts[type].filter(function(x){return x.id===extra.car[type]&&isCarItemUnlocked(x);})[0]||opts[type][0];};
    var paint=find('paint'),wheels=find('wheels'),decal=find('decal');
    extra.car.paint=paint.id;extra.car.wheels=wheels.id;extra.car.decal=decal.id;
    var homeArt=document.getElementById('v2HomeCarArt'),homeDesc=document.getElementById('v2HomeCarDesc');
    if(homeArt){homeArt.innerHTML=carIllustration(paint.id,wheels.id,decal.id);homeArt.setAttribute('data-paint',paint.id);}
    if(homeDesc)homeDesc.textContent=paint.label+' · '+wheels.label+' · '+decal.label;
    var art=document.getElementById('v2CarArt'),meta=document.getElementById('v2CarMeta');
    if(art){art.innerHTML=carIllustration(paint.id,wheels.id,decal.id);art.setAttribute('data-paint',paint.id);}
    if(meta)meta.textContent=paint.label+' 차량 · '+wheels.label+' · '+decal.label;
    var box=document.getElementById('v2CarOptions');if(!box)return;
    var groups=[['paint','차량 색상',opts.paint],['wheels','바퀴',opts.wheels],['decal','스티커',opts.decal]];
    box.innerHTML=groups.map(function(g){return '<div class="v2-car-group"><strong>'+g[1]+'</strong><div class="v2-car-options">'+g[2].map(function(item){
      var unlocked=isCarItemUnlocked(item),active=extra.car[g[0]]===item.id;
      var label=unlocked?item.label:'🔒 '+item.label+' · 학습 '+item.need+'개';
      return '<button type="button" class="v2-car-option'+(active?' active':'')+'" data-car-type="'+g[0]+'" data-car-value="'+item.id+'" '+(unlocked?'':'disabled')+'>'+label+'</button>';
    }).join('')+'</div></div>';}).join('')+'<p class="v2-car-note">학습을 완료하면 새 꾸미기 아이템이 열려요. 현재 완료한 학습 '+n+'개</p>';
  }
  function bindCarOptions() {
    var box=document.getElementById('v2CarOptions');if(!box||box.dataset.bound==='1')return;
    box.dataset.bound='1';
    box.addEventListener('click',function(e){
      var btn=e.target.closest('[data-car-type][data-car-value]');if(!btn||btn.disabled)return;
      ensureCar();var type=btn.getAttribute('data-car-type'),value=btn.getAttribute('data-car-value');
      var item=(carOptions()[type]||[]).filter(function(x){return x.id===value;})[0];
      if(!item||!isCarItemUnlocked(item))return;
      extra.car[type]=value;saveExtra();renderCar();
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
        <p id="v2MissionState" style="margin:9px 0 0;font-size:11px;color:#77718f" aria-live="polite"></p>
      </div>
      <section class="v2-garage">
        <div class="v2-garage-head">🚓 나만의 출동 차량</div>
        <div class="v2-car-preview"><div class="v2-car-art" id="v2CarArt" data-paint="blue">🚓</div><div class="v2-car-meta" id="v2CarMeta">파란색 차량 · 기본 바퀴 · 별 스티커</div></div>
        <div id="v2CarOptions"></div>
      </section>
`;
    main.appendChild(panel);
    var tab=document.createElement('button');tab.className='tab';tab.type='button';tab.dataset.tab='explore';tab.innerHTML='<span aria-hidden="true">🚀</span><b>탐험</b>';
    var guardian=nav.querySelector('[data-tab="guardian"]');
    nav.insertBefore(tab,guardian||null);
    tab.addEventListener('click',function(){switchExplore();});
    document.getElementById('v2MissionGo').addEventListener('click',function(){
      var m=currentMission();
      loadState();
      if (!extra.missionStarted && !extra.missionDone) {
        extra.missionStarted = true;
        extra.missionBaseline = missionProgress(m);
        extra.missionStartedAt = Date.now();
        saveExtra();
      }
      if(m.tab==='board') clickTab('board'); else clickTab('learn');
      render();
    });
    render();
  }
  function clickTab(name) {
    var b=document.querySelector('.tab[data-tab="'+name+'"]');
    if(b)b.click();
  }
  function switchExplore() {
    document.querySelectorAll('main.wrap > .panel').forEach(function(p){p.hidden=p.id!=='panelExplore';if(p.id==='panelExplore')p.style.setProperty('display','block','important');else p.style.removeProperty('display');});
    document.querySelectorAll('.tabbar .tab').forEach(function(b){b.classList.toggle('on',b.dataset.tab==='explore');});
    document.body.setAttribute('data-tab','explore');window.scrollTo({top:0,behavior:'smooth'});render();
  }
  function render() {
    loadState();
    var p=getProgress(), mission=currentMission();
    renderCar();
    checkMissionProgress(mission);
    var avatar=['🚓','🚒','🚁','🛸','🚀','🌟'][p.level-1]||'🚓';
    document.getElementById('v2Avatar').textContent=avatar;
    document.getElementById('v2Rank').textContent=p.name;
    document.getElementById('v2Xp').textContent='완료한 학습 '+p.count+'개 · '+p.level+'단계';
    document.getElementById('v2Progress').style.width=p.pct+'%';
    document.getElementById('v2MissionIcon').textContent=mission.icon;
    document.getElementById('v2MissionTitle').textContent=mission.title;
    document.getElementById('v2MissionDesc').textContent=mission.desc;
    var go=document.getElementById('v2MissionGo');
    var status=document.getElementById('v2MissionState');
    if (extra.missionDone) {
      status.textContent='학습 기록이 확인되어 오늘의 미션을 자동 완료했어요! ⭐';
      go.textContent='오늘 미션 완료 ✓';
      go.disabled=true;
    } else if (extra.missionStarted) {
      status.textContent='미션 진행 중이에요. 해당 학습을 완료하면 자동으로 체크돼요.';
      go.textContent='학습 이어하기';
      go.disabled=false;
    } else {
      status.textContent='시작을 누른 뒤 실제 학습을 완료하면 자동으로 반영돼요.';
      go.textContent='미션 시작하기';
      go.disabled=false;
    }

  }
  function boot() {
    addStyles();makeHomeCarCard();makePanel();bindCarOptions();
    if(!document.getElementById('panelExplore'))return;
    window.addEventListener('storage',function(e){if(e.key===STATE_KEY || e.key===V2_KEY)render();});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
    window.setInterval(function(){ if(document.getElementById('panelExplore')) render(); }, 3000);
  }
  function wait() {
    if(document.getElementById('main')&&document.querySelector('.tabbar-inner'))boot();
    else setTimeout(wait,80);
  }
  wait();
})();