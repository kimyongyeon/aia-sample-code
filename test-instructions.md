# WebView 호환성 테스트 가이드

## 🚀 빠른 시작

### 1. 로컬 서버 실행

```bash
# Python 3 사용
python -m http.server 8000

# 또는 Python 2 사용
python -m SimpleHTTPServer 8000

# 또는 Node.js 사용
npx serve .

# 또는 PHP 사용
php -S localhost:8000
```

### 2. 브라우저에서 테스트

```
http://localhost:8000/test-webview.html
```

## 📱 실제 WebView 테스트

### Android WebView 테스트

#### 방법 1: Android Studio AVD (가상 디바이스)

1. **Android Studio 설치**
2. **AVD Manager 열기**: Tools → AVD Manager
3. **가상 디바이스 생성**:
   - Android 4.4 (API 19) - 구형 WebView 테스트
   - Android 7.0 (API 24) - 중간 WebView 테스트
   - Android 11 (API 30) - 최신 WebView 테스트
4. **WebView 앱 생성**:

```java
// MainActivity.java
public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl("http://10.0.2.2:8000/test-webview.html");
    }
}
```

#### 방법 2: 실제 Android 디바이스

1. **개발자 옵션 활성화**: 설정 → 휴대전화 정보 → 빌드 번호 7번 탭
2. **USB 디버깅 활성화**: 설정 → 개발자 옵션 → USB 디버깅
3. **디바이스 연결**: USB 케이블로 연결
4. **WebView 앱 설치 및 실행**

### iOS WebView 테스트

#### 방법 1: iOS Simulator

1. **Xcode 설치**
2. **iOS Simulator 실행**: Xcode → Open Developer Tool → Simulator
3. **WebView 앱 생성**:

```swift
// ViewController.swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        webView = WKWebView(frame: view.bounds)
        webView.navigationDelegate = self
        view.addSubview(webView)

        let url = URL(string: "http://localhost:8000/test-webview.html")!
        let request = URLRequest(url: url)
        webView.load(request)
    }
}
```

#### 방법 2: 실제 iOS 디바이스

1. **개발자 계정 필요** (Apple Developer Program)
2. **Xcode에서 디바이스 연결**
3. **앱 빌드 및 설치**

## 🔧 구형 WebView 시뮬레이션

### 1. User Agent 변경 테스트

```javascript
// 구형 Android WebView 시뮬레이션
navigator.userAgent =
  "Mozilla/5.0 (Linux; Android 4.2.2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.1599.92 Mobile Safari/537.36";

// 구형 iOS WebView 시뮬레이션
navigator.userAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53";
```

### 2. 기능 비활성화 테스트

```javascript
// 특정 기능을 비활성화하여 테스트
// 브라우저 개발자 도구에서 실행

// Map 비활성화
window.Map = undefined;

// Array.from 비활성화
Array.from = undefined;

// addEventListener 비활성화
Element.prototype.addEventListener = undefined;
```

## 📊 테스트 체크리스트

### Android WebView 테스트

- [ ] Android 4.4 (API 19) - 구형 WebView
- [ ] Android 5.0 (API 21) - 중간 WebView
- [ ] Android 7.0 (API 24) - 최신 WebView
- [ ] Android 10+ (API 29+) - 최신 WebView

### iOS WebView 테스트

- [ ] iOS 8.0 - 구형 WebView
- [ ] iOS 10.0 - 중간 WebView
- [ ] iOS 12.0+ - 최신 WebView

### 기능별 테스트

- [ ] JavaScript ES6 기능
- [ ] CSS Flexbox/Grid
- [ ] DOM API
- [ ] 이벤트 처리
- [ ] 로컬 스토리지
- [ ] 네트워크 요청

## 🛠️ 테스트 도구

### 1. BrowserStack (유료)

- 실제 디바이스에서 테스트
- 다양한 OS/브라우저 조합
- 자동화된 테스트 가능

### 2. LambdaTest (유료)

