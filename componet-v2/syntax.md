# ComponentLoad.js 사용법

JavaScript 템플릿 엔진으로 HTML 템플릿 파일과 데이터를 받아 지정된 요소에 동적으
로 렌더링하는 라이브러리입니다. 템플릿 내의 IIFE(즉시 실행 함수)도 실행됩니다.

## 📦 설치

```html
<script src="componentload.js"></script>
```

## 🚀 기본 사용법

### 1. 템플릿 파일 생성 (`template.html`)

```html
<div class="my-component">
  <h1>{{title}}</h1>
  <p>{{description}}</p>
  <button onclick="alert('Hello!')">Click Me</button>
  <script>
    (function () {
      console.log("Template loaded!");
      // 템플릿 내 스크립트 실행
    })();
  </script>
</div>
```

### 2. JavaScript에서 호출

```javascript
componentLoad.load(
  "template.html",
  {
    title: "Welcome",
    description: "This is a dynamic component",
  },
  "#targetDiv"
);
```

## 📝 템플릿 문법

### 1. 변수 치환

```handlebars
{{변수명}}
{{중첩.객체.속성}}
```

**예시:**

```html
<h1>{{title}}</h1>
<p>User: {{user.name}}</p>
```

```javascript
{
  title: 'Hello World',
  user: {
    name: 'John',
    age: 30
  }
}
```

### 2. 조건문 (if/else)

#### if/else 문

```handlebars
{{#if 조건}}
  <!-- 조건이 참일 때 -->
{{else}}
  <!-- 조건이 거짓일 때 -->
{{/if}}
```

#### 단순 if 문

```handlebars
{{#if 조건}}
  <!-- 조건이 참일 때만 -->
{{/if}}
```

**예시:**

```html
{{#if isLoggedIn}}
<p>Welcome, {{userName}}!</p>
{{else}}
<p>Please login.</p>
{{/if}} {{#if showWarning}}
<div class="warning">Warning message</div>
{{/if}}
```

### 3. 반복문 (each)

```handlebars
{{#each 배열}}
  <!-- 배열 요소 반복 -->
{{/each}}
```

**객체 배열 예시:**

```html
<ul>
  {{#each products}}
  <li>{{name}} - ${{price}}</li>
  {{/each}}
</ul>
```

```javascript
{
  products: [
    { name: "Laptop", price: 999 },
    { name: "Phone", price: 599 },
  ];
}
```

**단순 배열 예시:**

```html
{{#each tags}}
<span>{{value}}</span>
{{/each}}
```

```javascript
{
  tags: ["new", "sale", "popular"];
}
```

## 📚 고급 사용 예시

### 전체 예시 템플릿

```html
<!-- product-template.html -->
<div class="product-list">
  <h2>{{title}}</h2>

  <!-- 로그인 상태에 따른 UI -->
  {{#if isLoggedIn}}
  <p>Welcome back, {{user.name}}!</p>
  {{else}}
  <p>Please <a href="/login">login</a> to continue.</p>
  {{/if}}

  <!-- 상품 목록 -->
  {{#if products.length}}
  <div class="products">
    {{#each products}}
    <div class="product">
      <h3>{{name}}</h3>
      <p>{{description}}</p>
      <span class="price">${{price}}</span>
      {{#if onSale}}
      <span class="sale-badge">Sale!</span>
      {{/if}}
    </div>
    {{/each}}
  </div>
  <p>Total products: {{products.length}}</p>
  {{else}}
  <p>No products available.</p>
  {{/if}}

  <!-- 태그 목록 -->
  <div class="tags">
    {{#each tags}}
    <span class="tag">{{value}}</span>
    {{/each}}
  </div>

  <script>
    (function () {
      console.log("Product template loaded!");
      // 템플릿 관련 초기화 코드
    })();
  </script>
</div>
```

### JavaScript 호출

```javascript
componentLoad.load(
  "product-template.html",
  {
    title: "Our Products",
    isLoggedIn: true,
    user: {
      name: "Alice",
      email: "alice@example.com",
    },
    products: [
      {
        name: "Gaming Laptop",
        description: "High performance gaming laptop",
        price: 1299,
        onSale: true,
      },
      {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse",
        price: 29,
        onSale: false,
      },
    ],
    tags: ["electronics", "computers", "gaming"],
  },
  "#productContainer"
);
```

## ⚙️ API

### `componentLoad.load(templateUrl, responseData, targetSelector)`

| 파라미터         | 타입   | 설명                            |
| ---------------- | ------ | ------------------------------- |
| `templateUrl`    | string | 템플릿 HTML 파일 경로           |
| `responseData`   | Object | 템플릿에 바인딩할 데이터        |
| `targetSelector` | string | 렌더링할 대상 요소의 CSS 셀렉터 |

**반환값:** Promise (async 함수)

## 🛠️ 특징

- ✅ HTML 템플릿 파일 비동기 로드
- ✅ 중첩 객체 및 배열 데이터 바인딩
- ✅ if/else 조건문 지원
- ✅ each 반복문 지원
- ✅ 템플릿 내 스크립트 실행 (IIFE 포함)
- ✅ 간단한 문법으로 복잡한 UI 구성 가능

## 📝 주의사항

1. 템플릿 파일은 동일 출처 정책을 따라야 합니다.
2. 배열 반복 시 단순 값은 `{{value}}`로 접근합니다.
3. 조건문에서 `undefined`, `null`, `false`, `0`, 빈 문자열은 falsy로 처리됩니다.
4. 템플릿 내 스크립트는 렌더링 후 즉시 실행됩니다.
