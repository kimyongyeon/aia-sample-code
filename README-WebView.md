# WebView 호환 체크박스 예제

하이브리드 앱의 WebView에서 발생할 수 있는 다양한 호환성 문제를 대비한 체크박스
예제입니다.

## 🚨 WebView에서 발생할 수 있는 문제들

### 1. JavaScript 호환성 문제

- **ES6 모듈 시스템 미지원**: 구형 WebView에서는 `import/export` 문법이 지원되지
  않음
- **최신 JavaScript API 미지원**: `Map`, `Set`, `Array.from` 등이 지원되지 않을
  수 있음
- **이벤트 처리 문제**: `addEventListener` 대신 `attachEvent`를 사용해야 하는 경
  우

### 2. CSS 호환성 문제

- **Flexbox 미지원**: 구형 WebView에서는 flexbox 레이아웃이 제대로 작동하지 않음
- **Transform/Transition 미지원**: CSS 애니메이션이 지원되지 않을 수 있음
- **미디어 쿼리 제한**: 일부 WebView에서는 미디어 쿼리가 제한적으로 작동

### 3. DOM 조작 문제

- **querySelector 미지원**: 구형 WebView에서는 `querySelector`가 지원되지 않음
- **classList 미지원**: `classList` API가 지원되지 않을 수 있음
- **이벤트 객체 차이**: 이벤트 객체의 속성이 다를 수 있음

## 📁 파일 구조

```
├── checkbox.html          # 원본 ES6 모듈 버전
├── checkbox.js           # 원본 ES6 모듈 JavaScript
├── checkbox-compat.html  # WebView 호환 버전
├── checkbox-compat.js    # WebView 호환 JavaScript
├── webview-utils.js      # WebView 호환성 유틸리티
└── README-WebView.md     # 이 파일
```

## 🔧 WebView 호환성 대응 방안

### 1. JavaScript 호환성

```javascript
// ES6 모듈 대신 즉시 실행 함수(IIFE) 사용
var WebViewCompat = (function () {
  "use strict";
  // 기능 감지 및 폴백 구현
})();

// Map 폴백 구현
var createMap = function () {
  if (typeof Map !== "undefined") {
    return new Map();
  } else {
    // 간단한 Map 폴백 구현
    return {
      set: function (key, value) {
        /* ... */
      },
      get: function (key) {
        /* ... */
      },
      forEach: function (callback) {
        /* ... */
      },
    };
  }
};
```

### 2. 이벤트 처리 다중화

```javascript
// 여러 방식으로 이벤트 바인딩
var addEvent = function (element, event, handler) {
  if (typeof element.addEventListener !== "undefined") {
    element.addEventListener(event, handler);
  } else if (typeof element.attachEvent !== "undefined") {
    element.attachEvent("on" + event, handler);
  } else {
    element["on" + event] = handler;
  }
};
```

### 3. CSS 호환성

```css
/* Flexbox 대신 Float 사용 */
.checkbox-item {
  overflow: hidden;
  /* flexbox 대신 float 사용 */
}

.checkbox-item input[type="checkbox"] {
  float: left;
  margin-right: 10px;
}

.checkbox-item label {
  display: block;
  margin-left: 25px;
}
```

## 🛠️ 사용법

### 1. 일반 브라우저에서 사용

```html
<!-- ES6 모듈 버전 사용 -->
<script type="module">
  import store from "./checkbox.js";
  // ...
</script>
```

### 2. WebView에서 사용

```html
<!-- WebView 호환 버전 사용 -->
<script src="./webview-utils.js"></script>
<script src="./checkbox-compat.js"></script>
```

### 3. 자동 감지 및 대응

```javascript
// 브라우저/WebView 정보 감지
var browserInfo = WebViewUtils.detectBrowser();
var featureSupport = WebViewUtils.checkFeatureSupport();

if (browserInfo.isOldWebView) {
  // 구형 WebView 대응 로직
  console.warn("구형 WebView가 감지되었습니다.");
}
```

## 🔍 기능 감지

### 지원되는 기능들

