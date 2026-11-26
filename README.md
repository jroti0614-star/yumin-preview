# 유민이 학습 런처 · 웹 미리보기

유민이 태블릿(안드로이드)에 넣을 학습 런처의 웹 미리보기입니다.
홈은 **한글 · 수학 · 언어 · 도서관** 4칸 런처, **학습** 탭에 별별 탐험대(한글·수학·영어·그림 24강,
획순 애니메이션, 별 지도 14칸, 소원 쿠폰)가 들어 있습니다.

- 열기: https://jroti0614-star.github.io/yumin-preview/
- 파일
  - `index.html` — 런처 + 별별 탐험대 본편 (Jua 폰트 내장, `assets/3d/` 그림 참조)
  - `stories.html` · `learning-center.html` · `story-rescue-01~10.html` — 이야기 구조대 10편과 학습 관리(별도 페이지 12개)
  - `assets/3d/` — Microsoft Fluent Emoji 3D 257종 WebP + 별도 페이지 공용 `emoji-3d.js` · `emoji-3d.css`

## 화면

하단 탭 5개: **홈(런처) · 학습 · 별 지도 · 소원 쿠폰 · 보호자(PIN 1234)**

- **홈**: 한글·수학·언어·도서관 4칸. 각 칸에 연결된 앱 이름이 보이고, 누르면
  안드로이드 앱에서는 `window.YuminLauncherBridge.launchApp(pkg, name)`으로 실행, 브라우저에서는 실행 미리보기 안내를 띄웁니다.
  연결된 앱이 없으면 보호자 탭에서 고르라는 안내가 나옵니다.
- **학습**: 과목 카드(한글·수학·영어·그림)를 누르면 1~24강 목록 없이 지금 진행 중인 강이 곧바로 열립니다.
  한글 강은 ① 획순 배우기 → ② 문제 풀기 → ③ 따라쓰기 순서이고, 따라쓰기는 손을 떼는 순간 자동 판정합니다.
- **보호자**: 아이 정보·난이도, 진도, **런처 앱 연결**(프리셋 또는 직접 입력), **앱 업데이트 · 화면 고정**, 별 선물, 소원 쿠폰, 따라 말하기 녹음(최근 30건, IndexedDB 저장).
  앱 업데이트 · 화면 고정 카드는 안드로이드 앱(WebView 브리지)에서만 동작하고, 브라우저에서는 안내만 보여 줍니다.
  - `앱 업데이트 확인` → `YuminLauncherBridge.checkForUpdate()` → `version.json`(또는 Releases API) 확인 → 새 버전이면 `installUpdate(apkUrl, sha256)`
  - `화면 고정` → `setScreenPinning(true/false)`. 기본 꺼짐, 기기 소유자가 아니면 안드로이드 확인 창이 한 번 뜹니다.
- 3단계(도전)의 🗣️ 따라 말하기 녹음은 IndexedDB에 저장되어 새로고침해도 보호자 탭에서 다시 듣고 하나씩 지울 수 있습니다.

## 만든 방식

`work/byeol2/`(index.template.html · style.css · app.js · questions.js)를 `python3 work/byeol2/build.py`로
한 파일로 합쳐 `downloads/yumin-launcher-preview.html`을 만들고, 그 파일을 `index.html`로 올린 정적 페이지입니다.
`build.py`는 같은 `EMOJI_3D` 표로 `assets/3d/emoji-3d.js` · `emoji-3d.css`도 만듭니다.
별도 페이지에 공용 두 줄을 넣을 때는 `python3 work/byeol2/apply_pages_3d.py <폴더>`를 씁니다.

## 앱 업데이트(OTA) 파일

- `version.json` — 안드로이드 앱의 `checkForUpdate()` 가 읽는 최신 버전 정보.
  `{ versionCode, versionName, apkUrl, sha256, sizeBytes, publishedAt, notes }`
- `web-build.json` — 배포본 지문(`{ build, builtAt }`). 앱이 실행할 때 이 값을 비교해, 바뀐 경우에만 WebView 캐시를 비웁니다.
- APK 는 이 저장소(공개)의 **Releases** 에 `yumin-launcher-<버전>-debug.apk` 로 올립니다. `apkUrl` 은 그 내려받기 주소입니다.

## 배포

GitHub Pages 게시 소스는 **`main` 브랜치**(루트)입니다. `gh-pages` 브랜치는 같은 내용을 복사해 둔 사본입니다.
내용을 고칠 때는 `main`에 반영한 뒤 `gh-pages`에도 같은 파일을 올립니다.

## 참고

- 아이폰 사파리에서 열면 홈 화면에 추가해 앱처럼 실행할 수 있습니다(`apple-mobile-web-app-capable`).
- 홈 런처의 앱 실행은 안드로이드 WebView의 네이티브 브리지가 있을 때만 실제로 동작합니다(브라우저에서는 안내만).
