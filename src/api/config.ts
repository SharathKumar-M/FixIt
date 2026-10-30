/**
 * FixIt — Centralized API & Backend Configuration
 * Single source of truth for all API keys, base URLs, timeouts, and endpoint prefixes.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/+$/, '') || 'http://localhost:8000';

export const FIXIT_API_PREFIX: string =
  (import.meta.env.VITE_FIXIT_API_PREFIX as string) || '/api/v1/fixit';

export const AUTH_API_PREFIX: string =
  (import.meta.env.VITE_AUTH_API_PREFIX as string) || '/api/v1/auth';

export const USERS_API_PREFIX: string =
  (import.meta.env.VITE_USERS_API_PREFIX as string) || '/api/v1/users';

export const REQUEST_TIMEOUT_MS: number =
  Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS) || 25000;

export const TOKEN_EXPIRY_HOURS: number =
  Number(import.meta.env.VITE_TOKEN_EXPIRY_HOURS) || 12;

export const DEFAULT_PAGE_SIZE: number =
  Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 25;

export const MAX_UPLOAD_SIZE_MB: number =
  Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 10;

export const MAX_UPLOAD_SIZE_BYTES: number = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
