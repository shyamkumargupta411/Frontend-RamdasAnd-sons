import client from "./client";

export const productApi = {
  list: (params) => client.get("/products/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/products/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/products/", payload).then((r) => r.data),
  update: (id, payload) =>
    client.patch(`/products/${id}/`, payload).then((r) => r.data),
};

export const categoryApi = {
  list: (params) =>
    client.get("/product-categories/", { params }).then((r) => r.data),
  retrieve: (id) =>
    client.get(`/product-categories/${id}/`).then((r) => r.data),
  create: (payload) =>
    client.post("/product-categories/", payload).then((r) => r.data),
  update: (id, payload) =>
    client.patch(`/product-categories/${id}/`, payload).then((r) => r.data),
};

export const unitApi = {
  list: () => client.get("/units/").then((r) => r.data),
};

export const variantApi = {
  list: (params) =>
    client.get("/product-variants/", { params }).then((r) => r.data),
};
