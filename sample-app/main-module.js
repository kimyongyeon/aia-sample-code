"use strict";

import api from "./api.js";
import moduleLoader from "./moduleComponentLoader.js";

const main = {
  init: async () => {
    console.log("모듈 기반 앱 초기화 시작");

    // 모듈 등록
    moduleLoader.registerModule("api", api);

    // 필요한 다른 모듈들도 등록 가능
    // moduleLoader.registerModule('utils', utils);
    // moduleLoader.registerModule('service', service);

    // API 테스트 호출
    try {
      const userData = await api.getUser();
      console.log("Main에서 API 호출 결과:", userData);
    } catch (error) {
      console.error("Main API 호출 실패:", error);
    }

    // 컴포넌트 로드 (API 모듈을 주입)
    await moduleLoader.loadComponent(
      "app-container",
      "template-with-modules.html",
      {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
        timestamp: new Date().toLocaleString(),
      },
      ["api"] // 주입할 모듈 이름들
    );
  },

  api: api,
  moduleLoader: moduleLoader,
};

// 전역에서 접근 가능하도록 (선택사항)
window.main = main;

main.init();
