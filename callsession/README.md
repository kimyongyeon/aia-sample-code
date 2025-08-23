# SessionUtil 개발가이드

SessionStorage를 활용한 클라이언트 사이드 세션 관리 라이브러리입니다.  
기존 서버 통신 방식을 브라우저의 sessionStorage로 대체하여 빠르고 효율적인 데이
터 관리를 제공합니다.

## 목차

- [설치 및 사용](#설치-및-사용)
- [기본 개념](#기본-개념)
- [API 참조](#api-참조)
  - [1. 기존 콜백 방식](#1-기존-콜백-방식-호환성)
  - [2. 개별 함수 방식](#2-개별-함수-방식-명확성)
  - [3. 통합 함수 방식](#3-통합-함수-방식-기존-패턴--promise)
- [사용 예제](#사용-예제)
- [고급 기능](#고급-기능)
- [테스트](#테스트)

## 설치 및 사용

```html
<script src="sessionUtil.js"></script>
<script>
  // 사용 준비 완료
  console.log("SessionUtil 로드됨:", typeof comUtil.sessionCall);
</script>
```

## 기본 개념

### 데이터 저장 구조

- **키 형식**: `SS:{paramId}` (예: `SS:userInfo`)
- **데이터 형식**: JSON 형태로 자동 직렬화/역직렬화
- **TTL 지원**: 만료 시간 설정 가능
- **병합 지원**: 객체 데이터의 부분 업데이트 가능

### 응답 형식

모든 함수는 일관된 응답 형식을 반환합니다:

```javascript
// 성공 시
{ ok: true, data: 실제데이터 }

// 에러 시
{ ok: false, error: "에러메시지" }

// DELETE 시 (삭제된 개수 포함)
{ ok: true, deleted: 1 }
```

## API 참조

### 1. 기존 콜백 방식 (호환성)

기존 서버 통신 방식과 동일한 인터페이스를 제공합니다.

#### `callSession(paramId, param, process, method, afterFn)`

```javascript
// 데이터 저장
comUtil.callSession(
  "userInfo",
  { name: "홍길동", age: 25 },
  "save",
  "POST",
  function (result) {
    console.log("저장 결과:", result);
  }
);

// 데이터 조회
comUtil.callSession("userInfo", {}, "load", "GET", function (result) {
  console.log("조회 결과:", result);
});

// 데이터 삭제
comUtil.callSession("userInfo", {}, "delete", "DELETE", function (result) {
  console.log("삭제 결과:", result);
});
```

#### `callSessionSync(paramId, param, process, method)`

```javascript
// 동기식 저장
const saveResult = comUtil.callSessionSync(
  "userInfo",
  { name: "홍길동" },
  "save",
  "POST"
);

// 동기식 조회
const userData = comUtil.callSessionSync("userInfo", {}, "load", "GET");
```

**매개변수:**

- `paramId`: 세션 키 ID (실제 sessionStorage 키로 사용)
- `param`: 저장할 데이터 (GET, DELETE 시 무시됨)
- `process`: 처리 타입 (호환성을 위해 유지, 실제로는 무시됨)
- `method`: HTTP 메소드 ("GET", "POST", "PUT", "DELETE")
- `afterFn`: 콜백 함수 (callSession만 해당)

### 2. 개별 함수 방식 (명확성)

각 작업에 특화된 함수들을 제공합니다.

#### `postSession(key, data, options)`

데이터 저장 (덮어쓰기)

```javascript
const result = await comUtil.postSession("userInfo", {
  name: "홍길동",
  age: 25,
});

// TTL 설정 (1분 후 만료)
const result = await comUtil.postSession(
  "tempData",
  { temp: true },
  {
    ttlMs: 60000,
  }
);
```

#### `getSessionAsync(key)`

데이터 조회

```javascript
const result = await comUtil.getSessionAsync("userInfo");
if (result.ok) {
  console.log("사용자 정보:", result.data);
} else {
  console.log("조회 실패:", result.error);
}
```

#### `putSession(key, data, options)`

데이터 병합 저장

```javascript
// 기존 데이터: { name: "홍길동", age: 25 }
const result = await comUtil.putSession("userInfo", {
  city: "서울",
  age: 26, // 기존 age 값 덮어쓰기
});
// 결과: { name: "홍길동", age: 26, city: "서울" }

// 병합 비활성화 (완전 덮어쓰기)
const result = await comUtil.putSession(
  "userInfo",
  { newData: true },
  {
    merge: false,
  }
);
```

#### `deleteSession(key)`

데이터 삭제

```javascript
// 단일 키 삭제
const result = await comUtil.deleteSession("userInfo");

// Prefix 삭제 (해당 prefix로 시작하는 모든 키 삭제)
const result = await comUtil.deleteSession("user/*");
console.log(`${result.deleted}개 항목이 삭제되었습니다.`);
```

#### `batchSession(operations)`

일괄 처리

```javascript
const operations = [
  { method: "post", key: "user1", data: { name: "김철수" } },
  { method: "post", key: "user2", data: { name: "박영희" } },
  { method: "get", key: "user1" },
  { method: "put", key: "user1", data: { age: 30 } },
  { method: "delete", key: "user2" },
];

const results = await comUtil.batchSession(operations);
results.forEach((result, index) => {
  console.log(`작업 ${index + 1}:`, result);
});
```

### 3. 통합 함수 방식 (기존 패턴 + Promise)

기존 방식과 유사하게 method를 매개변수로 받는 통합 함수들입니다.

#### `sessionRequest(key, data, method, options)`

완전한 통합 함수

```javascript
// POST - 데이터 저장
const result = await comUtil.sessionRequest(
  "userInfo",
  {
    name: "홍길동",
  },
  "POST"
);

// GET - 데이터 조회
const result = await comUtil.sessionRequest("userInfo", null, "GET");

// PUT - 데이터 병합
const result = await comUtil.sessionRequest(
  "userInfo",
  {
    age: 25,
  },
  "PUT"
);

// DELETE - 데이터 삭제
const result = await comUtil.sessionRequest("userInfo", null, "DELETE");
```

#### `sessionCall(key, data, method, options)`

간단한 통합 함수 (sessionRequest의 별칭)

```javascript
const result = await comUtil.sessionCall(
  "userInfo",
  { name: "홍길동" },
  "POST"
);
```

### Promise 체이닝 방식 사용 예제

async/await 대신 then/catch를 사용한 전통적인 Promise 체이닝 방식입니다.

#### sessionRequest를 then/catch로 사용

```javascript
// POST → GET → PUT → DELETE 순차 처리
comUtil
  .sessionRequest("chainTest", { name: "체이닝테스트" }, "POST")
  .then((postResult) => {
    console.log("1. POST 결과:", postResult);
    return comUtil.sessionRequest("chainTest", null, "GET");
  })
  .then((getResult) => {
    console.log("2. GET 결과:", getResult);
    return comUtil.sessionRequest("chainTest", { updated: true }, "PUT");
  })
  .then((putResult) => {
    console.log("3. PUT 결과:", putResult);
    return comUtil.sessionRequest("chainTest", null, "DELETE");
  })
  .then((deleteResult) => {
    console.log("4. DELETE 결과:", deleteResult);
    console.log("모든 작업 완료!");
  })
  .catch((error) => {
    console.error("체이닝 중 오류 발생:", error);
  });
```

#### sessionCall을 then/catch로 사용

```javascript
// 사용자 정보 관리 - Promise 체이닝 방식
function manageUserWithChaining() {
  const userData = {
    id: 1,
    name: "김철수",
    email: "kim@example.com",
  };

  comUtil
    .sessionCall("user", userData, "POST")
    .then((result) => {
      if (!result.ok) throw new Error(result.error);
      console.log("사용자 저장됨:", result.data);

      // 사용자 정보 조회
      return comUtil.sessionCall("user", null, "GET");
    })
    .then((result) => {
      if (!result.ok) throw new Error(result.error);
      console.log("조회된 사용자:", result.data);

      // 사용자 정보 업데이트
      return comUtil.sessionCall("user", { status: "active" }, "PUT");
    })
    .then((result) => {
      if (!result.ok) throw new Error(result.error);
      console.log("업데이트된 사용자:", result.data);

      // 최종 확인
      return comUtil.sessionCall("user", null, "GET");
    })
    .then((finalResult) => {
      console.log("최종 사용자 정보:", finalResult.data);
    })
    .catch((error) => {
      console.error("사용자 관리 중 오류:", error);
    });
}

// 함수 실행
manageUserWithChaining();
```

#### 병렬 처리 with Promise.all

```javascript
// 여러 데이터를 동시에 저장
function saveMultipleData() {
  const promises = [
    comUtil.sessionRequest("user1", { name: "홍길동" }, "POST"),
    comUtil.sessionRequest("user2", { name: "김철수" }, "POST"),
    comUtil.sessionRequest("user3", { name: "박영희" }, "POST"),
  ];

  Promise.all(promises)
    .then((results) => {
      console.log("모든 사용자 저장 완료:");
      results.forEach((result, index) => {
        console.log(`사용자 ${index + 1}:`, result);
      });

      // 저장된 데이터들을 다시 조회
      const getPromises = [
        comUtil.sessionRequest("user1", null, "GET"),
        comUtil.sessionRequest("user2", null, "GET"),
        comUtil.sessionRequest("user3", null, "GET"),
      ];

      return Promise.all(getPromises);
    })
    .then((getResults) => {
      console.log("모든 사용자 조회 완료:");
      getResults.forEach((result, index) => {
        console.log(`조회된 사용자 ${index + 1}:`, result.data);
      });
    })
    .catch((error) => {
      console.error("병렬 처리 중 오류:", error);
    });
}
```

#### 조건부 처리 with then/catch

```javascript
// 사용자 존재 여부에 따른 조건부 처리
function conditionalUserManagement(userId) {
  comUtil
    .sessionRequest(`user_${userId}`, null, "GET")
    .then((result) => {
      if (result.ok && result.data) {
        // 사용자가 존재하는 경우 - 업데이트
        console.log("기존 사용자 발견:", result.data);
        return comUtil.sessionRequest(
          `user_${userId}`,
          { lastLogin: new Date().toISOString() },
          "PUT"
        );
      } else {
        // 사용자가 없는 경우 - 새로 생성
        console.log("새 사용자 생성");
        return comUtil.sessionRequest(
          `user_${userId}`,
          {
            id: userId,
            name: `User ${userId}`,
            createdAt: new Date().toISOString(),
          },
          "POST"
        );
      }
    })
    .then((result) => {
      console.log("처리 완료:", result.data);
      return comUtil.sessionRequest(`user_${userId}`, null, "GET");
    })
    .then((finalResult) => {
      console.log("최종 사용자 정보:", finalResult.data);
    })
    .catch((error) => {
      console.error(`사용자 ${userId} 처리 중 오류:`, error);
    });
}

// 사용 예
conditionalUserManagement(123);
```

#### 에러 처리와 재시도 로직

```javascript
// 재시도 로직이 포함된 Promise 체이닝
function saveWithRetry(key, data, maxRetries = 3) {
  let attempts = 0;

  function attemptSave() {
    attempts++;
    console.log(`저장 시도 ${attempts}/${maxRetries}`);

    return comUtil
      .sessionRequest(key, data, "POST")
      .then((result) => {
        if (result.ok) {
          console.log("저장 성공:", result);
          return result;
        } else {
          throw new Error(result.error);
        }
      })
      .catch((error) => {
        console.error(`시도 ${attempts} 실패:`, error.message);

        if (attempts < maxRetries) {
          console.log("재시도 중...");
          // 1초 후 재시도
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(attemptSave());
            }, 1000);
          });
        } else {
          throw new Error(`${maxRetries}번 시도 후 실패: ${error.message}`);
        }
      });
  }

  return attemptSave();
}

// 사용 예
saveWithRetry("important_data", { value: "중요한 데이터" })
  .then((result) => {
    console.log("최종 저장 성공:", result);
  })
  .catch((error) => {
    console.error("최종 실패:", error.message);
  });
```

## 사용 예제

### 예제 1: 사용자 정보 관리

```javascript
async function manageUser() {
  try {
    // 1. 사용자 정보 저장
    const saveResult = await comUtil.postSession("currentUser", {
      id: 1,
      name: "홍길동",
      email: "hong@example.com",
      loginTime: new Date().toISOString(),
    });

    // 2. 사용자 정보 조회
    const userResult = await comUtil.getSessionAsync("currentUser");
    console.log("현재 사용자:", userResult.data);

    // 3. 사용자 정보 업데이트 (병합)
    const updateResult = await comUtil.putSession("currentUser", {
      lastActivity: new Date().toISOString(),
      status: "active",
    });

    // 4. 최종 사용자 정보 확인
    const finalResult = await comUtil.getSessionAsync("currentUser");
    console.log("업데이트된 사용자:", finalResult.data);
  } catch (error) {
    console.error("사용자 관리 중 오류:", error);
  }
}
```

### 예제 2: 장바구니 관리

```javascript
class ShoppingCart {
  async addItem(item) {
    const cartResult = await comUtil.getSessionAsync("cart");
    const cart = cartResult.data || { items: [], total: 0 };

    cart.items.push(item);
    cart.total += item.price;

    return await comUtil.postSession("cart", cart);
  }

  async removeItem(itemId) {
    const cartResult = await comUtil.getSessionAsync("cart");
    if (!cartResult.ok || !cartResult.data)
      return { ok: false, error: "장바구니가 비어있습니다" };

    const cart = cartResult.data;
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1)
      return { ok: false, error: "상품을 찾을 수 없습니다" };

    const removedItem = cart.items.splice(itemIndex, 1)[0];
    cart.total -= removedItem.price;

    return await comUtil.postSession("cart", cart);
  }

  async clearCart() {
    return await comUtil.deleteSession("cart");
  }
}

// 사용
const cart = new ShoppingCart();
await cart.addItem({ id: 1, name: "상품1", price: 10000 });
await cart.addItem({ id: 2, name: "상품2", price: 20000 });
```

### 예제 3: 폼 데이터 임시 저장

```javascript
// 폼 데이터 자동 저장
function setupFormAutoSave(formId, sessionKey) {
  const form = document.getElementById(formId);

  // 폼 데이터 복원
  comUtil.getSessionAsync(sessionKey).then((result) => {
    if (result.ok && result.data) {
      Object.keys(result.data).forEach((key) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) input.value = result.data[key];
      });
    }
  });

  // 입력 시마다 자동 저장
  form.addEventListener(
    "input",
    debounce(async () => {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      await comUtil.postSession(sessionKey, data);
    }, 500)
  );

  // 폼 제출 시 임시 데이터 삭제
  form.addEventListener("submit", async () => {
    await comUtil.deleteSession(sessionKey);
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 사용
setupFormAutoSave("userForm", "formBackup");
```

## 고급 기능

### TTL (Time To Live) 설정

```javascript
// 5분 후 자동 만료
await comUtil.postSession(
  "tempToken",
  { token: "abc123" },
  {
    ttlMs: 5 * 60 * 1000,
  }
);

// 만료된 데이터는 자동으로 null 반환
setTimeout(async () => {
  const result = await comUtil.getSessionAsync("tempToken");
  console.log(result.data); // null (만료됨)
}, 5 * 60 * 1000 + 1000);
```

### 원자적 업데이트

```javascript
// 카운터 증가 (원자적 연산)
const newValue = SessionAdapter.withSession("counter", (current) => {
  return (current || 0) + 1;
});
console.log("새로운 카운터 값:", newValue);
```

### 탭 간 동기화 이벤트

```javascript
// 다른 탭에서의 변경사항 감지
const unsubscribe = SessionAdapter.subscribe((key, value) => {
  console.log(`키 '${key}'가 다른 탭에서 변경됨:`, value);

  if (key === "userInfo") {
    updateUserUI(value);
  }
});

// 구독 해제
// unsubscribe();
```

### Prefix 기반 일괄 삭제

```javascript
// user로 시작하는 모든 키 삭제
const result = await comUtil.deleteSession("user/*");
console.log(`${result.deleted}개의 사용자 관련 데이터가 삭제되었습니다.`);
```

## 에러 처리

### 기본 에러 처리

```javascript
const result = await comUtil.getSessionAsync("nonexistent");
if (!result.ok) {
  console.error("에러 발생:", result.error);
} else {
  console.log("데이터:", result.data);
}
```

### try-catch 사용

```javascript
try {
  const operations = [
    { method: "post", key: "test1", data: { value: 1 } },
    { method: "invalid", key: "test2", data: { value: 2 } }, // 잘못된 메소드
  ];

  const results = await comUtil.batchSession(operations);
  results.forEach((result, index) => {
    if (!result.ok) {
      console.error(`작업 ${index + 1} 실패:`, result.error);
    }
  });
} catch (error) {
  console.error("배치 처리 중 예외 발생:", error);
}
```

## 성능 최적화

### 1. 배치 처리 활용

```javascript
// 비효율적
for (const user of users) {
  await comUtil.postSession(`user_${user.id}`, user);
}

// 효율적
const operations = users.map((user) => ({
  method: "post",
  key: `user_${user.id}`,
  data: user,
}));
await comUtil.batchSession(operations);
```

### 2. 적절한 TTL 설정

```javascript
// 임시 데이터에는 TTL 설정
await comUtil.postSession("searchResults", results, {
  ttlMs: 10 * 60 * 1000, // 10분
});

// 영구 데이터는 TTL 없음
await comUtil.postSession("userPreferences", preferences);
```

### 3. 불필요한 조회 최소화

```javascript
// 데이터 캐싱
let cachedUserInfo = null;

async function getUserInfo() {
  if (!cachedUserInfo) {
    const result = await comUtil.getSessionAsync("userInfo");
    cachedUserInfo = result.ok ? result.data : null;
  }
  return cachedUserInfo;
}
```

## 테스트

### 테스트 파일 실행

```bash
# 브라우저에서 test.html 열기
open test.html
```

### 사용 가능한 테스트

1. **기존 호출 방식 테스트**

   - callSession 테스트 (DELETE)
   - callSession 테스트 (POST)
   - callSession 테스트 (GET)
   - callSessionSync 테스트
   - DELETE만 단독 테스트

2. **새로운 Promise 기반 함수 테스트**

   - Promise POST 테스트
   - Promise GET 테스트
   - Promise DELETE 테스트
   - Promise PUT 테스트
   - Promise BATCH 테스트
   - async/await 테스트
   - 통합 sessionRequest 테스트
   - 통합 sessionCall 테스트

3. **SessionStorage 내용 확인**
   - SessionStorage 내용 보기
   - SessionStorage 초기화

### 수동 테스트

```javascript
// 콘솔에서 직접 테스트
await comUtil.postSession("test", { hello: "world" });
const result = await comUtil.getSessionAsync("test");
console.log(result); // { ok: true, data: { hello: "world" } }
```

## 브라우저 호환성

- **지원 브라우저**: 모든 모던 브라우저 (Chrome, Firefox, Safari, Edge)
- **필요 기능**:
  - sessionStorage
  - Promise/async-await
  - ES6+ 문법 지원

## 라이선스

이 라이브러리는 MIT 라이선스 하에 배포됩니다.

## 기여하기

버그 리포트나 기능 제안은 이슈를 통해 제출해 주세요.

---

**참고**: 이 라이브러리는 sessionStorage를 사용하므로 브라우저 탭이 닫히면 데이
터가 사라집니다. 영구 저장이 필요한 경우 localStorage 버전을 고려해보세요.
