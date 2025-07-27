// componentload.js

const componentLoad = {
  /**
   * 템플릿 파일을 로드하고 데이터를 바인딩한 후 지정된 요소에 삽입
   * @param {string} templateUrl - 템플릿 HTML 파일 경로
   * @param {Object} responseData - 템플릿에 바인딩할 데이터
   * @param {string} targetSelector - 삽입할 대상 요소 셀렉터
   */
  load: async function (templateUrl, responseData, targetSelector) {
    try {
      const response = await fetch(templateUrl);
      if (!response.ok)
        throw new Error(`Template load failed: ${response.statusText}`);

      let templateHTML = await response.text();

      // 고급 데이터 바인딩 (중첩 객체, 배열, 조건문 처리)
      templateHTML = this.bindData(templateHTML, responseData);

      // 대상 요소에 삽입
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        console.error(`Target element not found: ${targetSelector}`);
        return;
      }

      targetElement.innerHTML = templateHTML;

      // script 태그 추출 및 실행 (responseData 전달)
      const scripts = targetElement.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        // responseData를 전역 변수로 제공
        const scriptContent = `
          (function(responseData) {
            ${oldScript.textContent}
          })(${JSON.stringify(responseData)});
        `;
        newScript.textContent = scriptContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    } catch (error) {
      console.error("Component load error:", error);
    }
  },

  /**
   * 고급 데이터 바인딩 함수
   * @param {string} template - 템플릿 HTML
   * @param {Object} data - 바인딩할 데이터
   * @returns {string} - 바인딩된 HTML
   */
  bindData: function (template, data) {
    // 1. if/else 조건문 처리
    template = this.processIfElse(template, data);

    // 2. 배열 반복 처리 (예: {{#each items}}...{{/each}})
    template = this.processEach(template, data);

    // 3. 일반 변수 치환 (중첩 객체 포함)
    template = this.interpolate(template, data);

    return template;
  },

  /**
   * {{#if condition}}...{{else}}...{{/if}} 조건문 처리
   */
  processIfElse: function (template, data) {
    return template.replace(
      /\{\{#if\s+(.*?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
      (match, keyPath, ifContent, elseContent) => {
        const value = this.getNestedValue(data, keyPath);
        if (value) {
          return ifContent || "";
        } else {
          return elseContent || "";
        }
      }
    );
  },

  /**
   * {{#each array}}...{{/each}} 블록 처리
   */
  processEach: function (template, data) {
    return template.replace(
      /\{\{#each\s+(.*?)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, keyPath, content) => {
        const array = this.getNestedValue(data, keyPath);
        if (!Array.isArray(array)) return "";

        return array
          .map((item) => {
            // item이 객체면 그대로 전달, 단순 값이면 {value: item} 형태로
            const itemData = typeof item === "object" ? item : { value: item };
            return this.interpolate(content, itemData);
          })
          .join("");
      }
    );
  },

  /**
   * 일반 변수 치환 (중첩 객체 지원)
   */
  interpolate: function (template, data) {
    return template.replace(/\{\{(.*?)\}\}/g, (match, keyPath) => {
      const value = this.getNestedValue(data, keyPath);
      return value !== undefined ? value : match;
    });
  },

  /**
   * 중첩 객체의 값을 가져오는 헬퍼 함수
   * 예: 'user.profile.name' -> data.user.profile.name
   */
  getNestedValue: function (obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  },
};
