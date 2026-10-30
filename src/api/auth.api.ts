/**
 * CampusOS Authentication API
 * Implements normal user login, admin login, and user profile retrieval.
 */

import { apiRequest, saveSession, clearSession, loadSession } from './client';
import { ApiError } from './errors';
import type { TokenResponse, UserProfile, AuthSession } from './types';

export interface LoginCredentials {
  email: string;
  otp: string;
  isAdmin?: boolean;
}

/**
 * Signs in user via /api/v1/auth/login or /api/v1/auth/admin/login.
 * If normal login receives USE_ADMIN_LOGIN error code, it routes to admin login.
 */
export async function loginUser({ email, otp, isAdmin = false }: LoginCredentials): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  const payload = {
    email_id: cleanEmail,
    otp: cleanOtp,
  };

  let tokenData: TokenResponse;

  if (isAdmin) {
    tokenData = await apiRequest<TokenResponse>('/api/v1/auth/admin/login', {
      method: 'POST',
      json: payload,
      skipAuth: true,
    });
  } else {
    try {
      tokenData = await apiRequest<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        json: payload,
        skipAuth: true,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'USE_ADMIN_LOGIN') {
        // Retry automatically against admin login if user is an admin
        tokenData = await apiRequest<TokenResponse>('/api/v1/auth/admin/login', {
          method: 'POST',
          json: payload,
          skipAuth: true,
        });
      } else {
        throw error;
      }
    }
  }

  // Calculate expiration time (defaults to 12 hours = 43200s if not specified)
  const expiresInSeconds = tokenData.expires_in || 43200;
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  // Build authenticated session
  const session: AuthSession = {
    accessToken: tokenData.access_token,
    expiresAt,
    user: {
      id: tokenData.profile.email_id,
      name: tokenData.profile.name,
      email: tokenData.profile.email_id,
      role: tokenData.profile.role,
      dept: tokenData.profile.dept,
    },
  };

  saveSession(session);
  return session;
}

/**
 * Retrieves the currently authenticated user profile from /api/v1/users/me.
 */
export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'GET',
    signal,
  });
}

/**
 * Signs out the current user by destroying the local session.
 */
export function logoutUser(): void {
  clearSession();
}

/**
 * Retrieves current active session.
 */
export function getActiveSession(): AuthSession | null {
  return loadSession();
}
