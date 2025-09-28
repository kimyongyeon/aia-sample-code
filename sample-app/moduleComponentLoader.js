"use strict";

/**
 * 모듈 기반 컴포넌트 로더
 * ES6 모듈을 지원하는 동적 컴포넌트 로딩 시스템
 */
class ModuleComponentLoader {
  constructor() {
    this.components = new Map();
    this.modules = new Map();
  }

  /**
   * 모듈을 등록합니다
   * @param {string} name - 모듈 이름
   * @param {Object} module - 모듈 객체
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    console.log(`모듈 "${name}" 등록됨`);
  }

  /**
   * 등록된 모듈을 가져옵니다
   * @param {string} name - 모듈 이름
   * @returns {Object|null} 모듈 객체
   */
  getModule(name) {
    return this.modules.get(name) || null;
  }

  /**
   * 모든 등록된 모듈을 가져옵니다
   * @returns {Object} 모든 모듈을 포함하는 객체
   */
  getAllModules() {
    const modules = {};
    this.modules.forEach((module, name) => {
      modules[name] = module;
    });
    return modules;
  }

  /**
   * 컴포넌트를 로드하고 모듈을 주입합니다
   * @param {string} rootElementId - 렌더링할 DOM 요소 ID
   * @param {string} templatePath - 템플릿 파일 경로
   * @param {Object} data - 템플릿에 전달할 데이터
   * @param {Array<string>} moduleNames - 주입할 모듈 이름 배열
   */
  async loadComponent(
    rootElementId,
    templatePath,
    data = {},
    moduleNames = []
  ) {
    const rootElement = document.getElementById(rootElementId);
    if (!rootElement) {
      console.error(
        `Error: Root element with ID "${rootElementId}" not found.`
      );
      return;
    }

    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let templateHtml = await response.text();

      // 요청된 모듈들을 데이터에 추가
      const modules = {};
      moduleNames.forEach((name) => {
        const module = this.getModule(name);
        if (module) {
          modules[name] = module;
        }
      });

      // 모든 모듈을 포함한 데이터 객체 생성
      const componentData = {
        ...data,
        modules: modules,
        $modules: this.getAllModules(), // 모든 모듈에 접근 가능
      };

      // 전역에 컴포넌트 데이터 설정
      window.componentData = componentData;

      // HTML 파싱 및 스크립트 실행
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = templateHtml;

      const scripts = Array.from(tempDiv.querySelectorAll("script"));
      scripts.forEach((script) => script.parentNode.removeChild(script));

      rootElement.innerHTML = tempDiv.innerHTML;

      // 스크립트 실행
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // type="module"인 경우 모듈로 처리
        if (oldScript.type === "module") {
          newScript.type = "module";
          newScript.textContent = oldScript.textContent;
        } else {
          // 일반 스크립트의 경우 IIFE로 감싸서 스코프 분리
          newScript.textContent = `
            (function() {
              const { modules, $modules } = window.componentData;
              ${oldScript.textContent}
            })();
          `;
        }

        rootElement.appendChild(newScript);
      });

      console.log(
        `Component "${templatePath}" loaded with modules:`,
        moduleNames
      );
    } catch (error) {
      console.error(`Failed to load component from "${templatePath}":`, error);
      rootElement.innerHTML = `<p style="color: red;">Failed to load component: ${error.message}</p>`;
    }
  }
}

// 전역 인스턴스 생성
const moduleLoader = new ModuleComponentLoader();

// 전역 함수로 노출 (기존 호환성 유지)
window.loadModuleComponent = (
  rootElementId,
  templatePath,
  data,
  moduleNames
) => {
  return moduleLoader.loadComponent(
    rootElementId,
    templatePath,
    data,
    moduleNames
  );
};

export default moduleLoader;
