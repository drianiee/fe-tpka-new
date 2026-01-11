// lib/api/client.ts
import axios from "axios";
import { getToken, clearToken } from "@/lib/utils/storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) clearToken();
    return Promise.reject(err);
  }
);
