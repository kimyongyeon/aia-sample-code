# DataShare - IndexedDB 기반 페이지 간 데이터 공유 시스템

## 📋 개요

**DataShare**는 SPA(Single Page Application)와 CSR(Client-Side Rendering) 환경에
서 앵커 태그를 통한 페이지 전환 시에도 데이터가 영구적으로 유지되는 IndexedDB 기
반의 데이터 공유 유틸리티입니다.

### 🎯 주요 특징

- **영속성 데이터 저장**: IndexedDB를 활용하여 브라우저를 닫아도 데이터 유지
- **메모리 캐시**: 빠른 접근을 위한 1차 메모리 캐시 시스템
- **실시간 감시**: 데이터 변경 시 실시간 콜백 알림
- **페이지 간 공유**: 앵커 태그로 페이지 전환 시에도 데이터 완벽 유지
- **임시 데이터 지원**: TTL(Time To Live) 기반 자동 삭제 기능
- **패턴 매칭**: 와일드카드를 활용한 선택적 데이터 감시

## 🚀 빠른 시작

### 1. 파일 구조

```
data-share/
├── DataSharePersistent.js    # 핵심 라이브러리
├── page1.html               # 사용자 정보 입력 페이지
├── page2.html               # 설정 관리 페이지
├── page3.html               # 실시간 감시 페이지
├── dashboard.html           # 종합 관리 대시보드
└── README.md               # 이 문서
```

### 2. 기본 사용법

#### HTML에 라이브러리 포함

```html
<script src="DataSharePersistent.js"></script>
```

#### 기본 초기화 및 사용

```javascript
// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // DataShare 초기화 (IndexedDB 연결)
    await DataShare.init();

    // 개발 모드 활성화 (선택사항)
    DataShare.setDevMode(true);

    console.log("DataShare 준비 완료!");
  } catch (error) {
    console.error("초기화 실패:", error);
  }
});
```

## 📚 API 문서

### 🔧 기본 메서드

#### `init()`

IndexedDB 데이터베이스를 초기화하고 기존 데이터를 메모리 캐시로 로드합니다.

```javascript
await DataShare.init();
```

#### `set(key, value, persistent = true)`

데이터를 저장합니다.

```javascript
// 영구 저장 (IndexedDB + 메모리)
await DataShare.set("user.name", "홍길동");

// 메모리만 저장 (영속성 없음)
await DataShare.set("temp.data", "임시값", false);

// 객체 저장
await DataShare.set("user.profile", {
  name: "홍길동",
  age: 30,
  email: "hong@example.com",
});
```

#### `get(key)`

데이터를 조회합니다.

```javascript
const userName = DataShare.get("user.name");
const userProfile = DataShare.get("user.profile");

console.log(userName); // "홍길동"
console.log(userProfile); // { name: "홍길동", age: 30, ... }
```

#### `clear(key?)`

데이터를 삭제합니다.

```javascript
// 특정 키 삭제
await DataShare.clear("user.name");

// 모든 데이터 삭제
await DataShare.clear();
```

### 👀 실시간 감시 기능

#### `watch(pattern, callback)`

데이터 변경을 실시간으로 감시합니다.

```javascript
// 특정 키 감시
const unsubscribe = DataShare.watch("user.name", (newValue, oldValue, key) => {
  console.log(`${key}가 ${oldValue}에서 ${newValue}로 변경됨`);
});

// 패턴 매칭 감시 (와일드카드)
DataShare.watch("user.*", (newValue, oldValue, key) => {
  console.log(`사용자 데이터 변경: ${key}`);
});

// 모든 데이터 감시
DataShare.watch("*", (newValue, oldValue, key) => {
  console.log(`전체 데이터 변경: ${key}`);
});

// 감시 해제
unsubscribe();
```

### ⏰ 임시 데이터 기능

#### `temp(key, value, ttl = 300000)`

TTL 기반 임시 데이터를 저장합니다 (기본: 5분).

```javascript
// 10초 후 자동 삭제
DataShare.temp("session.token", "abc123", 10000);

// 1분 후 자동 삭제
DataShare.temp("cache.data", { temp: true }, 60000);
```

### 📊 유틸리티 메서드

#### `getAll()`

모든 저장된 데이터를 반환합니다.

```javascript
const allData = DataShare.getAll();
console.log(allData);
// {
//   "user.name": "홍길동",
//   "user.profile": { ... },
//   "app.theme": "dark"
// }
```

#### `getKeys()`

모든 키를 배열로 반환합니다.

```javascript
const keys = DataShare.getKeys();
console.log(keys); // ["user.name", "user.profile", "app.theme"]
```

#### `getKeysByPattern(pattern)`

패턴에 맞는 키들을 반환합니다.

```javascript
const userKeys = DataShare.getKeysByPattern("user.*");
console.log(userKeys); // ["user.name", "user.profile"]
```

#### `getStats()`

시스템 통계 정보를 반환합니다.

```javascript
const stats = await DataShare.getStats();
console.log(stats);
// {
//   memoryKeys: 5,      // 메모리 캐시 키 수
//   indexedDBKeys: 3,   // IndexedDB 키 수
//   watchers: 2,        // 활성 감시자 수
//   tempData: 1         // 임시 데이터 수
// }
```

#### `setDevMode(enabled)`

개발 모드를 설정합니다.

