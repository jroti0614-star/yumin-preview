# 3D 이모지 일러스트 (assets/3d)

별별 탐험대가 쓰는 이모지 그림입니다. 모두 **Microsoft Fluent Emoji** 의 3D PNG를
192×192 WebP로 줄여 담았습니다.

- 원본: https://github.com/microsoft/fluentui-emoji (`assets/<이름>/3D/<이름>_3d.png`)
- 라이선스: MIT (Copyright © Microsoft Corporation). 같이 들어 있는
  `LICENSE-fluentui-emoji.txt` 를 참고하세요. 앱에 그대로 포함해도 됩니다.

## 쓰는 방법

`app.js` 의 `EMOJI_3D` 표가 `이모지 → 파일 이름` 을 정합니다.
화면에 이모지 글자가 나타나면 자동으로 `<img class="emoji-3d" src="assets/3d/<이름>.webp">`
로 바뀝니다(직접 마크업을 고칠 필요 없음).

```js
var EMOJI_3D = { '🍎': 'red_apple', '⭐': 'star', ... };
```

본편(`index.html`)은 앱 안에 들어 있는 변환기를 쓰고, 별도 페이지
(`stories.html` · `learning-center.html` · `story-rescue-01~10.html`)는
`emoji-3d.js` + `emoji-3d.css` 를 불러 같은 표로 같은 그림을 씁니다.

```html
<link rel="stylesheet" href="assets/3d/emoji-3d.css">
<script src="assets/3d/emoji-3d.js" defer></script>
```

## 다시 만들 때

1. `python3 work/byeol2/build.py` — 이모지 표에 적힌 파일이 모두 있는지 확인하고
   `index.html`(배포용), `downloads/yumin-launcher-preview.html`(단일 파일용),
   `assets/3d/emoji-3d.js` · `emoji-3d.css`(별도 페이지 공용)를 만듭니다.
2. `python3 work/byeol2/apply_pages_3d.py <페이지 폴더>` — 별도 페이지에 공용 파일 두 줄을 넣습니다.
3. 새 이모지를 추가하려면 fluentui-emoji에서 3D PNG를 받아 192px WebP로 줄여
   이 폴더에 넣고 `EMOJI_3D` 표에 한 줄 추가하면 됩니다.

## 목록 (258종, 이모지 → 파일)

