# 유민공부방 Android 런처 (초기 버전)

기존 GitHub Pages 학습 화면을 Android 네이티브 앱의 WebView로 표시하고, Android의 기본 홈 앱으로 선택할 수 있게 하는 프로젝트입니다.

## 현재 구현
- Android 앱 실행 아이콘
- Android 홈 앱(`CATEGORY_HOME`) 등록 대상
- 기존 유민공부방 웹앱 표시
- 웹앱의 `window.YuminLauncherBridge.launchApp(packageName, appName)` 호출 연결
- 전체 화면 표시 및 뒤로가기 시 홈 화면으로 빠져나가지 않도록 처리

## 빌드
1. Android Studio에서 이 `android` 폴더를 엽니다.
2. JDK 17 및 Android SDK 35를 설치합니다.
3. Gradle 동기화 후 **Build > Build Bundle(s) / APK(s) > Build APK(s)** 를 선택합니다.
4. APK는 `app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다.

## 태블릿에서 기본 홈 앱으로 지정
1. APK를 샤오신패드에 설치합니다.
2. 설정의 기본 앱 또는 홈 앱 메뉴에서 **유민공부방**을 선택합니다.
3. 홈 버튼을 눌러 유민공부방이 열리는지 확인합니다.

## 중요한 제한
이 초기 버전은 홈 앱으로 선택 가능한 런처이며, 완전한 키오스크 잠금(DPC/Device Owner)은 아직 설정하지 않았습니다. Android의 Lock Task Mode는 기기 소유자 권한으로 앱을 허용 목록에 등록해야 다른 앱·알림창·설정 접근을 강하게 제한할 수 있습니다. 일반 앱이 임의로 이 권한을 획득할 수는 없습니다.

기기 잠금까지 적용하려면 태블릿 초기화 여부, Android/Lenovo OS 버전, 기기 소유자 프로비저닝 가능 여부를 확인한 뒤 별도 DPC 구성이 필요합니다. 이 단계는 데이터 초기화를 요구할 수 있으므로 사용자 확인 없이 진행하지 않습니다.
