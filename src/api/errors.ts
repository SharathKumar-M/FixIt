/**
 * Centralized API Error Representation
 * Preserves backend error envelopes, HTTP statuses, and domain error codes.
 */

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }

  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }
}
