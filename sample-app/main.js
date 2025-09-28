import api from "./api.js";

const main = {
  init: () => {
    api.getUser().then((res) => {
      console.log(res);
    });

    // API 객체를 데이터와 함께 전달
    loadComponent("app-container", "template.html", {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      api: api, // API 객체를 데이터로 전달
    });
  },

  api: api,
};

main.init();
