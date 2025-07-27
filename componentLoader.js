// gemini-test/componentLoader.js

/**
 * 지정된 HTML 템플릿을 로드하고 데이터를 바인딩하여 rootElementId에 해당하는 DOM 요소에 렌더링합니다.
 * 템플릿 내의 <script> 태그를 찾아 동적으로 실행합니다.
 * @param {string} rootElementId - 컴포넌트가 렌더링될 DOM 요소의 ID.
 * @param {string} templatePath - 로드할 HTML 템플릿 파일의 경로.
 * @param {Object} data - 템플릿에 바인딩할 데이터 객체. (예: { name: "World" })
 */
async function loadComponent(rootElementId, templatePath, data = {}) {
  const rootElement = document.getElementById(rootElementId);
  if (!rootElement) {
    console.error(`Error: Root element with ID "${rootElementId}" not found.`);
    return;
  }

  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let templateHtml = await response.text();

    window.responseData = data;

    // 임시 div를 사용하여 HTML 파싱
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = templateHtml;

    // 스크립트 태그를 추출하고 임시 div에서 제거
    const scripts = Array.from(tempDiv.querySelectorAll("script")); // NodeList를 Array로 변환
    scripts.forEach((script) => script.parentNode.removeChild(script));

    // 스크립트가 제거된 HTML을 rootElement에 삽입
    rootElement.innerHTML = tempDiv.innerHTML;

    // 추출된 스크립트들을 rootElement에 다시 추가하여 실행
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      //   if (oldScript.textContent) {
      //     // Wrap the script content in an IIFE to create a new scope
      //     newScript.textContent = `(function() {\n${oldScript.textContent}\n})();`;
      //   }
      // 새로운 스크립트를 rootElement에 추가하여 실행
      rootElement.appendChild(newScript);
    });

    console.log(
      `Component "${templatePath}" loaded into "${rootElementId}" successfully.`
    );
  } catch (error) {
    console.error(`Failed to load component from "${templatePath}":`, error);
    rootElement.innerHTML = `<p style="color: red;">Failed to load component: ${error.message}</p>`;
  }
}
