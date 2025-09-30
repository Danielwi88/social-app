import axios from "axios";
import { getToken } from "./storage";

const baseURL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim()) ||
  "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      "data" in payload
    ) {
      return { ...response, data: (payload as { data: unknown }).data };
    }
    return response;
  },
  (error) => Promise.reject(error)
);