| 이모지 | 파일 | 이모지 | 파일 | 이모지 | 파일 |
| --- | --- | --- | --- | --- | --- |
| `⏰` | `alarm_clock.webp` | `⏹` | `stop_button.webp` | `▶` | `play_button.webp` |
| `●` | `red_circle.webp` | `☀` | `sun.webp` | `☁` | `cloud.webp` |
| `☂` | `umbrella.webp` | `⚪` | `white_circle.webp` | `⚫` | `black_circle.webp` |
| `⚽` | `soccer_ball.webp` | `⚾` | `baseball.webp` | `⛄` | `snowman_without_snow.webp` |
| `⛵` | `sailboat.webp` | `⛷` | `skier.webp` | `✂` | `scissors.webp` |
| `✅` | `check_mark_button.webp` | `✈` | `airplane.webp` | `✍` | `writing_hand.webp` |
| `✏` | `pencil.webp` | `✨` | `sparkles.webp` | `❄` | `snowflake.webp` |
| `❓` | `red_question_mark.webp` | `⬛` | `black_large_square.webp` | `⬜` | `white_large_square.webp` |
| `⭐` | `star.webp` | `🃏` | `joker.webp` | `🌈` | `rainbow.webp` |
| `🌉` | `bridge_at_night.webp` | `🌊` | `water_wave.webp` | `🌙` | `crescent_moon.webp` |
| `🌟` | `glowing_star.webp` | `🌤` | `sun_behind_small_cloud.webp` | `🌧` | `cloud_with_rain.webp` |
| `🌬` | `wind_face.webp` | `🌰` | `chestnut.webp` | `🌱` | `seedling.webp` |
| `🌳` | `deciduous_tree.webp` | `🌴` | `palm_tree.webp` | `🌸` | `cherry_blossom.webp` |
| `🌻` | `sunflower.webp` | `🌼` | `blossom.webp` | `🌾` | `sheaf_of_rice.webp` |
| `🌿` | `herb.webp` | `🍁` | `maple_leaf.webp` | `🍃` | `leaf_fluttering_in_wind.webp` |
| `🍂` | `fallen_leaf.webp` | `🍇` | `grapes.webp` | `🍉` | `watermelon.webp` |
| `🍊` | `tangerine.webp` | `🍌` | `banana.webp` | `🍎` | `red_apple.webp` |
| `🍓` | `strawberry.webp` | `🍜` | `steaming_bowl.webp` | `🍞` | `bread.webp` |
| `🍠` | `roasted_sweet_potato.webp` | `🍦` | `soft_ice_cream.webp` | `🍩` | `doughnut.webp` |
| `🍪` | `cookie.webp` | `🍬` | `candy.webp` | `🍰` | `shortcake.webp` |
| `🍲` | `pot_of_food.webp` | `🍳` | `cooking.webp` | `🍽` | `fork_and_knife_with_plate.webp` |
| `🎀` | `ribbon.webp` | `🎁` | `wrapped_gift.webp` | `🎄` | `christmas_tree.webp` |
| `🎈` | `balloon.webp` | `🎉` | `party_popper.webp` | `🎒` | `backpack.webp` |
| `🎙` | `studio_microphone.webp` | `🎟` | `admission_tickets.webp` | `🎡` | `ferris_wheel.webp` |
| `🎣` | `fishing_pole.webp` | `🎨` | `artist_palette.webp` | `🎯` | `bullseye.webp` |
| `🎲` | `game_die.webp` | `🎷` | `saxophone.webp` | `🎸` | `guitar.webp` |
| `🎹` | `musical_keyboard.webp` | `🎺` | `trumpet.webp` | `🎻` | `violin.webp` |
| `🏆` | `trophy.webp` | `🏖` | `beach_with_umbrella.webp` | `🏞` | `national_park.webp` |
| `🏠` | `house.webp` | `🏡` | `house_with_garden.webp` | `🏫` | `school.webp` |
| `🐍` | `snake.webp` | `🐎` | `horse.webp` | `🐑` | `ewe.webp` |
| `🐕` | `dog.webp` | `🐘` | `elephant.webp` | `🐙` | `octopus.webp` |
| `🐛` | `bug.webp` | `🐾` | `paw_prints.webp` | `🐜` | `ant.webp` |
| `🐞` | `lady_beetle.webp` | `🐟` | `fish.webp` | `🐢` | `turtle.webp` |
| `🐣` | `hatching_chick.webp` | `🐤` | `baby_chick.webp` | `🐥` | `front-facing_baby_chick.webp` |
| `🐦` | `bird.webp` | `🐭` | `mouse_face.webp` | `🐯` | `tiger_face.webp` |
| `🐰` | `rabbit_face.webp` | `🐱` | `cat_face.webp` | `🐳` | `spouting_whale.webp` |
| `🐶` | `dog_face.webp` | `🐷` | `pig_face.webp` | `🐸` | `frog.webp` |
| `🐻` | `bear.webp` | `🐿` | `chipmunk.webp` | `👃` | `nose.webp` |
| `👋` | `waving_hand.webp` | `👏` | `clapping_hands.webp` | `👑` | `crown.webp` |
| `👒` | `womans_hat.webp` | `👕` | `t-shirt.webp` | `👦` | `boy.webp` |
| `👧` | `girl.webp` | `👨` | `man.webp` | `👩` | `woman.webp` |
| `👴` | `old_man.webp` | `👵` | `old_woman.webp` | `👶` | `baby.webp` |
| `💌` | `love_letter.webp` | `💕` | `two_hearts.webp` | `💧` | `droplet.webp` |
| `💪` | `flexed_biceps.webp` | `💬` | `speech_balloon.webp` | `💾` | `floppy_disk.webp` |
| `📏` | `straight_ruler.webp` | `📐` | `triangular_ruler.webp` | `📖` | `open_book.webp` |
| `📚` | `books.webp` | `📤` | `outbox_tray.webp` | `📦` | `package.webp` |
| `🔊` | `speaker_high_volume.webp` | `🔈` | `speaker_low_volume.webp` | `🔇` | `muted_speaker.webp` |
| `🔁` | `repeat_button.webp` | `🔍` | `magnifying_glass_tilted_left.webp` | `🔎` | `magnifying_glass_tilted_right.webp` |
| `🔑` | `key.webp` | `🔒` | `locked.webp` | `🔓` | `unlocked.webp` |
| `🔔` | `bell.webp` | `🔢` | `input_numbers.webp` | `🔤` | `input_latin_letters.webp` |
| `🔥` | `fire.webp` | `🔦` | `flashlight.webp` | `🔴` | `red_circle.webp` |
| `🔵` | `blue_circle.webp` | `🔺` | `red_triangle.webp` | `🕒` | `three_oclock.webp` |
| `🕐` | `one_oclock.webp` | `🕑` | `two_oclock.webp` | `🕓` | `four_oclock.webp` |
| `🕔` | `five_oclock.webp` | `🕕` | `six_oclock.webp` | `🕖` | `seven_oclock.webp` |
| `🕗` | `eight_oclock.webp` | `🕘` | `nine_oclock.webp` | `🕙` | `ten_oclock.webp` |
| `🕚` | `eleven_oclock.webp` | `🕛` | `twelve_oclock.webp` | `🕜` | `one-thirty.webp` |
| `🕝` | `two-thirty.webp` | `🕟` | `four-thirty.webp` | `🕠` | `five-thirty.webp` |
| `🕡` | `six-thirty.webp` | `🕢` | `seven-thirty.webp` | `🕣` | `eight-thirty.webp` |
| `🕤` | `nine-thirty.webp` | `🕥` | `ten-thirty.webp` | `🕦` | `eleven-thirty.webp` |
| `🕧` | `twelve-thirty.webp` | `🕞` | `three-thirty.webp` | `🕯` | `candle.webp` |
| `🖍` | `crayon.webp` | `🗑` | `wastebasket.webp` | `🗣` | `speaking_head.webp` |
| `😊` | `smiling_face_with_smiling_eyes.webp` | `😠` | `angry_face.webp` | `😡` | `pouting_face.webp` |
| `😢` | `crying_face.webp` | `😴` | `sleeping_face.webp` | `🚀` | `rocket.webp` |
| `🚑` | `ambulance.webp` | `🚒` | `fire_engine.webp` | `🚁` | `helicopter.webp` |
| `🚂` | `locomotive.webp` | `🚌` | `bus.webp` | `🚦` | `vertical_traffic_light.webp` |
| `🚐` | `minibus.webp` | `🚓` | `police_car.webp` | `🚨` | `police_car_light.webp` |
| `🚩` | `triangular_flag.webp` | `🚕` | `taxi.webp` | `🚗` | `automobile.webp` |
| `🚚` | `delivery_truck.webp` | `🚢` | `ship.webp` | `🚪` | `door.webp` |
| `🚲` | `bicycle.webp` | `🛏` | `bed.webp` | `🛴` | `kick_scooter.webp` |
| `🟠` | `orange_circle.webp` | `🟡` | `yellow_circle.webp` | `🟢` | `green_circle.webp` |
| `🟣` | `purple_circle.webp` | `🟤` | `brown_circle.webp` | `🟥` | `red_square.webp` |
| `🟦` | `blue_square.webp` | `🟨` | `yellow_square.webp` | `🟩` | `green_square.webp` |
| `🟪` | `purple_square.webp` | `🤖` | `robot.webp` | `🥁` | `drum.webp` |
| `🥄` | `spoon.webp` | `🥚` | `egg.webp` | `🥛` | `glass_of_milk.webp` |
| `🥝` | `kiwi_fruit.webp` | `🥢` | `chopsticks.webp` | `🥤` | `cup_with_straw.webp` |
| `🥵` | `hot_face.webp` | `🥶` | `cold_face.webp` | `🦁` | `lion.webp` |
| `🦆` | `duck.webp` | `🦊` | `fox.webp` | `🦋` | `butterfly.webp` |
| `🦓` | `zebra.webp` | `🦉` | `owl.webp` | `🦛` | `hippopotamus.webp` |
| `🦩` | `flamingo.webp` | `🦵` | `leg.webp` | `🧀` | `cheese_wedge.webp` |
| `🧠` | `brain.webp` | `🧣` | `scarf.webp` | `🧯` | `fire_extinguisher.webp` |
| `🧺` | `basket.webp` | `🧁` | `cupcake.webp` | `🧃` | `beverage_box.webp` |
| `🧊` | `ice.webp` | `🧢` | `billed_cap.webp` | `🧤` | `gloves.webp` |
| `🧩` | `puzzle_piece.webp` | `🧸` | `teddy_bear.webp` | `🧹` | `broom.webp` |
| `🪑` | `chair.webp` | `🪣` | `bucket.webp` | `🧻` | `roll_of_paper.webp` |
| `🧽` | `sponge.webp` | `🩷` | `pink_heart.webp` | `🪀` | `yo-yo.webp` |
| `🪘` | `long_drum.webp` | `🪢` | `knot.webp` | `🪥` | `toothbrush.webp` |