- **ES6 모듈**: `import/export` 문법
- **Map/Set**: 최신 컬렉션 객체
- **Array.from**: 배열 변환 메서드
- **addEventListener**: 이벤트 리스너
- **querySelector**: DOM 선택자
- **classList**: 클래스 조작 API
- **Flexbox**: CSS 레이아웃
- **Transform**: CSS 변형
- **Transition**: CSS 애니메이션

### 폴백 구현

- **Map 폴백**: 객체 기반 Map 구현
- **Array.from 폴백**: `Array.prototype.slice.call()` 사용
- **addEventListener 폴백**: `attachEvent` 또는 `onclick` 사용
- **classList 폴백**: `className` 문자열 조작

## 📱 WebView별 특징

### Android WebView

- **Android 4.4 미만**: 구형 WebView (Chromium 기반 아님)
- **Android 4.4+**: Chromium 기반 WebView
- **Android 7.0+**: 최신 WebView (대부분의 기능 지원)

### iOS WebView

- **iOS 8.0 미만**: 구형 WebView
- **iOS 8.0+**: WKWebView (대부분의 기능 지원)
- **iOS 12.0+**: 최신 WebView

## 🚀 성능 최적화

### 1. 기능 감지 캐싱

```javascript
// 한 번만 감지하여 재사용
var featureSupport = WebViewUtils.checkFeatureSupport();
```

### 2. 조건부 로딩

```javascript
// 지원되는 기능만 사용
if (featureSupport.flexbox) {
  // Flexbox 사용
} else {
  // Float 사용
}
```

### 3. 에러 처리

```javascript
try {
  // 최신 기능 사용
} catch (error) {
  // 폴백 방법 사용
  console.warn("최신 기능 사용 실패, 폴백 사용:", error);
}
```

## 🧪 테스트 방법

### 1. 브라우저 테스트

```bash
# 로컬 서버 실행
python -m http.server 8000
# 또는
npx serve .
```

### 2. WebView 테스트

- Android Studio의 AVD에서 테스트
- iOS Simulator에서 테스트
- 실제 디바이스에서 테스트

### 3. 구형 브라우저 테스트

- Internet Explorer 11
- 구형 Android WebView
- 구형 iOS WebView

## 📊 호환성 체크리스트

- [ ] ES6 모듈 시스템
- [ ] Map/Set 객체
- [ ] Array.from 메서드
- [ ] addEventListener
- [ ] querySelector/querySelectorAll
- [ ] classList API
- [ ] Flexbox CSS
- [ ] Transform CSS
- [ ] Transition CSS
- [ ] localStorage
- [ ] JSON API

## 🔧 문제 해결

### 일반적인 문제들

1. **스크립트 로딩 실패**

   ```javascript
   // 대체 초기화 로직 제공
   if (typeof CheckboxManagerCompat === "undefined") {
     // 간단한 대체 초기화
   }
   ```

2. **이벤트 처리 실패**

   ```javascript
   // 여러 방식으로 이벤트 바인딩
   element.onclick = handler; // 폴백
   ```

3. **CSS 스타일 적용 실패**
   ```css
   /* 구형 WebView를 위한 폴백 스타일 */
   .checkbox-item {
     /* flexbox 대신 float 사용 */
   }
   ```

## 📝 주의사항

1. **CORS 정책**: WebView에서 로컬 파일 접근 시 CORS 문제 발생 가능
2. **보안 정책**: 일부 WebView에서는 특정 기능이 제한될 수 있음
3. **성능**: 구형 WebView에서는 성능이 저하될 수 있음
4. **메모리**: 구형 WebView에서는 메모리 사용량이 높을 수 있음

## 🤝 기여하기

WebView 호환성 개선을 위한 제안이나 버그 리포트는 언제든 환영합니다!

---

**참고**: 이 예제는 다양한 WebView 환경에서 테스트되었지만, 모든 환경에서 완벽한
호환성을 보장하지는 않습니다. 실제 프로덕션 환경에서는 충분한 테스트가 필요합니
다.
