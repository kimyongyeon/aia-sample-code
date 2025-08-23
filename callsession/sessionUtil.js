// session-adapter.js
const SS_PREFIX = "SS:";
const DEFAULT_TTL_MS = null; // TTL 미사용이 기본. 쓰고 싶으면 옵션으로 넣기.

function toKey(paramId) {
  // paramId를 sessionStorage 키로 직접 사용
  // ex) "claimInfo"  ->  SS:claimInfo
  return `${SS_PREFIX}${paramId}`;
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

function pack(value, ttlMs = DEFAULT_TTL_MS) {
  const exp = ttlMs ? now() + ttlMs : null;
  return JSON.stringify({ __exp: exp, data: value });
}

function unpack(packed) {
  if (!packed) return { hit: false, data: null };
  const obj = safeParse(packed);
  if (!obj) return { hit: false, data: null };
  if (obj.__exp && obj.__exp < now()) {
    return { hit: false, data: null, expired: true };
  }
  return { hit: true, data: obj.data };
}

function asyncWrap(value, callback) {
  // 기존 콜백 스타일 유지 + Promise 반환 (둘 다 지원)
  return new Promise((resolve) => {
    queueMicrotask(() => {
      if (typeof callback === "function") callback(value);
      resolve(value);
    });
  });
}

/**
 * callSession(paramId, method, callback, data?, options?)
 * - method: 'get' | 'post' | 'put' | 'delete'
 * - data:   저장/병합 시 사용할 값 (Object/Primitive)
 * - options: { ttlMs?: number, merge?: boolean } (put 전용으로 주로 사용)
 *
 * 반환: Promise<any> (동시에 callback에도 전달)
 */
function callSession(
  paramId,
  method = "get",
  callback,
  data = undefined,
  options = {}
) {
  const key = toKey(paramId);
  const m = String(method).toLowerCase();

  try {
    switch (m) {
      case "get": {
        const {
          hit,
          data: value,
          expired,
        } = unpack(sessionStorage.getItem(key));
        if (expired) sessionStorage.removeItem(key);
        return asyncWrap(hit ? value : null, callback);
      }

      case "post": {
        // create or overwrite
        sessionStorage.setItem(key, pack(data, options.ttlMs));
        return asyncWrap({ ok: true }, callback);
      }

      case "put": {
        // merge or overwrite
        const current = unpack(sessionStorage.getItem(key));
        let next = data;
        if (
          options.merge !== false &&
          current.hit &&
          isMergeable(current.data) &&
          isMergeable(data)
        ) {
          next = { ...current.data, ...data };
        }
        sessionStorage.setItem(key, pack(next, options.ttlMs));
        return asyncWrap({ ok: true }, callback);
      }

      case "delete": {
        // prefix 삭제 지원: paramId 끝이 '/*'면 해당 prefix 모두 삭제
        if (paramId.endsWith("/*")) {
          const prefix = toKey(paramId.slice(0, -2));
          const toRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(prefix)) toRemove.push(k);
          }
          toRemove.forEach((k) => sessionStorage.removeItem(k));
          return asyncWrap({ ok: true, deleted: toRemove.length }, callback);
        } else {
          sessionStorage.removeItem(key);
          return asyncWrap({ ok: true }, callback);
        }
      }

      default:
        return asyncWrap({ ok: false, error: "Unsupported method" }, callback);
    }
  } catch (e) {
    return asyncWrap({ ok: false, error: e?.message || String(e) }, callback);
  }
}

