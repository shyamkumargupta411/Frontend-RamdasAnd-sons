import client from "./client";

/** Stock levels + stock-in receipts (inventory endpoints). */
export const stockApi = {
  levels: (params) => client.get("/stock-levels/", { params }).then((r) => r.data),
};

export const receiptApi = {
  list: (params) => client.get("/stock-receipts/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/stock-receipts/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/stock-receipts/", payload).then((r) => r.data),
};

/** Customer returns: PENDING -> ACCEPTED (restock) / REJECTED. */
export const returnApi = {
  list: (params) => client.get("/returns/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/returns/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/returns/", payload).then((r) => r.data),
  accept: (id) => client.post(`/returns/${id}/accept/`).then((r) => r.data),
  reject: (id, note = "") =>
    client.post(`/returns/${id}/reject/`, { note }).then((r) => r.data),
};

/** Manual stock adjustments (immutable history). */
export const adjustmentApi = {
  list: (params) =>
    client.get("/stock-adjustments/", { params }).then((r) => r.data),
  retrieve: (id) =>
    client.get(`/stock-adjustments/${id}/`).then((r) => r.data),
  create: (payload) =>
    client.post("/stock-adjustments/", payload).then((r) => r.data),
};
