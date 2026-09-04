import { apiRequest, storeTokens, clearTokens, storeUserId } from './client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthTokens {
  user: AuthUser;
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export async function register(data: RegisterRequest): Promise<{ ok: boolean; error?: string }> {
  const result = await apiRequest<AuthTokens>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!result.ok) return { ok: false, error: result.error || 'Registration failed' };
  if (result.data) {
    await storeTokens(result.data.access, result.data.refresh);
    await storeUserId(result.data.user.id);
  }
  return { ok: true };
}

export async function login(data: LoginRequest): Promise<{ ok: boolean; error?: string }> {
  const result = await apiRequest<{ access: string; refresh: string }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!result.ok) return { ok: false, error: result.error || 'Login failed' };
  if (result.data) {
    await storeTokens(result.data.access, result.data.refresh);
    const meResult = await apiRequest<AuthUser>('/auth/me/');
    if (meResult.ok && meResult.data) {
      await storeUserId(meResult.data.id);
    }
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearTokens();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const result = await apiRequest<AuthUser>('/auth/me/');
  return result.ok ? result.data : null;
}
