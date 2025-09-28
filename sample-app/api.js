const api = {
  getUser: () => {
    return Promise.resolve({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
    });
  },
};

export default api;
