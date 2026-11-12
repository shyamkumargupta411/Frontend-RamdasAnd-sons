import client from "./client";

/**
 * Auth + Owner user/shop management endpoints.
 * Paths match backend accounts.urls.
 */
export const authApi = {
  login: (username, password) =>
    client
      .post("/auth/login/", { username, password }, { _retry: false })
      .then((r) => r.data),
  refresh: (refresh) =>
    client
      .post("/auth/login/refresh/", { refresh }, { _retry: false })
      .then((r) => r.data),
  logout: (refresh) =>
    client
      .post("/auth/logout/", { refresh: refresh || "" }, { _retry: false })
      .then((r) => r.data),
  me: () => client.get("/auth/me/").then((r) => r.data),
};

export const userApi = {
  list: (params) => client.get("/users/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/users/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/users/", payload).then((r) => r.data),
  update: (id, payload) =>
    client.patch(`/users/${id}/`, payload).then((r) => r.data),
};

export const shopApi = {
  list: (params) => client.get("/shops/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/shops/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/shops/", payload).then((r) => r.data),
  update: (id, payload) =>
    client.patch(`/shops/${id}/`, payload).then((r) => r.data),
  remove: (id) => client.delete(`/shops/${id}/`).then((r) => r.data),
};
