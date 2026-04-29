import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach Bearer token ──────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function subscribeRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while another refresh is in flight
      return new Promise((resolve) => {
        subscribeRefresh((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          originalRequest._retry = true;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>(`${baseURL}/api/auth/refresh`, { refreshToken });
      useAuthStore.getState().setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      onRefreshed(data.accessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshErr) {
      useAuthStore.getState().clear();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Typed API endpoints ──────────────────────────────────────
export type LoginPayload = { email: string; password: string; tenantSlug?: string };
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>('/api/auth/login', payload),
  logout: (refreshToken: string) => api.post('/api/auth/logout', { refreshToken }),
  me: () => api.get<AuthUser & { lastLoginAt: string | null }>('/api/auth/me'),
};

export const tenantsApi = {
  me: () =>
    api.get<{
      id: string;
      name: string;
      slug: string;
      domain: string | null;
      logoUrl: string | null;
      createdAt: string;
    }>('/api/tenants/me'),
};