function isMergeable(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// 편의 함수들 (선택 사용)
function getSession(paramId) {
  const key = toKey(paramId);
  const { hit, data, expired } = unpack(sessionStorage.getItem(key));
  if (expired) sessionStorage.removeItem(key);
  return hit ? data : null;
}

function setSession(paramId, value, ttlMs = DEFAULT_TTL_MS) {
  sessionStorage.setItem(toKey(paramId), pack(value, ttlMs));
  return true;
}

function delSession(paramId) {
  if (paramId.endsWith("/*")) {
    const prefix = toKey(paramId.slice(0, -2));
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
    return toRemove.length;
  } else {
    sessionStorage.removeItem(toKey(paramId));
    return 1;
  }
}

/**
 * 원자적 업데이트 편의기능 (동기지만 동작은 원샷)
 * withSession('user1', draft => { draft.count = (draft.count||0)+1; return draft })
 */
function withSession(paramId, updater, ttlMs = DEFAULT_TTL_MS) {
  const key = toKey(paramId);
  const cur = unpack(sessionStorage.getItem(key));
  const base = cur.hit
    ? isMergeable(cur.data)
      ? structuredClone(cur.data)
      : cur.data
    : undefined;
  const next = updater(base);
  sessionStorage.setItem(key, pack(next, ttlMs));
  return next;
}

/**
 * 탭 간 동기화 이벤트 구독 (선택)
 * subscribe((key, value) => { ... })
 */
function subscribe(listener) {
  const handler = (e) => {
    if (e.storageArea !== sessionStorage) return;
    if (!e.key || !e.key.startsWith(SS_PREFIX)) return;
    const { data } = unpack(e.newValue);
    listener(e.key.slice(SS_PREFIX.length), data);
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * 기존 comUtil.callSession 호출 방식과 호환되는 함수들
 */

/**
 * 기존 callSession 함수와 호환되는 sessionStorage 기반 구현
 * @param {string} paramId - 세션 키 ID (sessionStorage 키로 직접 사용)
 * @param {Object} param - 저장할 데이터 (POST/PUT 시 사용)
 * @param {string} process - 처리 타입 (무시됨, 호환성을 위해 유지)
 * @param {string} method - HTTP 메소드 ("GET", "POST", "PUT", "DELETE")
 * @param {Function} afterFn - 콜백 함수
 * @returns {Promise} - Promise 객체
 */
function callSessionCompat(paramId, param, process, method, afterFn) {
  const methodType = method || "POST";

  return new Promise((resolve) => {
    queueMicrotask(() => {
      try {
        let result = null;

        switch (methodType.toUpperCase()) {
          case "GET":
            const data = getSession(paramId);
            result = { ok: true, data: data };
            break;

          case "POST":
            setSession(paramId, param);
            result = { ok: true, data: param };
            break;

          case "PUT":
            // 기존 데이터와 병합
            const existingData = getSession(paramId);
            const mergedData =
              existingData &&
              typeof existingData === "object" &&
              typeof param === "object"
                ? { ...existingData, ...param }
                : param;
            setSession(paramId, mergedData);
            result = { ok: true, data: mergedData };
            break;

          case "DELETE":
            delSession(paramId);
            result = { ok: true };
            break;

          default:
            result = { ok: false, error: "지원하지 않는 메소드입니다." };
        }

        if (afterFn && typeof afterFn === "function") {
          afterFn(result);
        }

        resolve(result);
      } catch (error) {
        const errorResult = { ok: false, error: error.message };
        if (afterFn && typeof afterFn === "function") {
          afterFn(errorResult);
        }
        resolve(errorResult);
      }
    });
  });
}

/**
 * 동기식 세션 처리 함수 (기존 callSessionSync와 호환)
 * @param {string} paramId - 세션 키 ID (sessionStorage 키로 직접 사용)
 * @param {Object} param - 저장할 데이터
 * @param {string} process - 처리 타입 (무시됨, 호환성을 위해 유지)
 * @param {string} method - HTTP 메소드
 * @returns {Object} - 처리 결과
 */
function callSessionSyncCompat(paramId, param, process, method) {
  const methodType = method || "POST";

  try {
    let result = null;

    switch (methodType.toUpperCase()) {
      case "GET":
        const data = getSession(paramId);
        result = { ok: true, data: data };
        break;

      case "POST":
        setSession(paramId, param);
        result = { ok: true, data: param };
        break;

      case "PUT":
        // 기존 데이터와 병합
        const existingData = getSession(paramId);
        const mergedData =
          existingData &&
          typeof existingData === "object" &&
          typeof param === "object"
            ? { ...existingData, ...param }
            : param;
        setSession(paramId, mergedData);
        result = { ok: true, data: mergedData };
        break;

      case "DELETE":
        delSession(paramId);
        result = { ok: true };
        break;

      default:
        result = { ok: false, error: "지원하지 않는 메소드입니다." };
    }

    return result;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

window.SessionAdapter = {
  callSession,
  getSession,
  setSession,
  delSession,
  withSession,
  subscribe,
  // 기존 호출 방식과 호환되는 함수들
  callSessionCompat,
  callSessionSyncCompat,
};

// comUtil 네임스페이스가 있다면 거기에도 추가
if (typeof window.comUtil === "undefined") {
  window.comUtil = {};
}

// 기존 호출 방식 그대로 사용할 수 있도록 함수 등록
window.comUtil.callSession = callSessionCompat;
window.comUtil.callSessionSync = callSessionSyncCompat;
