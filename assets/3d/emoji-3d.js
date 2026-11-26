/* assets/3d/emoji-3d.js — 별별 탐험대 3D 이모지 공용 스크립트 (build.py가 만든다)
   페이지의 글자 이모지를 3D 그림으로 바꿔 준다. index.html과 같은 표를 쓴다. */
(function () {
  'use strict';
  var self = document.currentScript;
  var BASE = 'assets/3d/';
  if (self && self.src) BASE = self.src.replace(/emoji-3d\.js.*$/, '');
  var EMOJI_3D = {
    '⏰':'alarm_clock', '⏹':'stop_button', '▶':'play_button', '●':'red_circle', '☀':'sun', '☁':'cloud',
    '☂':'umbrella', '⚪':'white_circle', '⚫':'black_circle', '⚽':'soccer_ball', '⚾':'baseball', '⛄':'snowman_without_snow',
    '⛵':'sailboat', '⛷':'skier', '✂':'scissors', '✅':'check_mark_button', '✈':'airplane', '✍':'writing_hand',
    '✏':'pencil', '✨':'sparkles', '❄':'snowflake', '❓':'red_question_mark', '⬛':'black_large_square', '⬜':'white_large_square',
    '⭐':'star', '🃏':'joker', '🌈':'rainbow', '🌉':'bridge_at_night', '🌊':'water_wave', '🌙':'crescent_moon',
    '🌟':'glowing_star', '🌤':'sun_behind_small_cloud', '🌧':'cloud_with_rain', '🌬':'wind_face', '🌰':'chestnut', '🌱':'seedling',
    '🌳':'deciduous_tree', '🌴':'palm_tree', '🌸':'cherry_blossom', '🌻':'sunflower', '🌼':'blossom', '🌾':'sheaf_of_rice',
    '🌿':'herb', '🍁':'maple_leaf', '🍃':'leaf_fluttering_in_wind', '🍂':'fallen_leaf', '🍇':'grapes', '🍉':'watermelon', '🍊':'tangerine',
    '🍌':'banana', '🍎':'red_apple', '🍓':'strawberry', '🍜':'steaming_bowl', '🍞':'bread', '🍠':'roasted_sweet_potato',
    '🍦':'soft_ice_cream', '🍩':'doughnut', '🍪':'cookie', '🍬':'candy', '🍰':'shortcake', '🍲':'pot_of_food',
    '🍳':'cooking', '🍽':'fork_and_knife_with_plate', '🎀':'ribbon', '🎁':'wrapped_gift', '🎄':'christmas_tree', '🎈':'balloon',
    '🎉':'party_popper', '🎒':'backpack', '🎙':'studio_microphone', '🎟':'admission_tickets', '🎡':'ferris_wheel', '🎣':'fishing_pole',
    '🎨':'artist_palette', '🎯':'bullseye', '🎲':'game_die', '🎷':'saxophone', '🎸':'guitar', '🎹':'musical_keyboard', '🎺':'trumpet',
    '🎻':'violin', '🏆':'trophy', '🏖':'beach_with_umbrella', '🏞':'national_park', '🏠':'house', '🏡':'house_with_garden', '🏫':'school',
    '🐍':'snake', '🐎':'horse', '🐑':'ewe', '🐕':'dog', '🐘':'elephant', '🐙':'octopus', '🐛':'bug', '🐾':'paw_prints',
    '🐜':'ant', '🐞':'lady_beetle', '🐟':'fish', '🐢':'turtle', '🐣':'hatching_chick', '🐤':'baby_chick',
    '🐥':'front-facing_baby_chick', '🐦':'bird', '🐭':'mouse_face', '🐯':'tiger_face', '🐰':'rabbit_face', '🐱':'cat_face',
    '🐳':'spouting_whale', '🐶':'dog_face', '🐷':'pig_face', '🐸':'frog', '🐻':'bear', '🐿':'chipmunk',
    '👃':'nose', '👋':'waving_hand', '👏':'clapping_hands', '👑':'crown', '👒':'womans_hat', '👕':'t-shirt',
    '👦':'boy', '👧':'girl', '👨':'man', '👩':'woman', '👴':'old_man', '👵':'old_woman',
    '👶':'baby', '💌':'love_letter', '💕':'two_hearts', '💧':'droplet', '💪':'flexed_biceps', '💬':'speech_balloon',
    '💾':'floppy_disk', '📏':'straight_ruler', '📐':'triangular_ruler', '📖':'open_book', '📚':'books', '📤':'outbox_tray',
    '📦':'package', '🔊':'speaker_high_volume', '🔈':'speaker_low_volume', '🔇':'muted_speaker', '🔁':'repeat_button', '🔍':'magnifying_glass_tilted_left', '🔎':'magnifying_glass_tilted_right', '🔑':'key', '🔒':'locked', '🔓':'unlocked',
    '🔔':'bell', '🔢':'input_numbers', '🔤':'input_latin_letters', '🔥':'fire', '🔦':'flashlight', '🔴':'red_circle',
    '🔵':'blue_circle', '🔺':'red_triangle', '🕒':'three_oclock', '🕐':'one_oclock', '🕑':'two_oclock', '🕓':'four_oclock', '🕔':'five_oclock', '🕕':'six_oclock', '🕖':'seven_oclock', '🕗':'eight_oclock', '🕘':'nine_oclock', '🕙':'ten_oclock', '🕚':'eleven_oclock', '🕛':'twelve_oclock', '🕜':'one-thirty', '🕝':'two-thirty', '🕟':'four-thirty', '🕠':'five-thirty', '🕡':'six-thirty', '🕢':'seven-thirty', '🕣':'eight-thirty', '🕤':'nine-thirty', '🕥':'ten-thirty', '🕦':'eleven-thirty', '🕧':'twelve-thirty', '🕞':'three-thirty', '🕯':'candle', '🖍':'crayon',
    '🗑':'wastebasket', '🗣':'speaking_head', '😊':'smiling_face_with_smiling_eyes', '😠':'angry_face', '😡':'pouting_face', '😢':'crying_face',
    '😴':'sleeping_face', '🚀':'rocket', '🚑':'ambulance', '🚒':'fire_engine', '🚁':'helicopter', '🚂':'locomotive', '🚌':'bus', '🚦':'vertical_traffic_light', '🚐':'minibus',
    '🚓':'police_car', '🚨':'police_car_light', '🚩':'triangular_flag', '🚕':'taxi', '🚗':'automobile', '🚚':'delivery_truck', '🚢':'ship', '🚪':'door',
    '🚲':'bicycle', '🛏':'bed', '🛴':'kick_scooter', '🟠':'orange_circle', '🟡':'yellow_circle', '🟢':'green_circle',
    '🟣':'purple_circle', '🟤':'brown_circle', '🟥':'red_square', '🟦':'blue_square', '🟨':'yellow_square', '🟩':'green_square',
    '🟪':'purple_square', '🤖':'robot', '🥁':'drum', '🥄':'spoon', '🥚':'egg', '🥛':'glass_of_milk',
    '🥝':'kiwi_fruit', '🥢':'chopsticks', '🥤':'cup_with_straw', '🥵':'hot_face', '🥶':'cold_face', '🦁':'lion',
    '🦆':'duck', '🦊':'fox', '🦋':'butterfly', '🦓':'zebra', '🦉':'owl', '🦛':'hippopotamus', '🦩':'flamingo',
    '🦵':'leg', '🧀':'cheese_wedge', '🧠':'brain', '🧣':'scarf', '🧯':'fire_extinguisher', '🧺':'basket', '🧁':'cupcake', '🧃':'beverage_box', '🧊':'ice', '🧢':'billed_cap',
    '🧤':'gloves', '🧩':'puzzle_piece', '🧸':'teddy_bear', '🧹':'broom', '🪑':'chair', '🪣':'bucket', '🧻':'roll_of_paper', '🧽':'sponge',
    '🩷':'pink_heart', '🪀':'yo-yo', '🪘':'long_drum', '🪢':'knot', '🪥':'toothbrush',};
  var EMOJI_SRC = '(?:' + Object.keys(EMOJI_3D).sort(function (a, b) { return b.length - a.length; }).join('|') + ')\uFE0F?';
  var EMOJI_TEST = new RegExp(EMOJI_SRC);
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TITLE: 1, OPTION: 1, SELECT: 1,
               CANVAS: 1, SVG: 1, NOSCRIPT: 1, INPUT: 1, TEMPLATE: 1 };

  function emojiImg(slug) {
    var img = document.createElement('img');
    img.className = 'emoji-3d';
    img.src = BASE + slug + '.webp';
    img.alt = '';
    img.draggable = false;
    img.setAttribute('aria-hidden', 'true');
    img.addEventListener('error', function () { img.classList.add('emoji-3d-missing'); });
    return img;
  }

  function fragment(text) {
    var re = new RegExp(EMOJI_SRC, 'g');
    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var run = [m[0]];
      var pos = m.index + m[0].length;
      while (pos < text.length) {
        re.lastIndex = pos;
        var m2 = re.exec(text);
        if (!m2 || m2.index !== pos) break;
        run.push(m2[0]);
        pos = m2.index + m2[0].length;
      }
      if (run.length > 1) {
        var box = document.createElement('span');
        box.className = 'emo-run';
        run.forEach(function (ch) {
          var slug = EMOJI_3D[ch.replace(/\uFE0F/g, '')];
          if (slug) box.appendChild(emojiImg(slug));
        });
        frag.appendChild(box);
      } else {
        frag.appendChild(emojiImg(EMOJI_3D[run[0].replace(/\uFE0F/g, '')]));
      }
      last = pos;
      re.lastIndex = pos;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function hydrate(root) {
    if (!root || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !EMOJI_TEST.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
          if (p.className && String(p.className).indexOf('no-emoji') >= 0) return NodeFilter.FILTER_REJECT;
          if (p === root) break;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var targets = [], n;
    while ((n = walker.nextNode())) targets.push(n);
    targets.forEach(function (node) {
      if (node.parentNode) node.parentNode.replaceChild(fragment(node.nodeValue), node);
    });
  }

  var mo = null, queued = false;
  function sweep() {
    queued = false;
    if (mo) mo.disconnect();
    hydrate(document.body);
    if (mo) mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function queue() {
    if (queued) return;
    queued = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(sweep);
    else setTimeout(sweep, 16);
  }
  function start() {
    hydrate(document.body);
    if (!window.MutationObserver) return;
    mo = new MutationObserver(queue);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.Byeol3D = { hydrate: hydrate, sweep: sweep, map: EMOJI_3D, base: BASE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
