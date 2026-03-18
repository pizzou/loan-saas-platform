import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
    }
    const msg =
      error.response?.data?.message ||
      error.message ||
      'An error occurred';
    return Promise.reject(new Error(msg));
  }
);

export default API;

/**
 * The backend wraps every response in ApiResponse<T>:
 *   { success: true, message: "...", data: <actual payload> }
 *
 * These helpers automatically unwrap .data so callers
 * receive the actual payload directly.
 */
const unwrap = (body: unknown): unknown => {
  if (body !== null && typeof body === 'object' && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  // fallback: return as-is (e.g. auth login returns data directly)
  return body;
};

export const get = (url: string) =>
  API.get(url).then((r) => unwrap(r.data));

export const post = (url: string, data?: unknown) =>
  API.post(url, data).then((r) => unwrap(r.data));

export const put = (url: string, data?: unknown) =>
  API.put(url, data).then((r) => unwrap(r.data));

export const del = (url: string) =>
  API.delete(url).then((r) => unwrap(r.data));
