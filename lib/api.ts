import { ApiError } from "@/types";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";
console.log("API Base URL:", BASE_URL);
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ─── Client ──────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach JWT ────────────────────────────────────────

api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("Request to:", config.url, "with method:", config.method);
        return config;
    },
    (error) => {
        console.error("Request error:", error);
        return Promise.reject(error);
    },
);

// ─── Response interceptor — handle errors & token refresh ────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Token expired → try refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${data.accessToken}`;
        }

        return api(originalRequest);
      } catch {
        // Refresh failed — clear tokens and let the app redirect to sign-in
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }

    // Normalise error shape
    const apiError: ApiError = {
      message:
        error.response?.data?.message ??
        error.message ??
        "Something went wrong",
      code: error.response?.data?.code,
      status: error.response?.status,
    };

    return Promise.reject(apiError);
  },
);

// ─── Token helpers (used by authService) ─────────────────────────────────────

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const getAccessToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export default api;
