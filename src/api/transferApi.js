import client from "./client";

/** Stock transfer lifecycle: create/draft, dispatch, receive, cancel. */
export const transferApi = {
  list: (params) => client.get("/transfers/", { params }).then((r) => r.data),
  retrieve: (id) => client.get(`/transfers/${id}/`).then((r) => r.data),
  create: (payload) =>
    client.post("/transfers/", payload).then((r) => r.data),
  dispatch: (id) =>
    client.post(`/transfers/${id}/dispatch/`, {}).then((r) => r.data),
  receive: (id, payload) =>
    client.post(`/transfers/${id}/receive/`, payload).then((r) => r.data),
  cancel: (id) =>
    client.post(`/transfers/${id}/cancel/`, {}).then((r) => r.data),
  inTransit: () =>
    client.get("/transfers/in_transit/").then((r) => r.data),
};
