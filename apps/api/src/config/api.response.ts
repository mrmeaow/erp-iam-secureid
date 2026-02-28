import { HttpStatus } from '@nestjs/common';

// ── Response envelope ──────────────────────────────────────────────────────

export interface ApiMeta {
  timestamp: string;
  path?: string;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta: ApiMeta;
  error?: ApiErrorPayload;
}

export interface ApiErrorPayload {
  code: string;       // Machine-readable error code, e.g. "VALIDATION_ERROR"
  details?: unknown;  // Additional context (validation errors, etc.)
}

// ── Builder helpers ────────────────────────────────────────────────────────

export function buildSuccess<T>(
  data: T,
  message = 'OK',
  statusCode: number = HttpStatus.OK,
  meta: Partial<ApiMeta> = {},
): ApiResponse<T> {
  return {
    success: true,
    statusCode,
    message,
    data,
    meta: { timestamp: new Date().toISOString(), ...meta },
  };
}

export function buildError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
  meta: Partial<ApiMeta> = {},
): ApiResponse<null> {
  return {
    success: false,
    statusCode,
    message,
    data: null,
    meta: { timestamp: new Date().toISOString(), ...meta },
    error: { code, details },
  };
}
