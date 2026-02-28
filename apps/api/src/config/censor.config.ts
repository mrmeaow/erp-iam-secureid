/**
 * Fields that must never appear in logs or serialized API responses.
 * Values are replaced with the string "[REDACTED]".
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'hashed_password',
  'passwordHash',
  'hashedPassword',
  'secret',
  'secret_key',
  'secretKey',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'token',
  'jwt',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'otp',
  'pin',
  'smtpPassword',
  'smtp_password',
]);

const REDACTED = '[REDACTED]' as const;

/**
 * Deep-clones an object and replaces all sensitive field values with [REDACTED].
 * - Handles plain objects and arrays recursively.
 * - Does NOT mutate the original object.
 */
export function censorObject<T extends Record<string, unknown>>(obj: T): T {
  return _censor(obj) as T;
}

function _censor(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(_censor);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = SENSITIVE_KEYS.has(k) ? REDACTED : _censor(v);
    }
    return result;
  }
  return value;
}

/**
 * Censors an object then serialises it to JSON.
 * Use instead of JSON.stringify() when output may reach logs or HTTP responses.
 */
export function safeJsonStringify(value: unknown, space?: number): string {
  const censored =
    value !== null && typeof value === 'object' ? _censor(value) : value;
  return JSON.stringify(censored, null, space);
}

/** Returns true if the given key should be treated as sensitive. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

/** Adds additional runtime keys to the sensitive set (e.g. from config). */
export function registerSensitiveKeys(keys: string[]): void {
  keys.forEach((k) => SENSITIVE_KEYS.add(k));
}
