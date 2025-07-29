# 📄 FormElementManager 사용 가이드

> **모든 폼 요소를 하나로 통합 관리하는 자바스크립트 폼 매니저**  
> 이벤트 위임 기반, ES6 + IIFE, 동적 요소 지원, 전체 ↔ 개별 체크박스 연동

---

## ✅ 1. 개요

`FormElementManager`는 HTML 폼 요소(`input`, `select`, `textarea`, `checkbox`,
`radio`)를 **자동으로 추적하고 제어**하는 자바스크립트 라이브러리입니다.

### ✅ 주요 기능

- 실시간 값 추적 (`getValues()`)
- 값 설정 (`setValue()`)
- 전체 ↔ 개별 체크박스 연동 (단순 ON/OFF)
- 이벤트 위임으로 **동적 요소 자동 지원**
- `onChange` 콜백 제공
- `reset()`으로 폼 초기화

> ❌ `indeterminate` 상태 사용 **안 함** → 중간 상태 없이 **순수 토글 방식**

---

## ✅ 2. 설치 및 설정

### 1. HTML에 컨테이너 정의

```html
<div id="myForm">
  <!-- 폼 요소들 -->
</div>
```

### 2. JS 파일 포함

```html
<script src="FormElementManager.js"></script>
```

> 또는 직접 스크립트 태그 내에 코드 삽입

### 3. 매니저 초기화

```js
const manager = new FormElementManager("#myForm", {
  onChange: (data) => {
    console.log("값 변경:", data.name, "→", data.value);
  },
});
```

| 파라미터            | 설명                                     |
| ------------------- | ---------------------------------------- |
| `containerSelector` | 폼 컨테이너의 CSS 선택자 (필수)          |
| `options.onChange`  | 값이 변경될 때 호출되는 콜백 함수 (옵션) |

---

## ✅ 3. 전체 ↔ 개별 체크박스 설정

### HTML 구조 예시

```html
<div id="myForm">
  <!-- 전체 선택 체크박스 -->
  <label>
    <input type="checkbox" data-master data-group="hobbies" /> 전체 선택 </label
  ><br />

  <!-- 개별 체크박스 (name="hobbies") -->
  <label><input type="checkbox" name="hobbies" value="reading" /> 독서</label
  ><br />
  <label><input type="checkbox" name="hobbies" value="sports" /> 운동</label
  ><br />
  <label><input type="checkbox" name="hobbies" value="music" /> 음악</label
  ><br />
</div>
```

### 속성 설명

| 속성                   | 설명                                               |
| ---------------------- | -------------------------------------------------- |
| `data-master`          | 이 체크박스가 "전체 선택"임을 나타냄               |
| `data-group="hobbies"` | 제어할 개별 체크박스의 `name` 속성과 일치시켜야 함 |

---

### ✅ 동작 방식

| 사용자 액션                  | 결과                                |
| ---------------------------- | ----------------------------------- |
| 전체 체크박스 클릭           | 모든 `name="hobbies"` 체크박스 선택 |
| 개별 체크박스 하나 해제      | 전체 체크박스 **즉시 해제**         |
| 모든 개별 체크박스 다시 선택 | 전체 체크박스 **다시 선택됨**       |
| `indeterminate` 상태         | ❌ 사용 안 함                       |

---

## ✅ 4. 지원 요소 목록

| 요소                          | 처리 방식                            |
| ----------------------------- | ------------------------------------ | ------ | --- | ---------- | ------ |
| `input[type=text              | email                                | number | tel | password]` | 문자열 |
| `textarea`                    | 문자열                               |
| `select`                      | 선택된 값 (싱글: 문자열, 멀티: 배열) |
| `input[type=radio]`           | 선택된 값 (문자열)                   |
| `input[type=checkbox]` (단일) | `true` / `false`                     |
| `input[type=checkbox]` (그룹) | 배열 `["value1", "value2"]`          |

---

## ✅ 5. API 문서

### 📌 `getValues() → Object`

모든 폼 요소의 현재 값을 객체로 반환합니다.

```js
console.log(manager.getValues());
// {
//   username: "홍길동",
//   hobbies: ["reading", "sports"],
//   gender: "male",
//   city: "seoul"
// }
```

---

### 📌 `getValue(name) → any`

특정 필드의 값을 반환합니다.

```js
manager.getValue("hobbies"); // ["reading", "sports"]
manager.getValue("username"); // "홍길동"
```

---

### 📌 `setValue(name, value)`

특정 필드에 값을 설정합니다.

