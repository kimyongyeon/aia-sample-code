// SingleCheckboxManager.js
const SingleCheckboxManager = (() => {
  "use strict";

  class SingleCheckboxManager {
    /**
     * @param {string} containerSelector - 체크박스들이 포함된 부모 요소의 CSS 선택자
     */
    constructor(containerSelector) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        throw new Error(`Container not found: ${containerSelector}`);
      }

      // 이벤트 위임 설정
      this.container.addEventListener("change", (e) => this._handleChange(e));
    }

    /**
     * 체크박스 변경 이벤트 핸들러
     * @param {Event} e - change 이벤트 객체
     */
    _handleChange(e) {
      const target = e.target;

      // 체크박스가 아니면 무시
      if (target.type !== "checkbox") return;

      // 다른 체크박스 모두 해제
      this._clearAllExcept(target);
    }

    /**
     * 선택된 체크박스 외 모든 체크박스 해제
     * @param {HTMLInputElement} currentCheckbox - 현재 선택된 체크박스
     */
    _clearAllExcept(currentCheckbox) {
      const checkboxes = this.container.querySelectorAll(
        'input[type="checkbox"]'
      );

      checkboxes.forEach((cb) => {
        if (cb !== currentCheckbox) {
          cb.checked = false;
        }
      });
    }

    /**
     * 현재 선택된 체크박스의 값을 반환
     * @returns {string|null}
     */
    getSelectedValue() {
      const checked = this.container.querySelector(
        'input[type="checkbox"]:checked'
      );
      return checked ? checked.value : null;
    }

    /**
     * 모든 체크박스 초기화 (선택 해제)
     */
    clearAll() {
      const checkboxes = this.container.querySelectorAll(
        'input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
    }
  }

  // IIFE에서 클래스를 반환
  return SingleCheckboxManager;
})();
