"use strict";

/**
 * IndexedDB를 활용한 영속성 데이터 공유 유틸리티
 * 페이지 전환 시에도 데이터가 유지되는 SPA용 데이터 스토어
 */
class DataSharePersistent {
  constructor(dbName = "DataShareDB", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;

    // 메모리 캐시 (빠른 접근용)
    this._memoryCache = {};
    this._watchers = {};
    this._tempData = {};
    this._isDevMode = false;

    // 초기화 상태
    this._isInitialized = false;
    this._initPromise = null;

    console.log("[DataSharePersistent] 생성자 호출됨");
  }

  /**
   * IndexedDB 초기화
   */
  async init() {
    if (this._isInitialized) {
      return Promise.resolve();
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = new Promise((resolve, reject) => {
      console.log("[DataSharePersistent] IndexedDB 초기화 시작");

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error(
          "[DataSharePersistent] IndexedDB 열기 실패:",
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = async () => {
        this.db = request.result;
        console.log("[DataSharePersistent] IndexedDB 연결 성공");

        // 기존 데이터를 메모리 캐시로 로드
        await this._loadFromIndexedDB();

        this._isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log("[DataSharePersistent] IndexedDB 스키마 업그레이드");
        const db = event.target.result;

        // 데이터 저장용 오브젝트 스토어
        if (!db.objectStoreNames.contains("dataStore")) {
          const store = db.createObjectStore("dataStore", { keyPath: "key" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          console.log("[DataSharePersistent] dataStore 오브젝트 스토어 생성");
        }

        // 임시 데이터 저장용 오브젝트 스토어
        if (!db.objectStoreNames.contains("tempStore")) {
          const tempStore = db.createObjectStore("tempStore", {
            keyPath: "key",
          });
          tempStore.createIndex("expireTime", "expireTime", { unique: false });
          console.log("[DataSharePersistent] tempStore 오브젝트 스토어 생성");
        }
      };
    });

    return this._initPromise;
  }

  /**
   * IndexedDB에서 모든 데이터를 메모리 캐시로 로드
   */
  async _loadFromIndexedDB() {
    try {
      const transaction = this.db.transaction(["dataStore"], "readonly");
      const store = transaction.objectStore("dataStore");
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const results = request.result;
          results.forEach((item) => {
            this._memoryCache[item.key] = item.value;
          });
          console.log(
            `[DataSharePersistent] ${results.length}개 데이터를 메모리 캐시로 로드`
          );
          resolve();
        };

        request.onerror = () => {
          console.error(
            "[DataSharePersistent] 데이터 로드 실패:",
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("[DataSharePersistent] _loadFromIndexedDB 오류:", error);
    }
  }

  /**
   * 개발 모드 설정
   */
  setDevMode(enabled) {
    this._isDevMode = enabled;
    if (enabled) {
      console.log("[DataSharePersistent] 개발 모드가 활성화되었습니다.");
    }
  }

  /**
   * 데이터 저장 (메모리 + IndexedDB)
   */
  async set(key, value, persistent = true) {
    if (!key || typeof key !== "string") {
      throw new Error("키는 문자열이어야 합니다.");
    }

    await this.init();

    const oldValue = this._memoryCache[key];
    this._memoryCache[key] = value;

    if (this._isDevMode) {
      console.log(`[DataSharePersistent] SET: ${key}`, {
        oldValue,
        newValue: value,
        persistent,
      });
    }

    // 영속성 저장이 필요한 경우 IndexedDB에도 저장
    if (persistent) {
      try {
        const transaction = this.db.transaction(["dataStore"], "readwrite");
        const store = transaction.objectStore("dataStore");

        const data = {
          key: key,
          value: value,
          timestamp: Date.now(),
        };

        await new Promise((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        if (this._isDevMode) {
          console.log(`[DataSharePersistent] IndexedDB 저장 완료: ${key}`);
        }
      } catch (error) {
        console.error(
          `[DataSharePersistent] IndexedDB 저장 실패: ${key}`,
          error
        );
      }
    }

    // 변경 사항을 구독자들에게 알림
    this._notify(key, value, oldValue);
  }

  /**
   * 데이터 조회 (메모리 캐시에서)
   */
  get(key) {
    if (!key || typeof key !== "string") {
      throw new Error("키는 문자열이어야 합니다.");
    }

    const value = this._memoryCache[key];

    if (this._isDevMode) {
      console.log(`[DataSharePersistent] GET: ${key}`, value);
    }

    return value;
  }

  /**
   * 데이터 감시
   */
  watch(keys, callback) {
    if (!callback || typeof callback !== "function") {
      throw new Error("콜백은 함수여야 합니다.");
    }

    const keyArray = Array.isArray(keys) ? keys : [keys];
    const unsubscribeFunctions = [];

    keyArray.forEach((key) => {
      if (!this._watchers[key]) {
        this._watchers[key] = [];
      }

      const watcherInfo = {
        callback,
        id: Date.now() + Math.random(),
      };

      this._watchers[key].push(watcherInfo);

      if (this._isDevMode) {
        console.log(`[DataSharePersistent] WATCH 등록: ${key}`);
      }

      unsubscribeFunctions.push(() => {
        const index = this._watchers[key].findIndex(
          (w) => w.id === watcherInfo.id
        );
        if (index !== -1) {
          this._watchers[key].splice(index, 1);
          if (this._isDevMode) {
            console.log(`[DataSharePersistent] WATCH 해제: ${key}`);
          }
        }
      });
    });

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }

  /**
   * 데이터 삭제
   */
  async clear(key) {
    await this.init();

    if (key) {
      // 특정 키 삭제
      if (this._memoryCache.hasOwnProperty(key)) {
        const oldValue = this._memoryCache[key];
        delete this._memoryCache[key];

        if (this._isDevMode) {
          console.log(`[DataSharePersistent] CLEAR: ${key}`, oldValue);
        }

        // IndexedDB에서도 삭제
        try {
          const transaction = this.db.transaction(["dataStore"], "readwrite");
          const store = transaction.objectStore("dataStore");

          await new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          console.error(
            `[DataSharePersistent] IndexedDB 삭제 실패: ${key}`,
            error
          );
        }

        this._notify(key, undefined, oldValue);
      }
    } else {
      // 전체 데이터 삭제
      const keys = Object.keys(this._memoryCache);
      this._memoryCache = {};

      if (this._isDevMode) {
        console.log("[DataSharePersistent] CLEAR ALL:", keys);
      }

      // IndexedDB에서도 전체 삭제
      try {
        const transaction = this.db.transaction(["dataStore"], "readwrite");
        const store = transaction.objectStore("dataStore");

        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error("[DataSharePersistent] IndexedDB 전체 삭제 실패:", error);
      }

      keys.forEach((k) => this._notify(k, undefined, this._memoryCache[k]));
    }
  }

  /**
   * 임시 데이터 저장 (메모리만, 자동 삭제)
   */
  temp(key, value, ttl = 300000) {
    // 메모리에만 저장 (영속성 없음)
    this.set(key, value, false);

    // 기존 타이머 제거
    if (this._tempData[key]) {
      clearTimeout(this._tempData[key]);
    }

    // 새로운 타이머 설정
    this._tempData[key] = setTimeout(() => {
      delete this._memoryCache[key];
      delete this._tempData[key];

      if (this._isDevMode) {
        console.log(`[DataSharePersistent] TEMP 자동 삭제: ${key}`);
      }

      this._notify(key, undefined, value);
    }, ttl);

    if (this._isDevMode) {
      console.log(`[DataSharePersistent] TEMP 설정: ${key}, TTL: ${ttl}ms`);
    }
  }

  /**
   * 모든 데이터 조회
   */
  getAll() {
    return { ...this._memoryCache };
  }

  /**
   * 모든 키 조회
   */
  getKeys() {
    return Object.keys(this._memoryCache);
  }

  /**
   * 패턴으로 키 조회
   */
  getKeysByPattern(pattern) {
    const regex = new RegExp(pattern.replace("*", ".*"));
    return Object.keys(this._memoryCache).filter((key) => regex.test(key));
  }

  /**
   * IndexedDB 통계 정보
   */
  async getStats() {
    await this.init();

    try {
      const transaction = this.db.transaction(["dataStore"], "readonly");
      const store = transaction.objectStore("dataStore");

      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => {
          resolve({
            memoryKeys: Object.keys(this._memoryCache).length,
            indexedDBKeys: request.result,
            watchers: Object.keys(this._watchers).length,
            tempData: Object.keys(this._tempData).length,
          });
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("[DataSharePersistent] 통계 조회 실패:", error);
      return {
        memoryKeys: Object.keys(this._memoryCache).length,
        indexedDBKeys: 0,
        watchers: Object.keys(this._watchers).length,
        tempData: Object.keys(this._tempData).length,
      };
    }
  }

  /**
   * 변경 사항을 구독자들에게 알림
   */
  _notify(key, newValue, oldValue) {
    if (this._watchers[key]) {
      this._watchers[key].forEach((watcher) => {
        try {
          watcher.callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`[DataSharePersistent] 콜백 실행 중 오류 발생:`, error);
        }
      });
    }

    // 패턴 매칭 지원
    Object.keys(this._watchers).forEach((watchKey) => {
      if (watchKey.includes("*")) {
        const regex = new RegExp(watchKey.replace("*", ".*"));
        if (regex.test(key)) {
          this._watchers[watchKey].forEach((watcher) => {
            try {
              watcher.callback(newValue, oldValue, key);
            } catch (error) {
              console.error(
                `[DataSharePersistent] 패턴 콜백 실행 중 오류 발생:`,
                error
              );
            }
          });
        }
      }
    });
  }

  /**
   * 데이터베이스 연결 종료
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._isInitialized = false;
      console.log("[DataSharePersistent] IndexedDB 연결이 종료되었습니다.");
    }
  }
}

// 싱글톤 인스턴스 생성 및 전역 노출
console.log("[DataSharePersistent.js] 스크립트 로딩 시작");

try {
  const dataSharePersistentInstance = new DataSharePersistent();

  // 전역 객체로 노출 (브라우저 환경)
  if (typeof window !== "undefined") {
    window.DataShare = dataSharePersistentInstance;
    console.log("[DataSharePersistent.js] window.DataShare 설정 완료");
    console.log(
      "[DataSharePersistent.js] window.DataShare 메서드들:",
      Object.getOwnPropertyNames(window.DataShare)
    );
  } else {
    console.log(
      "[DataSharePersistent.js] window 객체가 없습니다 (Node.js 환경)"
    );
  }

  // 모듈로 노출 (Node.js 환경)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = dataSharePersistentInstance;
    console.log("[DataSharePersistent.js] module.exports 설정 완료");
  }
} catch (error) {
  console.error("[DataSharePersistent.js] 초기화 중 오류 발생:", error);
}