- 클라우드 기반 테스트
- 실시간 테스트
- 스크린샷 및 녹화 기능

### 3. Sauce Labs (유료)

- 엔터프라이즈급 테스트
- CI/CD 통합
- 자동화된 테스트

### 4. 로컬 테스트 도구

#### Android

```bash
# ADB를 통한 디바이스 연결 확인
adb devices

# WebView 디버깅 활성화
adb shell setprop debug.webview.provider com.android.webview
```

#### iOS

```bash
# iOS Simulator 명령어
xcrun simctl list devices
xcrun simctl boot "iPhone 11"
```

## 📈 성능 테스트

### 1. 로딩 시간 측정

```javascript
// 페이지 로딩 시간 측정
var startTime = performance.now();
window.addEventListener("load", function () {
  var loadTime = performance.now() - startTime;
  console.log("페이지 로딩 시간:", loadTime + "ms");
});
```

### 2. 메모리 사용량 측정

```javascript
// 메모리 사용량 확인 (Chrome DevTools)
console.log("메모리 사용량:", performance.memory);
```

### 3. 네트워크 성능 측정

```javascript
// 네트워크 요청 시간 측정
var startTime = performance.now();
fetch("/api/test").then(function (response) {
  var requestTime = performance.now() - startTime;
  console.log("네트워크 요청 시간:", requestTime + "ms");
});
```

## 🔍 디버깅 팁

### 1. 콘솔 로그 확인

```javascript
// WebView에서 콘솔 로그 확인
console.log("WebView 테스트 시작");
console.error("오류 발생:", error);
console.warn("경고:", warning);
```

### 2. 네트워크 요청 모니터링

```javascript
// 네트워크 요청 로깅
var originalFetch = window.fetch;
window.fetch = function () {
  console.log("Fetch 요청:", arguments);
  return originalFetch.apply(this, arguments);
};
```

### 3. 이벤트 리스너 디버깅

```javascript
// 이벤트 리스너 추가 추적
var originalAddEventListener = Element.prototype.addEventListener;
Element.prototype.addEventListener = function (type, listener, options) {
  console.log("이벤트 리스너 추가:", type, listener);
  return originalAddEventListener.call(this, type, listener, options);
};
```

## 📝 테스트 결과 기록

### 테스트 결과 템플릿

```
테스트 환경: Android 4.4 WebView
테스트 날짜: 2024-01-15
테스트자: 개발자명

결과:
- JavaScript ES6: ❌ (지원되지 않음)
- CSS Flexbox: ❌ (지원되지 않음)
- DOM API: ⚠️ (부분 지원)
- 이벤트 처리: ✅ (지원됨)

문제점:
1. ES6 모듈 시스템 미지원
2. Flexbox 레이아웃 깨짐
3. 일부 DOM API 제한

해결방안:
1. ES5 호환 코드 사용
2. Float 기반 레이아웃 적용
3. 폴백 함수 구현
```

## 🚨 주의사항

1. **CORS 정책**: WebView에서 로컬 파일 접근 시 CORS 문제 발생 가능
2. **보안 정책**: 일부 WebView에서는 특정 기능이 제한될 수 있음
3. **성능**: 구형 WebView에서는 성능이 저하될 수 있음
4. **메모리**: 구형 WebView에서는 메모리 사용량이 높을 수 있음

## 📞 문제 해결

### 일반적인 문제들

1. **스크립트 로딩 실패**

   - 네트워크 연결 확인
   - 파일 경로 확인
   - CORS 설정 확인

2. **이벤트 처리 실패**

   - 이벤트 리스너 등록 확인
   - 이벤트 객체 속성 확인
   - 폴백 이벤트 처리 구현

3. **CSS 스타일 적용 실패**
   - CSS 속성 지원 여부 확인
   - 폴백 스타일 적용
   - 벤더 프리픽스 확인

---

**참고**: 실제 프로덕션 환경에서는 다양한 WebView 환경에서 충분한 테스트가 필요
합니다.
