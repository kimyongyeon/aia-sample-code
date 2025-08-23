// session-adapter.js
const SS_PREFIX = "SS:";
const DEFAULT_TTL_MS = null; // TTL 미사용이 기본. 쓰고 싶으면 옵션으로 넣기.

function toKey(url) {
  // 서버 endpoint를 키로 치환. 필요시 규칙 맞춰 커스터마이즈.
  // ex) /api/session/user?id=1  ->  SS:/api/session/user?id=1
  return `${SS_PREFIX}${url}`;
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
 * callSession(url, method, callback, data?, options?)
 * - method: 'get' | 'post' | 'put' | 'delete'
 * - data:   저장/병합 시 사용할 값 (Object/Primitive)
 * - options: { ttlMs?: number, merge?: boolean } (put 전용으로 주로 사용)
 *
 * 반환: Promise<any> (동시에 callback에도 전달)
 */
function callSession(
  url,
  method = "get",
  callback,
  data = undefined,
  options = {}
) {
  const key = toKey(url);
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
        // prefix 삭제 지원: url 끝이 '/*'면 해당 prefix 모두 삭제
        if (url.endsWith("/*")) {
          const prefix = toKey(url.slice(0, -2));
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
function getSession(url) {
  const key = toKey(url);
  const { hit, data, expired } = unpack(sessionStorage.getItem(key));
  if (expired) sessionStorage.removeItem(key);
  return hit ? data : null;
}

function setSession(url, value, ttlMs = DEFAULT_TTL_MS) {
  sessionStorage.setItem(toKey(url), pack(value, ttlMs));
  return true;
}

function delSession(url) {
  if (url.endsWith("/*")) {
    const prefix = toKey(url.slice(0, -2));
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
    return toRemove.length;
  } else {
    sessionStorage.removeItem(toKey(url));
    return 1;
  }
}

/**
 * 원자적 업데이트 편의기능 (동기지만 동작은 원샷)
 * withSession('/user/1', draft => { draft.count = (draft.count||0)+1; return draft })
 */
function withSession(url, updater, ttlMs = DEFAULT_TTL_MS) {
  const key = toKey(url);
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

window.SessionAdapter = {
  callSession,
  getSession,
  setSession,
  delSession,
  withSession,
  subscribe,
};
