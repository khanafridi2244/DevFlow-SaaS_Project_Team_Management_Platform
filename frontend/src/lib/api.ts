import axios from "axios";

// In dev, Vite's proxy (vite.config.ts) forwards /api to localhost:4000,
// so requests can just use relative paths — no hardcoded backend URL
// needed here, and this same code works unchanged in production once
// the frontend and API are deployed behind the same domain/reverse proxy.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends the HTTP-only auth cookies on every request
});

// Every one of your backend's ApiResponse objects has this exact shape
// ({ success, message, data }) — matching it here means every API call
// in the app gets consistent typing instead of `any`.
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Runs once: if any request comes back 401 (access token expired), try
// refreshing the session once via /api/auth/refresh, then retry the
// original request. This mirrors exactly how refreshSession works on
// the backend — silent token rotation, no visible interruption to the
// user unless the refresh token itself is also invalid/expired.
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request already triggered a refresh — wait for it
        // instead of firing a second, redundant refresh call.
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        isRefreshing = false;
        refreshQueue.forEach((cb) => cb());
        refreshQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshQueue = [];
        // Refresh token itself is invalid/expired — genuinely logged out.
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);