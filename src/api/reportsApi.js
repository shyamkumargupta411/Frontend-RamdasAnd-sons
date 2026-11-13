import client from "./client";

/** Dashboard aggregate data (10 sections). */
export const dashboardApi = {
  list: (params = {}) =>
    client.get("/dashboard/", { params }).then((r) => r.data),
};

/** Reports + low-stock thresholds. */
export const reportsApi = {
  list: (params = {}) =>
    client.get("/reports/", { params }).then((r) => r.data),
  excel: (params = {}) =>
    client.get("/reports/excel/", { params, responseType: "blob" }),
  thresholds: (params = {}) =>
    client.get("/thresholds/", { params }).then((r) => r.data),
  thresholdCreate: (payload) =>
    client.post("/thresholds/", payload).then((r) => r.data),
  thresholdUpdate: (id, payload) =>
    client.put(`/thresholds/${id}/`, payload).then((r) => r.data),
  thresholdDelete: (id) =>
    client.delete(`/thresholds/${id}/`),
};

/** Bulk material upload from Excel. */
export const bulkUploadApi = {
  preview: (file, shopId) => {
    const formData = new FormData();
    formData.append("file", file);
    if (shopId) formData.append("shop_id", shopId);
    return client.post("/reports/bulk-upload/preview/", formData).then((r) => r.data);
  },
  confirm: (payload) =>
    client.post("/reports/bulk-upload/confirm/", payload).then((r) => r.data),
};

/** Download Excel blob as a file. */
export function downloadExcel(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}