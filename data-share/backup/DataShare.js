"use strict";

/**
 * SPA 환경을 위한 메모리 기반 데이터 공유 유틸리티
 * watch, set, get, clear 기능을 포함한 반응형 데이터 스토어
 */
class DataShare {
  constructor() {
    this._data = {};
    this._watchers = {};
    this._tempData = {};
    this._isDevMode = false;
  }

  /**
   * 개발 모드 설정 (로깅 활성화)
   * @param {boolean} enabled - 개발 모드 활성화 여부
   */
  setDevMode(enabled) {
    this._isDevMode = enabled;
    if (enabled) {
      console.log("[DataShare] 개발 모드가 활성화되었습니다.");
    }
  }

  /**
   * 데이터 저장
   * @param {string} key - 저장할 키 (네임스페이스 지원: 'user.profile')
   * @param {any} value - 저장할 값
   */
  set(key, value) {
    if (!key || typeof key !== "string") {
      throw new Error("키는 문자열이어야 합니다.");
    }

    const oldValue = this._data[key];
    this._data[key] = value;

    if (this._isDevMode) {
      console.log(`[DataShare] SET: ${key}`, { oldValue, newValue: value });
    }

    // 변경 사항을 구독자들에게 알림
    this._notify(key, value, oldValue);
  }

  /**
   * 데이터 조회
   * @param {string} key - 조회할 키
   * @returns {any} 저장된 값 또는 undefined
   */
  get(key) {
    if (!key || typeof key !== "string") {
      throw new Error("키는 문자열이어야 합니다.");
    }

    const value = this._data[key];

    if (this._isDevMode) {
      console.log(`[DataShare] GET: ${key}`, value);
    }

    return value;
  }

  /**
   * 특정 키의 데이터 변경을 감시
   * @param {string|string[]} keys - 감시할 키 또는 키 배열
   * @param {Function} callback - 변경 시 호출될 콜백 함수
   * @returns {Function} 구독 해제 함수
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
        console.log(`[DataShare] WATCH 등록: ${key}`);
      }

      // 각 키별 구독 해제 함수 생성
      unsubscribeFunctions.push(() => {
        const index = this._watchers[key].findIndex(
          (w) => w.id === watcherInfo.id
        );
        if (index !== -1) {
          this._watchers[key].splice(index, 1);
          if (this._isDevMode) {
            console.log(`[DataShare] WATCH 해제: ${key}`);
          }
        }
      });
    });

    // 모든 키의 구독을 한번에 해제하는 함수 반환
    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }

  /**
   * 특정 키 또는 전체 데이터 삭제
   * @param {string} [key] - 삭제할 키 (생략 시 전체 삭제)
   */
  clear(key) {
    if (key) {
      // 특정 키만 삭제
      if (this._data.hasOwnProperty(key)) {
        const oldValue = this._data[key];
        delete this._data[key];

        if (this._isDevMode) {
          console.log(`[DataShare] CLEAR: ${key}`, oldValue);
        }

        this._notify(key, undefined, oldValue);
      }
    } else {
      // 전체 데이터 삭제
      const keys = Object.keys(this._data);
      this._data = {};

      if (this._isDevMode) {
        console.log("[DataShare] CLEAR ALL:", keys);
      }

      // 모든 키에 대해 삭제 알림
      keys.forEach((k) => this._notify(k, undefined, this._data[k]));
    }
  }

  /**
   * 임시 데이터 저장 (자동 삭제)
   * @param {string} key - 저장할 키
   * @param {any} value - 저장할 값
   * @param {number} ttl - 생존 시간(밀리초), 기본값: 5분
   */
  temp(key, value, ttl = 300000) {
    this.set(key, value);

    // 기존 타이머가 있다면 제거
    if (this._tempData[key]) {
      clearTimeout(this._tempData[key]);
    }

    // 새로운 타이머 설정
    this._tempData[key] = setTimeout(() => {
      this.clear(key);
      delete this._tempData[key];

      if (this._isDevMode) {
        console.log(`[DataShare] TEMP 자동 삭제: ${key}`);
      }
    }, ttl);

    if (this._isDevMode) {
      console.log(`[DataShare] TEMP 설정: ${key}, TTL: ${ttl}ms`);
    }
  }

  /**
   * 현재 저장된 모든 데이터 조회
   * @returns {Object} 모든 데이터의 복사본
   */
  getAll() {
    return { ...this._data };
  }

  /**
   * 저장된 키 목록 조회
   * @returns {string[]} 키 배열
   */
  getKeys() {
    return Object.keys(this._data);
  }

  /**
   * 특정 패턴의 키들 조회
   * @param {string} pattern - 검색 패턴 (예: 'user.*')
   * @returns {string[]} 매칭되는 키 배열
   */
  getKeysByPattern(pattern) {
    const regex = new RegExp(pattern.replace("*", ".*"));
    return Object.keys(this._data).filter((key) => regex.test(key));
  }

  /**
   * 변경 사항을 구독자들에게 알림
   * @private
   */
  _notify(key, newValue, oldValue) {
    if (this._watchers[key]) {
      this._watchers[key].forEach((watcher) => {
        try {
          watcher.callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`[DataShare] 콜백 실행 중 오류 발생:`, error);
        }
      });
    }

    // 패턴 매칭 지원 (예: 'user.*' 패턴으로 등록된 watcher들)
    Object.keys(this._watchers).forEach((watchKey) => {
      if (watchKey.includes("*")) {
        const regex = new RegExp(watchKey.replace("*", ".*"));
        if (regex.test(key)) {
          this._watchers[watchKey].forEach((watcher) => {
            try {
              watcher.callback(newValue, oldValue, key);
            } catch (error) {
              console.error(`[DataShare] 패턴 콜백 실행 중 오류 발생:`, error);
            }
          });
        }
      }
    });
  }
}

// 싱글톤 인스턴스 생성 및 전역 노출
console.log("[DataShare.js] 스크립트 로딩 시작");

try {
  const dataShareInstance = new DataShare();
  console.log(
    "[DataShare.js] DataShare 인스턴스 생성 완료:",
    dataShareInstance
  );

  // 전역 객체로 노출 (브라우저 환경)
  if (typeof window !== "undefined") {
    window.DataShare = dataShareInstance;
    console.log("[DataShare.js] window.DataShare 설정 완료");
    console.log(
      "[DataShare.js] window.DataShare 메서드들:",
      Object.getOwnPropertyNames(window.DataShare)
    );
  } else {
    console.log("[DataShare.js] window 객체가 없습니다 (Node.js 환경)");
  }

  // 모듈로 노출 (Node.js 환경)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = dataShareInstance;
    console.log("[DataShare.js] module.exports 설정 완료");
  }
} catch (error) {
  console.error("[DataShare.js] 초기화 중 오류 발생:", error);
}
