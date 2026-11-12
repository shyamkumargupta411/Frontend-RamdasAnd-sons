import client from "./client";

/** Sales: create (JSON or FormData), list, correct, employees. */
export const salesApi = {
  list: (params) => client.get("/sales/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/sales/${id}/`).then((r) => r.data),
  create: (payload) => client.post("/sales/", payload).then((r) => r.data),
  correct: (id, payload) =>
    client.post(`/sales/${id}/correct/`, payload).then((r) => r.data),
  employees: () => client.get("/sales/employees/").then((r) => r.data),
};
