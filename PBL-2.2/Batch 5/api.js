import axios from "axios";
import { invalidate, keysForMutation } from "../utils/refresh";

export const API_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sweety_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Cache-Control"] = "no-cache";
  config.headers.Pragma = "no-cache";
  return config;
});

api.interceptors.response.use((response) => {
  const keys = keysForMutation(response.config);
  if (keys.length) queueMicrotask(() => invalidate(keys, { url: response.config.url }));
  return response;
});

export function fileUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
