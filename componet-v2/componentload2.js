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

      // 템플릿 내부의 다른 템플릿 호출 처리
      templateHTML = await this.processTemplateIncludes(
        templateHTML,
        responseData
      );

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
        // responseData와 replaceTemplate 함수를 전달
        const scriptContent = `
          (function(responseData, replaceTemplate) {
            ${oldScript.textContent}
          })(${JSON.stringify(
            responseData
          )}, window.componentLoad.replaceTemplate.bind(window.componentLoad, '${targetSelector}'));
        `;
        newScript.textContent = scriptContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    } catch (error) {
      console.error("Component load error:", error);
    }
  },

  /**
   * 템플릿을 동적으로 교체하는 함수
   * @param {string} targetSelector - 교체할 대상 셀렉터
   * @param {string} templateUrl - 새 템플릿 경로
   * @param {Object} responseData - 새 템플릿 데이터
   */
  replaceTemplate: function (targetSelector, templateUrl, responseData) {
    this.load(templateUrl, responseData, targetSelector);
  },

  /**
   * 템플릿 내부의 {{> templateName}} 호출 처리
   */
  processTemplateIncludes: async function (templateHTML, responseData) {
    const includeRegex = /\{\{>\s*([^}\s]+)(?:\s+([^}]+))?\}\}/g;
    let match;
    let newTemplateHTML = templateHTML;
    const promises = [];

    // 모든 include 찾기
    while ((match = includeRegex.exec(templateHTML)) !== null) {
      const [fullMatch, templatePath, dataPath] = match;
      const placeholder = fullMatch;

      // 데이터 경로가 지정되었으면 해당 데이터 사용, 아니면 전체 데이터
      const includeData = dataPath
        ? this.getNestedValue(responseData, dataPath)
        : responseData;

      // Promise로 템플릿 로드 및 처리
      const promise = this.loadIncludedTemplate(templatePath, includeData).then(
        (includedHTML) => {
          newTemplateHTML = newTemplateHTML.replace(placeholder, includedHTML);
        }
      );

      promises.push(promise);
    }

    // 모든 include 처리 완료 대기
    await Promise.all(promises);
    return newTemplateHTML;
  },

  /**
   * 포함된 템플릿 로드 및 처리
   */
  loadIncludedTemplate: async function (templatePath, data) {
    try {
      const response = await fetch(templatePath);
      if (!response.ok)
        throw new Error(`Include template load failed: ${response.statusText}`);

      let templateHTML = await response.text();

      // 중첩된 include도 처리
      templateHTML = await this.processTemplateIncludes(templateHTML, data);

      // 데이터 바인딩
      templateHTML = this.bindData(templateHTML, data);

      return templateHTML;
    } catch (error) {
      console.error("Include template error:", error);
      return `<div style="color: red;">Error loading template: ${templatePath}</div>`;
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

// 전역에서 접근할 수 있도록 설정
window.componentLoad = componentLoad;
