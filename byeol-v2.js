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
    var c=extra.car;
    if (!c.paint) c.paint='blue';
    if (!c.wheels) c.wheels='standard';
    if (!c.decal) c.decal='star';
    if (!c.light) c.light='redblue';
    if (!c.accessory) c.accessory='none';
    if (!Array.isArray(c.owned)) {
      c.owned=['paint:blue','wheels:standard','decal:star','light:redblue','accessory:none'];
      var n=completedLessons();
      if(n>=3)c.owned.push('paint:red');
      if(n>=6)c.owned.push('paint:yellow');
      if(n>=4)c.owned.push('wheels:sport');
      if(n>=8)c.owned.push('decal:lightning');
      [['paint',c.paint],['wheels',c.wheels],['decal',c.decal],['light',c.light],['accessory',c.accessory]].forEach(function(x){
        var key=x[0]+':'+x[1]; if(c.owned.indexOf(key)<0)c.owned.push(key);
      });
      saveExtra();
    }
    [['paint','blue'],['wheels','standard'],['decal','star'],['light','redblue'],['accessory','none']].forEach(function(x){
      var key=x[0]+':'+x[1]; if(c.owned.indexOf(key)<0)c.owned.push(key);
    });
  }
  function carOptions() {
    return {
      paint:[
        {id:'blue',label:'파란 순찰차',price:0,icon:'🔵'},
        {id:'red',label:'빨간 구조차',price:2,icon:'🔴'},
        {id:'yellow',label:'노란 안전차',price:2,icon:'🟡'},
        {id:'pink',label:'분홍 드림카',price:3,icon:'🩷'},
        {id:'black',label:'검정 야간차',price:3,icon:'⚫'}
      ],
      wheels:[
        {id:'standard',label:'기본 바퀴',price:0,icon:'⚙️'},
        {id:'sport',label:'스포츠 바퀴',price:2,icon:'🏎️'},
        {id:'offroad',label:'험로 바퀴',price:3,icon:'🛞'}
      ],
      decal:[
        {id:'star',label:'별 스티커',price:0,icon:'⭐'},
        {id:'lightning',label:'번개 스티커',price:1,icon:'⚡'},
        {id:'rainbow',label:'무지개 스티커',price:2,icon:'🌈'},
        {id:'paw',label:'발바닥 스티커',price:2,icon:'🐾'}
      ],
      light:[
        {id:'redblue',label:'빨강·파랑 경광등',price:0,icon:'🚨'},
        {id:'gold',label:'황금 경광등',price:2,icon:'✨'},
        {id:'rainbow',label:'무지개 경광등',price:3,icon:'🌈'}
      ],
      accessory:[
        {id:'none',label:'기본 지붕',price:0,icon:'🚓'},
        {id:'spoiler',label:'레이싱 스포일러',price:2,icon:'🏁'},
        {id:'antenna',label:'통신 안테나',price:2,icon:'📡'},
        {id:'cargo',label:'구조 장비',price:3,icon:'🧰'}
      ]
    };
  }
  function isCarItemOwned(type,item){ensureCar();return extra.car.owned.indexOf(type+':'+item.id)>=0;}
  function carIllustration(paint,wheels,decal,light,accessory) {
    var colors={blue:'#4f91e8',red:'#e76b68',yellow:'#f1bd45',pink:'#e98dbb',black:'#596579'};
    var body=colors[paint]||colors.blue;
    var rim=wheels==='sport'?'#f7bd48':(wheels==='offroad'?'#9caa76':'#dce5f0');
    var mark={
      lightning:'<path d="M76 43 L68 54 L75 54 L70 65 L86 49 L78 49 L82 43 Z" fill="#fff7bd"/>',
      rainbow:'<path d="M69 56 Q77 39 85 56" fill="none" stroke="#ff6b75" stroke-width="3"/><path d="M72 56 Q77 45 82 56" fill="none" stroke="#ffd45d" stroke-width="3"/>',
      paw:'<circle cx="73" cy="48" r="3" fill="#fff7bd"/><circle cx="80" cy="46" r="3" fill="#fff7bd"/><circle cx="86" cy="49" r="3" fill="#fff7bd"/><path d="M75 56 Q79 49 84 56 Q85 62 80 61 Q73 62 75 56Z" fill="#fff7bd"/>'
    }[decal]||'<path d="M77 44 L79 49 L85 49 L80 53 L82 59 L77 55 L72 59 L74 53 L69 49 L75 49 Z" fill="#fff7bd"/>';
    var lights=light==='gold'
      ? '<rect x="61" y="17" width="36" height="6" rx="3" fill="#f5c84d" stroke="#735a20" stroke-width="1"/>'
      : light==='rainbow'
      ? '<rect x="61" y="17" width="12" height="6" rx="2" fill="#f16b77"/><rect x="73" y="17" width="12" height="6" fill="#f5c84d"/><rect x="85" y="17" width="12" height="6" rx="2" fill="#66b8ec"/>'
      : '<rect x="61" y="17" width="18" height="6" rx="3" fill="#ef6b79"/><rect x="79" y="17" width="18" height="6" rx="3" fill="#5b9cf0"/>';
    var addon=accessory==='spoiler'
      ? '<path d="M105 31 L119 27 L123 31 L109 36Z" fill="#34445b" stroke="#26364a" stroke-width="1.5"/>'
      : accessory==='antenna'
      ? '<path d="M99 27 L105 8" stroke="#34445b" stroke-width="2.5" stroke-linecap="round"/><circle cx="105" cy="8" r="3" fill="#ef6b79"/>'
      : accessory==='cargo'
      ? '<rect x="83" y="7" width="25" height="10" rx="3" fill="#e2a94f" stroke="#76562d" stroke-width="1.5"/><path d="M89 7 V17 M101 7 V17" stroke="#fff1c7" stroke-width="1.5"/>'
      : '';
    var wheelR=wheels==='offroad'?14:12, wheelInner=wheels==='offroad'?7:6;
    return '<svg viewBox="0 0 140 88" role="img" aria-label="내가 꾸민 출동 자동차">'+
      '<path d="M15 54 Q17 46 27 45 L39 44 L51 27 Q54 23 62 23 H91 Q99 23 104 31 L116 45 L126 47 Q132 49 132 56 V66 H10 V59 Q10 55 15 54Z" fill="'+body+'" stroke="#36506f" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="M47 43 L57 29 Q59 27 64 27 H75 V43Z" fill="#dff4ff" stroke="#36506f" stroke-width="2"/><path d="M80 27 H91 Q95 27 99 33 L108 43 H80Z" fill="#dff4ff" stroke="#36506f" stroke-width="2"/>'+
      lights+addon+'<path d="M12 57 H130" stroke="#fff" stroke-width="3" opacity=".8"/>'+mark+
      '<circle cx="38" cy="66" r="'+wheelR+'" fill="#28364b"/><circle cx="38" cy="66" r="'+wheelInner+'" fill="'+rim+'" stroke="#fff" stroke-width="1.5"/>'+
      '<circle cx="105" cy="66" r="'+wheelR+'" fill="#28364b"/><circle cx="105" cy="66" r="'+wheelInner+'" fill="'+rim+'" stroke="#fff" stroke-width="1.5"/>'+
      '<path d="M19 51 H28 M119 51 H127" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  function ticketBalance(){
    try { return window.__byeol && window.__byeol.mapState ? Number(window.__byeol.mapState().tickets)||0 : 0; }
    catch(e){ return 0; }
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
    var opts=carOptions(), c=extra.car;
    var equipped={paint:c.paint,wheels:c.wheels,decal:c.decal,light:c.light,accessory:c.accessory};
    var preview=c.preview&&opts[c.preview.type] ? c.preview : null;
    var type=preview?preview.type:'paint';
    var value=preview?preview.value:equipped[type];
    var item=(opts[type]||[]).filter(function(x){return x.id===value;})[0]||opts.paint[0];
    var owned=isCarItemOwned(type,item), active=equipped[type]===item.id;
    var homeArt=document.getElementById('v2HomeCarArt'),homeDesc=document.getElementById('v2HomeCarDesc');
    var homeSvg=carIllustration(c.paint,c.wheels,c.decal,c.light,c.accessory);
    if(homeArt){homeArt.innerHTML=homeSvg;homeArt.setAttribute('data-paint',c.paint);}
    if(homeDesc)homeDesc.textContent='나만의 '+(opts.paint.filter(function(x){return x.id===c.paint;})[0]||opts.paint[0]).label;
    var art=document.getElementById('v2CarArt'),meta=document.getElementById('v2CarMeta');
    if(art){var shown={paint:c.paint,wheels:c.wheels,decal:c.decal,light:c.light,accessory:c.accessory};shown[type]=item.id;art.innerHTML=carIllustration(shown.paint,shown.wheels,shown.decal,shown.light,shown.accessory);art.setAttribute('data-paint',shown.paint);}
    if(meta)meta.textContent=(owned?(active?'현재 장착 중':'보유 아이템 · 장착 가능'):'미리보기 · 구매 전')+' · '+item.label;
    var balance=document.getElementById('v2CouponBalance');
    if(balance)balance.textContent='🎟️ 소원 쿠폰 '+ticketBalance()+'장';
    var box=document.getElementById('v2CarOptions');if(!box)return;
    var groups=[['paint','차체 색상',opts.paint],['wheels','바퀴',opts.wheels],['decal','스티커',opts.decal],['light','경광등',opts.light],['accessory','추가 장비',opts.accessory]];
    box.innerHTML=groups.map(function(g){
      return '<div class="v2-car-group"><strong>'+g[1]+'</strong><div class="v2-car-options">'+g[2].map(function(x){
        var has=isCarItemOwned(g[0],x),selected=(preview&&preview.type===g[0])?preview.value===x.id:equipped[g[0]]===x.id;
        var stateText=has?(equipped[g[0]]===x.id?'장착 중':'보유'):(x.price+'장');
        return '<button type="button" class="v2-car-option'+(selected?' active':'')+(has?' owned':'')+'" data-car-type="'+g[0]+'" data-car-value="'+x.id+'"><span>'+x.icon+'</span><b>'+x.label+'</b><small>'+(has?stateText:'🎟️ '+stateText)+'</small></button>';
      }).join('')+'</div></div>';
    }).join('');
    var action=document.getElementById('v2CarAction');
    if(action){
      action.disabled=active || (!owned && ticketBalance()<item.price);
      action.textContent=active?'✓ 현재 장착 중':owned?'이 아이템 장착하기':'🎟️ 쿠폰 '+item.price+'장으로 구매하고 장착';
    }
    var reset=document.getElementById('v2CarReset');
    if(reset)reset.disabled=!preview;
  }
  function selectCarPreview(type,value){
    ensureCar();extra.car.preview={type:type,value:value};renderCar();
  }
  function applyCarSelection(){
    ensureCar();
    var c=extra.car,opts=carOptions(),p=c.preview;
    if(!p||!opts[p.type])return;
    var item=(opts[p.type]||[]).filter(function(x){return x.id===p.value;})[0];
    if(!item)return;
    if(isCarItemOwned(p.type,item)){
      if(c[p.type]===item.id)return;
      c[p.type]=item.id;c.preview=null;saveExtra();renderCar();return;
    }
    if(ticketBalance()<item.price)return;
    var result=window.__byeol&&window.__byeol.spendTickets?window.__byeol.spendTickets(item.price):{ok:false};
    if(!result||!result.ok){renderCar();return;}
    var key=p.type+':'+item.id;
    if(c.owned.indexOf(key)<0)c.owned.push(key);
    c[p.type]=item.id;c.preview=null;
    saveExtra();renderCar();
    var status=document.getElementById('v2CarMessage');
    if(status)status.textContent='새 꾸미기 아이템을 얻었어요! 내 차에 장착했어요.';
  }
  function bindCarOptions() {
    var box=document.getElementById('v2CarOptions');if(!box||box.dataset.bound==='1')return;
    box.dataset.bound='1';
    box.addEventListener('click',function(e){
      var btn=e.target.closest('[data-car-type][data-car-value]');if(!btn)return;
      selectCarPreview(btn.getAttribute('data-car-type'),btn.getAttribute('data-car-value'));
    });
    var action=document.getElementById('v2CarAction');
    if(action&&!action.dataset.bound){action.dataset.bound='1';action.addEventListener('click',applyCarSelection);}
    var reset=document.getElementById('v2CarReset');
    if(reset&&!reset.dataset.bound){reset.dataset.bound='1';reset.addEventListener('click',function(){extra.car.preview=null;renderCar();});}
  }

  function makePanel() {
    if (document.getElementById('panelExplore')) return;
    var main=document.getElementById('main'), nav=document.querySelector('.tabbar-inner');
    if (!main || !nav) return;
    var panel=document.createElement('section');
    panel.className='panel';panel.id='panelExplore';panel.hidden=true;panel.setAttribute('aria-label','나만의 차량 차고');
    panel.innerHTML=`
      <div class="v2-garage">
        <div class="v2-garage-title"><div><h2>🚓 나만의 차고</h2><p>쿠폰으로 내 출동 차량을 꾸며 봐요!</p></div><strong id="v2CouponBalance">🎟️ 소원 쿠폰 0장</strong></div>
        <div class="v2-car-preview"><div class="v2-car-art" id="v2CarArt" data-paint="blue"></div><div class="v2-car-preview-copy"><strong>내 차량 미리보기</strong><div class="v2-car-meta" id="v2CarMeta">파란 순찰차</div></div></div>
        <div class="v2-garage-subtitle">꾸미고 싶은 부분을 골라 보세요</div>
        <div id="v2CarOptions"></div>
        <div class="v2-car-actions"><button class="v2-btn" id="v2CarAction" type="button">아이템 장착하기</button><button class="v2-btn secondary" id="v2CarReset" type="button">원래 차량 보기</button></div>
        <p class="v2-car-message" id="v2CarMessage" aria-live="polite">구매한 아이템은 언제든 다시 장착할 수 있어요.</p>
      </div>`;
    main.appendChild(panel);
    var tab=document.createElement('button');tab.className='tab';tab.type='button';tab.dataset.tab='explore';tab.innerHTML='<span aria-hidden="true">🚓</span><b>차고</b>';
    var guardian=nav.querySelector('[data-tab="guardian"]');
    nav.insertBefore(tab,guardian||null);
    tab.addEventListener('click',function(){switchExplore();});
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
    renderCar();
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