```js
manager.setValue("username", "김철수");
manager.setValue("gender", "female");
manager.setValue("hobbies", ["reading", "music"]); // 배열로 설정
manager.setValue("agree", true); // 단일 체크박스
```

> ✅ 자동으로 UI와 상태 동기화  
> ✅ 전체 체크박스도 자동 갱신

---

### 📌 `reset()`

모든 폼 요소를 초기 상태로 되돌립니다.

```js
manager.reset();
```

> - 텍스트 필드: 빈 문자열
> - 체크박스/라디오: 해제
> - 셀렉트: 기본값
> - 전체 체크박스: 해제

---

### 📌 `remove(name)`

메모리에서 특정 필드 값을 제거합니다 (더 이상 추적하지 않음).

```js
manager.remove("tempField");
```

---

## ✅ 6. onChange 콜백

값이 변경될 때마다 실행되는 콜백 함수입니다.

```js
const manager = new FormElementManager("#myForm", {
  onChange: (data) => {
    console.log(`[변경] ${data.name} →`, data.value);
    console.log("변경 시간:", data.timestamp);
    console.log("DOM 요소:", data.element);
  },
});
```

| 속성        | 설명               |
| ----------- | ------------------ |
| `name`      | 필드 이름 또는 ID  |
| `value`     | 새 값              |
| `element`   | DOM 요소 참조      |
| `timestamp` | 변경 시각 (`Date`) |

---

## ✅ 7. 동적 요소 지원

동적으로 추가된 요소도 **자동으로 제어**됩니다.

```js
// 동적 체크박스 추가
const newCb = document.createElement("input");
newCb.type = "checkbox";
newCb.name = "hobbies";
newCb.value = "travel";

document.getElementById("myForm").appendChild(newCb);

// 이제 setValue로 제어 가능
manager.setValue("hobbies", ["reading", "travel"]);
```

> ✅ 이벤트 위임 덕분에 **자동 감지**

---

## ✅ 8. 주의사항

- `name` 또는 `id` 속성은 **반드시 있어야 함** (값 저장용 키로 사용)
- `data-group`과 `name`이 **정확히 일치**해야 함
- `indeterminate` 상태는 **의도적으로 사용하지 않음**
- 단일 체크박스는 `name`이 없을 경우 `true/false`로 처리

---

## ✅ 9. 예제 코드 전체

```html
<!DOCTYPE html>
<html>
  <head>
    <title>FormElementManager 예제</title>
  </head>
  <body>
    <div id="myForm">
      <input type="text" name="username" placeholder="이름" /><br />

      <label>
        <input type="checkbox" data-master data-group="hobbies" /> 전체 선택 </label
      ><br />
      <label
        ><input type="checkbox" name="hobbies" value="reading" /> 독서</label
      ><br />
      <label><input type="checkbox" name="hobbies" value="sports" /> 운동</label
      ><br />
      <label><input type="checkbox" name="hobbies" value="music" /> 음악</label
      ><br />

      <label><input type="radio" name="gender" value="male" /> 남자</label>
      <label><input type="radio" name="gender" value="female" /> 여자</label
      ><br />

      <select name="city">
        <option value="">도시</option>
        <option value="seoul">서울</option>
        <option value="busan">부산</option></select
      ><br />

      <textarea name="comment"></textarea><br />
    </div>

    <button onclick="console.log(manager.getValues())">전체 값 보기</button>
    <button onclick="manager.setValue('username', '테스트')">이름 설정</button>
    <button onclick="manager.reset()">초기화</button>

    <script src="FormElementManager.js"></script>
    <script>
      const manager = new FormElementManager("#myForm", {
        onChange: (data) => {
          console.log("[변경]", data.name, ":", data.value);
        },
      });
    </script>
  </body>
</html>
```

---

## ✅ 10. FAQ

### Q. `indeterminate` 상태를 넣고 싶은데?

A. 현재 버전은 **단순 ON/OFF**를 목적으로 하여 제거했습니다. 필요시 요청해 주세
요.

### Q. 폼 유효성 검사는 지원하나요?

A. 기본 제공하지 않지만, `getValues()` + 커스텀 로직으로 쉽게 구현 가능합니다.

### Q. TypeScript 버전 있나요?

A. 필요하시면 제공해 드릴 수 있습니다.

---

## ✅ 결론

이제 `FormElementManager` 하나로 **모든 폼 상태를 깔끔하게 관리**할 수 있습니다
.  
특히 **전체 선택 체크박스**와의 연동이 매우 직관적이고, **개발 생산성**을 크게높
여줍니다.