```javascript
// 개발 모드 활성화 (상세 로그 출력)
DataShare.setDevMode(true);

// 개발 모드 비활성화
DataShare.setDevMode(false);
```

## 🎮 테스트 페이지 사용법

### 📄 Page 1 - 사용자 정보 입력

- **URL**: `page1.html`
- **기능**: 사용자 기본 정보 입력 및 테마 설정
- **테스트 방법**:
  1. 사용자 정보(이름, 이메일, 나이, 자기소개) 입력
  2. "사용자 정보 저장" 클릭
  3. 테마 색상 및 글꼴 크기 설정 후 "테마 저장" 클릭

### 📋 Page 2 - 설정 및 선호도

- **URL**: `page2.html`
- **기능**: 애플리케이션 설정 관리 및 임시 데이터 테스트
- **테스트 방법**:
  1. Page 1에서 입력한 사용자 정보가 자동으로 표시되는지 확인
  2. 언어, 시간대, 알림 등 설정 변경 후 저장
  3. 임시 데이터 기능 테스트 (TTL 설정 가능)

### 👀 Page 3 - 실시간 감시

- **URL**: `page3.html`
- **기능**: 데이터 변경 실시간 감시 및 자동 데이터 생성
- **테스트 방법**:
  1. 감시 패턴 설정 (예: `user.*`, `*`)
  2. "감시 시작" 클릭
  3. 다른 페이지에서 데이터 변경 시 실시간 로그 확인
  4. 자동 데이터 생성기로 대량 데이터 테스트

### 📊 Dashboard - 종합 관리

- **URL**: `dashboard.html`
- **기능**: 전체 데이터 관리 및 모니터링
- **주요 기능**:
  - 실시간 통계 모니터링
  - 데이터 내보내기/가져오기 (JSON, CSV, TXT)
  - 데이터베이스 압축 및 리셋
  - 전체 데이터 시각화

## 🔄 페이지 간 데이터 공유 테스트

### 시나리오 1: 기본 데이터 공유

1. `page1.html`에서 사용자 정보 입력 및 저장
2. `page2.html`로 이동 → 입력한 정보가 자동으로 표시됨
3. 브라우저 새로고침 → 데이터 그대로 유지
4. `dashboard.html`에서 전체 데이터 확인

### 시나리오 2: 실시간 감시 테스트

1. `page3.html`에서 `user.*` 패턴으로 감시 시작
2. `page1.html`에서 사용자 정보 수정
3. `page3.html`로 돌아가서 실시간 변경 로그 확인

### 시나리오 3: 임시 데이터 테스트

1. `page2.html`에서 임시 데이터 저장 (TTL: 10초)
2. `page3.html`로 이동하여 데이터 존재 확인
3. 10초 후 자동 삭제 확인

## 🛠️ 고급 사용법

### 커스텀 데이터베이스 설정

```javascript
// 커스텀 데이터베이스명과 버전으로 초기화
const customDataShare = new DataSharePersistent("MyAppDB", 2);
await customDataShare.init();
```

### 에러 핸들링

```javascript
try {
  await DataShare.set("key", "value");
} catch (error) {
  if (error.name === "QuotaExceededError") {
    console.log("저장 공간이 부족합니다.");
  } else {
    console.log("저장 중 오류:", error.message);
  }
}
```

### 배치 작업

```javascript
// 여러 데이터 한번에 저장
const batchData = {
  "user.name": "홍길동",
  "user.email": "hong@example.com",
  "app.theme": "dark",
};

for (const [key, value] of Object.entries(batchData)) {
  await DataShare.set(key, value);
}
```

## 🔍 디버깅 가이드

### 개발자 도구 활용

```javascript
// 개발 모드 활성화
DataShare.setDevMode(true);

// 현재 상태 확인
console.log("모든 데이터:", DataShare.getAll());
console.log("통계:", await DataShare.getStats());

// IndexedDB 직접 확인
// 브라우저 개발자 도구 → Application → Storage → IndexedDB
```

### 일반적인 문제 해결

1. **데이터가 저장되지 않는 경우**

   - `await DataShare.init()` 호출 확인
   - 브라우저의 IndexedDB 지원 여부 확인
   - 저장 공간 부족 여부 확인

2. **페이지 전환 시 데이터가 사라지는 경우**

   - `persistent: true` 옵션 확인 (기본값)
   - IndexedDB 저장 완료 후 페이지 이동

3. **감시 기능이 작동하지 않는 경우**
   - 패턴 문법 확인 (`*` 사용법)
   - 콜백 함수 오류 확인

## 🌐 브라우저 호환성

- **Chrome**: 23+ ✅
- **Firefox**: 25+ ✅
- **Safari**: 10+ ✅
- **Edge**: 12+ ✅
- **IE**: 지원 안함 ❌

## 📈 성능 최적화

### 권장사항

1. **초기화는 한 번만**: 페이지당 `init()` 한 번만 호출
2. **메모리 캐시 활용**: 자주 사용하는 데이터는 메모리에서 조회
3. **배치 작업**: 대량 데이터는 배치로 처리
4. **불필요한 감시 해제**: 사용하지 않는 watcher는 해제

### 메모리 관리

```javascript
// 페이지 언로드 시 정리
window.addEventListener("beforeunload", function () {
  // 감시 해제
  if (unsubscribeFunction) {
    unsubscribeFunction();
  }

  // 데이터베이스 연결 종료
  DataShare.close();
});
```
