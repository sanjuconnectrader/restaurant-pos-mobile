import { AxiosError, create, isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
export const API_URL = configured || 'https://react-native-backend-9ojm.onrender.com/api';
const api = create({ baseURL: API_URL, timeout: 15000 });
const bare = create({ baseURL: API_URL, timeout: 15000 });
const emailActions = new Set(['/auth/owner/register', '/auth/owner/resend-code', '/auth/owner/set-password', '/auth/owner/login', '/auth/owner/forgot-password']);

export type Session = { accessToken: string; refreshToken: string; expiresAt: string; user: User };
export type User = { id: string; username: string; firstName: string; lastName: string; role: string; restaurantId: string; email?: string; active?: boolean };
export type Me = { user: User; permissions: string[]; restaurant: { id: string; name: string; countryCode: string; currencyCode: string; locale: string; timezone: string } };
export type ApiResult<T> = { success: boolean; message: string; data: T };
let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshing: Promise<string | null> | null = null;
let onExpired: (() => void) | null = null;

export function setExpiredHandler(fn: () => void) { onExpired = fn; }
export async function saveSession(session: Session) {
  accessToken = session.accessToken; refreshToken = session.refreshToken;
  await SecureStore.setItemAsync('pos_session', JSON.stringify(session));
}
export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync('pos_session');
  if (!raw) return null;
  try { const session = JSON.parse(raw) as Session; accessToken = session.accessToken; refreshToken = session.refreshToken; return session; }
  catch { await clearSession(); return null; }
}
export async function clearSession() {
  accessToken = null; refreshToken = null;
  await SecureStore.deleteItemAsync('pos_session');
}
export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }
export async function revokeSession(access: string, refresh: string) {
  await bare.post('/auth/logout', { refreshToken: refresh }, { headers: { Authorization: `Bearer ${access}` }, timeout: 5000 });
}
export function messageOf(error: unknown) {
  if (isAxiosError(error)) return error.response?.data?.message || (error.code === 'ECONNABORTED' ? (error.config?.url && emailActions.has(error.config.url) ? 'Email request timed out. Check your inbox before retrying.' : 'Request timed out. Check your connection.') : `Cannot reach the POS server at ${API_URL}. Check your internet connection.`);
  return error instanceof Error ? error.message : 'Something went wrong';
}

api.interceptors.request.use((config) => { if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`; return config; });
api.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
  if (error.response?.status !== 401 || !refreshToken || !original || original._retried || original.url?.includes('/auth/refresh')) throw error;
  original._retried = true;
  const tokenBeingRefreshed = refreshToken;
  refreshing ||= bare.post<ApiResult<Session>>('/auth/refresh', { refreshToken: tokenBeingRefreshed }).then(async ({ data }) => {
    if (refreshToken !== tokenBeingRefreshed) return null;
    await saveSession(data.data); return data.data.accessToken;
  }).catch(async () => { await clearSession(); onExpired?.(); return null; }).finally(() => { refreshing = null; });
  const token = await refreshing;
  if (!token) throw error;
  original.headers!.Authorization = `Bearer ${token}`;
  return api(original);
});

export async function get<T>(path: string, params?: Record<string, string>) { return (await api.get<ApiResult<T>>(path, { params })).data.data; }
export async function post<T>(path: string, body?: unknown) { return (await api.post<ApiResult<T>>(path, body, { timeout: emailActions.has(path) ? 90000 : 15000 })).data.data; }
export async function patch<T>(path: string, body: unknown) { return (await api.patch<ApiResult<T>>(path, body)).data.data; }
export async function put<T>(path: string, body: unknown) { return (await api.put<ApiResult<T>>(path, body)).data.data; }
export async function del<T>(path: string) { return (await api.delete<ApiResult<T>>(path)).data.data; }
