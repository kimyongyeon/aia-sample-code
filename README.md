# Component Loader

## 개요

`componentLoader.js`는 동적으로 HTML 템플릿을 로드하고 데이터를 바인딩하여 DOM
요소에 렌더링하는 유틸리티 모듈입니다. 이 모듈은 컴포넌트 기반 웹 애플리케이션
개발을 위한 간단하고 효율적인 솔루션을 제공합니다.

## 주요 기능

- **동적 템플릿 로드**: 지정된 경로에서 HTML 템플릿 파일을 비동기적으로 로드
- **데이터 바인딩**: 템플릿에 데이터 객체를 바인딩하여 동적 콘텐츠 생성
- **스크립트 실행**: 템플릿 내의 `<script>` 태그를 추출하여 동적으로 실행
- **에러 처리**: 로드 실패 시 적절한 에러 메시지 표시
- **범위 격리**: `window.responseData`를 통해 템플릿에서 데이터에 접근 가능

## API 문서

### `loadComponent(rootElementId, templatePath, data)`

지정된 HTML 템플릿을 로드하고 데이터를 바인딩하여 DOM 요소에 렌더링합니다.

#### 매개변수

| 매개변수        | 타입     | 필수 | 설명                                         |
| --------------- | -------- | ---- | -------------------------------------------- |
| `rootElementId` | `string` | ✅   | 컴포넌트가 렌더링될 DOM 요소의 ID            |
| `templatePath`  | `string` | ✅   | 로드할 HTML 템플릿 파일의 경로               |
| `data`          | `Object` | ❌   | 템플릿에 바인딩할 데이터 객체 (기본값: `{}`) |

#### 반환값

- `Promise<void>`: 비동기 작업을 나타내는 Promise

#### 예외

- `Error`: DOM 요소를 찾을 수 없거나 템플릿 로드 실패 시

## 사용법

### 기본 사용법

```javascript
// 간단한 컴포넌트 로드
await loadComponent("app-container", "./templates/header.html");

// 데이터와 함께 컴포넌트 로드
await loadComponent("user-profile", "./templates/user-card.html", {
  name: "홍길동",
  email: "hong@example.com",
  avatar: "/images/avatar.jpg",
});
```

### HTML 템플릿 예시

```html
<!-- templates/user-card.html -->
<div class="user-card">
  <img src="${responseData.avatar}" alt="프로필 이미지" />
  <h3>${responseData.name}</h3>
  <p>${responseData.email}</p>

  <script>
    // 템플릿 내에서 데이터에 접근
    console.log("사용자 정보:", responseData);

    // 동적 이벤트 리스너 추가
    document.querySelector(".user-card").addEventListener("click", function () {
      alert("사용자: " + responseData.name);
    });
  </script>
</div>
```

### 메인 HTML 파일에서 사용

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>컴포넌트 로더 예시</title>
  </head>
  <body>
    <div id="app-container"></div>

    <script src="componentLoader.js"></script>
    <script>
      // 페이지 로드 시 컴포넌트 로드
      document.addEventListener("DOMContentLoaded", async function () {
        try {
          await loadComponent("app-container", "./templates/main.html", {
            title: "환영합니다",
            description: "컴포넌트 로더를 사용한 동적 웹 페이지입니다.",
          });
        } catch (error) {
          console.error("컴포넌트 로드 실패:", error);
        }
      });
    </script>
  </body>
</html>
```

## 작동 원리

1. **템플릿 로드**: `fetch()` API를 사용하여 지정된 경로에서 HTML 템플릿을 비동
   기적으로 로드
2. **데이터 바인딩**: `window.responseData`에 전달된 데이터 객체를 설정
3. **HTML 파싱**: 임시 div 요소를 사용하여 로드된 HTML을 파싱
4. **스크립트 추출**: 템플릿 내의 모든 `<script>` 태그를 추출하고 임시 div에서
   제거
5. **콘텐츠 렌더링**: 스크립트가 제거된 HTML을 대상 DOM 요소에 삽입
6. **스크립트 실행**: 추출된 스크립트들을 대상 DOM 요소에 다시 추가하여 실행

## 주의사항

### 보안 고려사항

- 템플릿 파일은 신뢰할 수 있는 소스에서만 로드해야 합니다
- 사용자 입력을 템플릿에 직접 삽입하지 마세요 (XSS 위험)
- 템플릿 내 스크립트는 전역 스코프에서 실행되므로 주의가 필요합니다

### 성능 고려사항

- 템플릿 파일은 가능한 한 작게 유지하세요
- 동일한 템플릿을 반복적으로 로드하는 경우 캐싱을 고려하세요
- 큰 템플릿의 경우 로딩 인디케이터를 표시하는 것을 권장합니다

### 브라우저 호환성

- ES6+ 문법을 사용하므로 최신 브라우저가 필요합니다
- `fetch()` API를 사용하므로 IE11 이하에서는 폴리필이 필요할 수 있습니다

## 에러 처리

모듈은 다음과 같은 상황에서 에러를 발생시킵니다:

- **DOM 요소 없음**: 지정된 ID의 DOM 요소를 찾을 수 없는 경우
- **네트워크 에러**: 템플릿 파일을 로드할 수 없는 경우
- **HTTP 에러**: 서버에서 4xx 또는 5xx 응답을 반환하는 경우

에러 발생 시 콘솔에 상세한 에러 메시지가 출력되고, 대상 DOM 요소에 에러 메시지가
표시됩니다.

## 확장 가능성

이 모듈은 다음과 같은 방식으로 확장할 수 있습니다:

- **캐싱 기능**: 동일한 템플릿의 반복 로드를 방지
- **템플릿 엔진 통합**: Handlebars, Mustache 등의 템플릿 엔진과 통합
- **컴포넌트 라이프사이클**: 로드/언로드 이벤트 처리
- **의존성 관리**: 컴포넌트 간 의존성 자동 해결

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
