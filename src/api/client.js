import axios from "axios";

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../utils/constants";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) throw new Error("No refresh token");
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/login/refresh/`,
        { refresh },
        { headers: { Accept: "application/json" }, timeout: 15000 }
      )
      .finally(() => {
        refreshPromise = null;
      });
  }
  const { data } = await refreshPromise;
  if (data?.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  }
  return data.access;
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent("metalinv:unauthorized"));
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const isAuthCall =
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/logout");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return client(original);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    }

    if (status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export default client;
