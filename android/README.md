# 유민공부방 Android 잠금형 런처 (개발 중)

## 현재 구현 범위
- Android HOME 런처 등록
- 기존 학습 웹앱 표시
- Device Admin Receiver 등록
- Device Owner인 경우 Lock Task 허용 목록 설정
- Device Owner인 경우 키오스크 잠금 자동 진입
- 기본 잠금 상태에서 상태 표시줄/알림창/홈/최근 앱 기능 비활성화
- 자녀 앱 실행은 Kotlin의 `approvedChildPackages` 목록에 포함된 패키지만 허용

## 빌드
GitHub Actions의 `Android APK Build` 워크플로를 실행하고 Artifacts에서 `yumin-studyroom-debug-apk`를 내려받습니다.

## 중요: 설치만으로 완전 잠금이 되지 않습니다
Lock Task 키오스크 잠금은 앱을 설치하거나 기본 홈 앱으로 선택하는 것만으로 활성화되지 않습니다. 이 앱을 Android **Device Owner(기기 소유자)** 로 프로비저닝해야 합니다.

Device Owner 지정은 보통 태블릿 초기 설정 단계에서 진행해야 하며, 이미 설정을 마친 기기에서는 초기화가 필요할 수 있습니다. 초기화하면 태블릿의 데이터가 삭제될 수 있으므로, 보호자 확인과 백업 없이 진행하지 마세요.

## Device Owner 프로비저닝 (보호자가 직접 진행)
1. 태블릿 데이터를 백업합니다.
2. Android SDK Platform Tools가 설치된 PC에서 USB 디버깅을 준비합니다.
3. 새로 초기화한 태블릿을 초기 설정하고, 사용자 계정 등록 전에 USB 디버깅으로 연결합니다.
4. APK를 설치한 뒤 아래 명령을 실행합니다.

```bash
adb install app-debug.apk
adb shell dpm set-device-owner kr.yumin.studyroom/.YuminDeviceAdminReceiver
```

5. 성공 메시지가 확인된 뒤 유민공부방을 실행하고 잠금 동작을 시험합니다.

기기 제조사/OS 버전에 따라 프로비저닝 절차와 제한이 다를 수 있습니다. 이 명령을 실행하기 전에 실제 태블릿의 Android 버전과 설정 상태를 확인해야 합니다.

## 허용 앱 추가
`MainActivity.kt`의 `approvedChildPackages`에 태블릿에 설치된 아동용 앱의 정확한 패키지명을 추가해야 합니다. 허용 목록에 없는 앱은 키오스크 모드에서 실행되지 않습니다. YouTube Kids 패키지는 기본 예시로 포함되어 있으며, 기기에 설치되어 있을 때만 Android 잠금 허용 목록에 추가됩니다.

## 아직 구현하지 않은 항목
- 하루 총 사용 2시간 및 영상 30분 제한
- 밤 10시 자동 잠금/해제 스케줄
- 보호자 전용 PIN 해제/설정 화면
- 기기 재부팅 후 잠금 자동 복구 검증
- 샤오신패드 실기기 호환성 테스트

이 항목들은 키오스크 기본 동작을 실기기에서 확인한 뒤 추가합니다.
